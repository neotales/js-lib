import { getBuiltinModule, globals } from "./_globals.ts";
import { createNodeStdinReader } from "./internal/node_stdin.ts";

function logFallback(message: string, error = false): void {
  if (globals.print) {
    globals.print(message);
  } else if (error) {
    console.error(message);
  } else {
    console.log(message);
  }
}

function decodeChunk(chunk: Uint8Array): string {
  if (typeof TextDecoder !== "undefined") return new TextDecoder().decode(chunk);

  let result = "";
  for (let index = 0; index < chunk.length;) {
    const first = chunk[index++]!;
    if (first < 0x80) {
      result += String.fromCharCode(first);
      continue;
    }
    let codePoint: number;
    let continuationCount: number;
    let minimum: number;
    if (first >= 0xc2 && first <= 0xdf) {
      codePoint = first & 0x1f;
      continuationCount = 1;
      minimum = 0x80;
    } else if (first >= 0xe0 && first <= 0xef) {
      codePoint = first & 0x0f;
      continuationCount = 2;
      minimum = 0x800;
    } else if (first >= 0xf0 && first <= 0xf4) {
      codePoint = first & 0x07;
      continuationCount = 3;
      minimum = 0x10000;
    } else {
      result += "\ufffd";
      continue;
    }

    let valid = true;
    for (let count = 0; count < continuationCount; count++) {
      const next = chunk[index];
      if (next === undefined || (next & 0xc0) !== 0x80) {
        valid = false;
        break;
      }
      index++;
      codePoint = (codePoint << 6) | (next & 0x3f);
    }
    if (
      !valid ||
      codePoint < minimum ||
      codePoint > 0x10ffff ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      result += "\ufffd";
      continue;
    }
    result += String.fromCodePoint(codePoint);
  }
  return result;
}

/**
 * A standard output writer, which represents the standard
 * output or error stream of the process.
 */
export interface StdWriter extends Record<string, unknown> {
  /**
   * Writes the specified chunk of data to the stream.
   * @param chunk The data to write.
   * @returns A promise for the number of bytes written. The promise does not guarantee
   * non-blocking I/O or cancellation. In QuickJS-ng, this calls synchronous FILE I/O
   * before returning the promise.
   */
  write(chunk: Uint8Array): Promise<number>;
  /**
   * Writes the specified chunk of data to the stream synchronously.
   * @param chunk The data to write.
   * @returns The number of bytes written.
   */
  writeSync(chunk: Uint8Array): number;
  /**
   * Checks if stream is TTY (terminal).
   *
   * @returns True if the stream is a terminal; otherwise, false.
   */
  isTerm(): boolean;
  /**
   * Closes the stream, if applicable.
   */
  close(): void;
}

/**
 * A standard input reader, which represents the standard input
 * stream of the process.
 */
export interface StdReader extends Record<string, unknown> {
  /**
   * Reads a chunk of data from the stream.
   * @param data The chunk to read data into.
   * @returns A promise for the number of bytes read, or `null` at end of stream. The promise
   * does not guarantee non-blocking I/O or cancellation. In QuickJS-ng, this calls
   * synchronous FILE I/O before returning the promise.
   */
  read(data: Uint8Array): Promise<number | null>;
  /**
   * Reads a chunk of data from the stream synchronously.
   * @param data The chunk to read data into.
   */
  readSync(data: Uint8Array): number | null;

  isTerm(): boolean;

  /**
   * Closes the stream, if applicable.
   */
  close(): void;
}

let stdinValue: StdReader = {
  /**
   * Reads a chunk of data from the stream.
   * @param data The chunk to read data into.
   */
  read(_data: Uint8Array): Promise<number | null> {
    return Promise.resolve(null);
  },

  /**
   * Reads a chunk of data from the stream synchronously.
   * @param data The chunk to read data into.
   */
  readSync(_data: Uint8Array): number | null {
    return null;
  },
  isTerm(): boolean {
    return false;
  },

  /**
   * Closes the stream, if applicable.
   */
  close(): void {},
};

/**
 * A standard output writer, which represents the standard
 * output for the current process.
 */
let stdoutValue: StdWriter = {
  buffer: "",
  /**
   * Writes the specified chunk of data to the stream.
   * @param chunk The data to write.
   */
  write(chunk: Uint8Array): Promise<number> {
    if (chunk.length === 0) return Promise.resolve(0);
    return new Promise((resolve) => {
      let msg = decodeChunk(chunk);
      let buffer = this.buffer as string;
      if (msg.includes("\n")) {
        const messages = msg.split("\n");
        for (let i = 0; i < messages.length - 1; i++) {
          if (buffer.length > 0) {
            logFallback(buffer + messages[i]);
            this.buffer = buffer = "";
            continue;
          }

          logFallback(messages[i]);
        }

        msg = messages[messages.length - 1];
      }

      if (!msg.endsWith("\n")) {
        this.buffer += msg;
        resolve(chunk.length);
      } else {
        this.buffer = "";
        const lines = buffer + msg;
        logFallback(lines);
        resolve(chunk.length);
      }
    });
  },
  /**
   * Writes the specified chunk of data to the stream synchronously.
   * @param chunk The data to write.
   */
  writeSync(chunk: Uint8Array): number {
    if (chunk.length === 0) return 0;
    let msg = decodeChunk(chunk);
    let buffer = this.buffer as string;
    if (msg.includes("\n")) {
      const messages = msg.split("\n");
      for (let i = 0; i < messages.length - 1; i++) {
        if (buffer.length > 0) {
          logFallback(buffer + messages[i]);
          this.buffer = buffer = "";
          continue;
        }

        logFallback(messages[i]);
      }

      msg = messages[messages.length - 1];
    }

    if (!msg.endsWith("\n")) {
      this.buffer += msg;
    } else {
      this.buffer = "";
      const lines = buffer + msg;
      logFallback(lines);
    }

    return chunk.length;
  },

  /**
   * Checks if stream is TTY (terminal).
   *
   * @returns True if the stream is a terminal; otherwise, false.
   */
  isTerm(): boolean {
    return false;
  },
  close(): void {},
};

/**
 * A standard error writer, which represents the standard error
 * stream of the process.
 */
let stderrValue: StdWriter = {
  buffer: "",
  /**
   * Writes the specified chunk of data to the stream.
   * @param chunk The data to write.
   */
  write(chunk: Uint8Array): Promise<number> {
    if (chunk.length === 0) return Promise.resolve(0);
    return new Promise((resolve) => {
      const msg = decodeChunk(chunk);
      const buffer = this.buffer as string;

      if (!msg.endsWith("\n")) {
        this.buffer += msg;
        resolve(chunk.length);
      } else {
        this.buffer = "";
        const lines = buffer + msg;
        logFallback(lines, true);
        resolve(chunk.length);
      }
    });
  },
  /**
   * Writes the specified chunk of data to the stream synchronously.
   * @param chunk The data to write.
   */
  writeSync(chunk: Uint8Array): number {
    if (chunk.length === 0) return 0;
    const msg = decodeChunk(chunk);
    const buffer = this.buffer as string;

    if (!msg.endsWith("\n")) {
      this.buffer += msg;
    } else {
      this.buffer = "";
      const lines = buffer + msg;
      logFallback(lines, true);
    }

    return chunk.length;
  },
  /**
   * Checks if stream is TTY (terminal).
   *
   * @returns True if the stream is a terminal; otherwise, false.
   */
  isTerm(): boolean {
    return false;
  },
  close(): void {},
};

const deno = globals.Deno;
if (deno) {
  stdoutValue = {
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    write(chunk: Uint8Array): Promise<number> {
      return deno.stdout.write(chunk);
    },

    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    writeSync(chunk: Uint8Array): number {
      return deno.stdout.writeSync(chunk);
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm(): boolean {
      return deno.stdout.isTerminal();
    },
    /**
     * Closes the stream, if applicable.
     */
    close(): void {
      deno.stdout.close();
    },
  };

  stderrValue = {
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    write(chunk: Uint8Array): Promise<number> {
      return deno.stderr.write(chunk);
    },
    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    writeSync(chunk: Uint8Array): number {
      return deno.stderr.writeSync(chunk);
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm(): boolean {
      return deno.stderr.isTerminal();
    },
    /**
     * Closes the stream, if applicable.
     */
    close(): void {
      deno.stderr.close();
    },
  };

  stdinValue = {
    /**
     * Reads a chunk of data from the stream.
     * @param data The chunk to read data into.
     */
    read(data: Uint8Array): Promise<number | null> {
      return deno.stdin.read(data);
    },
    /**
     * Reads a chunk of data from the stream synchronously.
     * @param data The chunk to read data into.
     */
    readSync(data: Uint8Array): number | null {
      return deno.stdin.readSync(data);
    },
    isTerm(): boolean {
      return deno.stdin.isTerminal();
    },

    /**
     * Closes the stream, if applicable.
     */
    close(): void {
      deno.stdin.close();
    },
  };
} else if (globals.std && globals.os) {
  const std = globals.std;
  const os = globals.os;
  const readFile = (file: typeof std.in, data: Uint8Array): number | null => {
    if (data.length === 0) return 0;
    const bytes = new Uint8Array(data.length);
    const count = file.read(bytes.buffer, 0, bytes.length);
    if (count > 0) data.set(bytes.subarray(0, count));
    return count === 0 ? null : count;
  };
  const writeFile = (file: typeof std.out, data: Uint8Array): number => {
    if (data.length === 0) return 0;
    return file.write(data.slice().buffer, 0, data.length);
  };
  const fileReader = (file: typeof std.in): StdReader => ({
    read: (data) => Promise.resolve(readFile(file, data)),
    readSync: (data) => readFile(file, data),
    isTerm: () => os.isatty(file.fileno()),
    // QuickJS FILE handles for stdio reject close; they are host-owned.
    close() {},
  });
  const fileWriter = (file: typeof std.out): StdWriter => ({
    write: (data) => Promise.resolve(writeFile(file, data)),
    writeSync: (data) => writeFile(file, data),
    isTerm: () => os.isatty(file.fileno()),
    close() {},
  });
  stdinValue = fileReader(std.in);
  stdoutValue = fileWriter(std.out);
  stderrValue = fileWriter(std.err);
} else if (globals.tjs) {
  const runtime = globals.tjs;
  const reader = runtime.stdin.getReader();
  let remainder: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  const makeWriter = (stream: typeof runtime.stdout): StdWriter => {
    const writer = stream.getWriter();
    return {
      async write(data) {
        await writer.write(data);
        return data.length;
      },
      writeSync(data) {
        if (data.length === 0) return 0;
        throw new Error("synchronous writes are not provided by txiki.js streams");
      },
      isTerm: () => false,
      close() {},
    };
  };
  stdinValue = {
    async read(data) {
      if (data.length === 0) return 0;
      if (remainder.length === 0) {
        const result = await reader.read();
        if (result.done || !result.value) return null;
        remainder = result.value;
      }
      const count = Math.min(data.length, remainder.length);
      data.set(remainder.subarray(0, count));
      remainder = remainder.subarray(count);
      return count;
    },
    readSync(data) {
      if (data.length === 0) return null;
      throw new Error("synchronous reads are not provided by txiki.js streams");
    },
    isTerm: () => false,
    close() {},
  };
  stdoutValue = makeWriter(runtime.stdout);
  stderrValue = makeWriter(runtime.stderr);
} else if (globals.process) {
  // @ts-types="npm:@types/node@^22.17.0"
  const process = globals.process as NodeJS.Process;
  // The Node builtins are resolved synchronously so this module stays a plain script.
  // Top-level `await import()` here would make every importer an async module, which
  // engines without top-level await (JerryScript, bare ClearScript hosts, iife bundles)
  // reject at parse time even though these branches never run for them.
  const fsBuiltin = getBuiltinModule<typeof import("node:fs")>("node:fs");
  const ttyBuiltin = getBuiltinModule<typeof import("node:tty")>("node:tty");

  if (!fsBuiltin || !ttyBuiltin) {
    throw new Error(
      "The process streams require a Node-compatible host that implements process.getBuiltinModule.",
    );
  }

  const fs = fsBuiltin;
  const tty = ttyBuiltin;

  stdoutValue = {
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    write(chunk: Uint8Array): Promise<number> {
      return new Promise<number>((resolve, reject) => {
        process.stdout.write(chunk, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(chunk.length);
          }
        });
      });
    },
    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    writeSync(chunk: Uint8Array): number {
      return fs.writeSync(process.stdout.fd, chunk);
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm(): boolean {
      return tty.isatty(process.stdout.fd);
    },
    close(): void {},
  };

  stderrValue = {
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     */
    write(chunk: Uint8Array): Promise<number> {
      return new Promise<number>((resolve, reject) => {
        process.stderr.write(chunk, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(chunk.length);
          }
        });
      });
    },
    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     */
    writeSync(chunk: Uint8Array): number {
      return fs.writeSync(process.stderr.fd, chunk);
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm(): boolean {
      return tty.isatty(process.stderr.fd);
    },
    close(): void {},
  };

  stdinValue = createNodeStdinReader(
    process.stdin.fd,
    fs.read.bind(fs),
    fs.readSync.bind(fs),
    tty.isatty.bind(tty),
  );
}

/**
 * The standard input stream of the process. The input
 * stream is a reader that can be used to read data for
 * a process. The file descriptor for the standard input
 * on Unix is 0, and on Windows it is CONIN$.
 */
export const stdin: StdReader = stdinValue;
/**
 * The standard output stream of the process. The output
 * stream is a writer that can be used to write data. The
 * file descriptor for the standard output on Unix is 1,
 * and on Windows it is CONOUT$.
 */
export const stdout: StdWriter = stdoutValue;
/**
 * The standard error stream of the process. The error
 * stream is a writer that can be used to write error
 * data. The file descriptor for the standard error on
 * Unix is 2, and on Windows it is CONOUT$.
 *
 * The standard error stream is used to write most than
 * just error messages. It is also used to write
 * diagnostic messages, warnings, progress messages, and
 * other information that is not part of the normal
 * output of the program.
 */
export const stderr: StdWriter = stderrValue;
