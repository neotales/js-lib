import "./_dnt.polyfills.js";
import { getBuiltinModule, globals } from "./_globals.js";
import { createNodeStdinReader } from "./internal/node_stdin.js";
function logFallback(message, error = false) {
    if (globals.print) {
        globals.print(message);
    }
    else if (error) {
        console.error(message);
    }
    else {
        console.log(message);
    }
}
function decodeChunk(chunk) {
    if (typeof TextDecoder !== "undefined")
        return new TextDecoder().decode(chunk);
    let result = "";
    for (let index = 0; index < chunk.length;) {
        const first = chunk[index++];
        if (first < 0x80) {
            result += String.fromCharCode(first);
            continue;
        }
        let codePoint;
        let continuationCount;
        let minimum;
        if (first >= 0xc2 && first <= 0xdf) {
            codePoint = first & 0x1f;
            continuationCount = 1;
            minimum = 0x80;
        }
        else if (first >= 0xe0 && first <= 0xef) {
            codePoint = first & 0x0f;
            continuationCount = 2;
            minimum = 0x800;
        }
        else if (first >= 0xf0 && first <= 0xf4) {
            codePoint = first & 0x07;
            continuationCount = 3;
            minimum = 0x10000;
        }
        else {
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
        if (!valid ||
            codePoint < minimum ||
            codePoint > 0x10ffff ||
            (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
            result += "\ufffd";
            continue;
        }
        result += String.fromCodePoint(codePoint);
    }
    return result;
}
let stdinValue = {
    /**
     * Reads a chunk of data from the stream.
     * @param data The chunk to read data into.
     */
    read(_data) {
        return Promise.resolve(null);
    },
    /**
     * Reads a chunk of data from the stream synchronously.
     * @param data The chunk to read data into.
     */
    readSync(_data) {
        return null;
    },
    isTerm() {
        return false;
    },
    /**
     * Closes the stream, if applicable.
     */
    close() { },
};
/**
 * A standard output writer, which represents the standard
 * output for the current process.
 */
let stdoutValue = {
    buffer: "",
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     */
    write(chunk) {
        if (chunk.length === 0)
            return Promise.resolve(0);
        return new Promise((resolve) => {
            let msg = decodeChunk(chunk);
            let buffer = this.buffer;
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
            }
            else {
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
    writeSync(chunk) {
        if (chunk.length === 0)
            return 0;
        let msg = decodeChunk(chunk);
        let buffer = this.buffer;
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
        }
        else {
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
    isTerm() {
        return false;
    },
    close() { },
};
/**
 * A standard error writer, which represents the standard error
 * stream of the process.
 */
let stderrValue = {
    buffer: "",
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     */
    write(chunk) {
        if (chunk.length === 0)
            return Promise.resolve(0);
        return new Promise((resolve) => {
            const msg = decodeChunk(chunk);
            const buffer = this.buffer;
            if (!msg.endsWith("\n")) {
                this.buffer += msg;
                resolve(chunk.length);
            }
            else {
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
    writeSync(chunk) {
        if (chunk.length === 0)
            return 0;
        const msg = decodeChunk(chunk);
        const buffer = this.buffer;
        if (!msg.endsWith("\n")) {
            this.buffer += msg;
        }
        else {
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
    isTerm() {
        return false;
    },
    close() { },
};
const deno = globals.Deno;
if (deno) {
    stdoutValue = {
        /**
         * Writes the specified chunk of data to the stream.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        write(chunk) {
            return deno.stdout.write(chunk);
        },
        /**
         * Writes the specified chunk of data to the stream synchronously.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        writeSync(chunk) {
            return deno.stdout.writeSync(chunk);
        },
        /**
         * Checks if stream is TTY (terminal).
         *
         * @returns True if the stream is a terminal; otherwise, false.
         */
        isTerm() {
            return deno.stdout.isTerminal();
        },
        /**
         * Closes the stream, if applicable.
         */
        close() {
            deno.stdout.close();
        },
    };
    stderrValue = {
        /**
         * Writes the specified chunk of data to the stream.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        write(chunk) {
            return deno.stderr.write(chunk);
        },
        /**
         * Writes the specified chunk of data to the stream synchronously.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        writeSync(chunk) {
            return deno.stderr.writeSync(chunk);
        },
        /**
         * Checks if stream is TTY (terminal).
         *
         * @returns True if the stream is a terminal; otherwise, false.
         */
        isTerm() {
            return deno.stderr.isTerminal();
        },
        /**
         * Closes the stream, if applicable.
         */
        close() {
            deno.stderr.close();
        },
    };
    stdinValue = {
        /**
         * Reads a chunk of data from the stream.
         * @param data The chunk to read data into.
         */
        read(data) {
            return deno.stdin.read(data);
        },
        /**
         * Reads a chunk of data from the stream synchronously.
         * @param data The chunk to read data into.
         */
        readSync(data) {
            return deno.stdin.readSync(data);
        },
        isTerm() {
            return deno.stdin.isTerminal();
        },
        /**
         * Closes the stream, if applicable.
         */
        close() {
            deno.stdin.close();
        },
    };
}
else if (globals.std && globals.os) {
    const std = globals.std;
    const os = globals.os;
    const readFile = (file, data) => {
        if (data.length === 0)
            return 0;
        const bytes = new Uint8Array(data.length);
        const count = file.read(bytes.buffer, 0, bytes.length);
        if (count > 0)
            data.set(bytes.subarray(0, count));
        return count === 0 ? null : count;
    };
    const writeFile = (file, data) => {
        if (data.length === 0)
            return 0;
        return file.write(data.slice().buffer, 0, data.length);
    };
    const fileReader = (file) => ({
        read: (data) => Promise.resolve(readFile(file, data)),
        readSync: (data) => readFile(file, data),
        isTerm: () => os.isatty(file.fileno()),
        // QuickJS FILE handles for stdio reject close; they are host-owned.
        close() { },
    });
    const fileWriter = (file) => ({
        write: (data) => Promise.resolve(writeFile(file, data)),
        writeSync: (data) => writeFile(file, data),
        isTerm: () => os.isatty(file.fileno()),
        close() { },
    });
    stdinValue = fileReader(std.in);
    stdoutValue = fileWriter(std.out);
    stderrValue = fileWriter(std.err);
}
else if (globals.tjs) {
    const runtime = globals.tjs;
    const reader = runtime.stdin.getReader();
    let remainder = new Uint8Array(0);
    const makeWriter = (stream) => {
        const writer = stream.getWriter();
        return {
            async write(data) {
                await writer.write(data);
                return data.length;
            },
            writeSync(data) {
                if (data.length === 0)
                    return 0;
                throw new Error("synchronous writes are not provided by txiki.js streams");
            },
            isTerm: () => false,
            close() { },
        };
    };
    stdinValue = {
        async read(data) {
            if (data.length === 0)
                return 0;
            if (remainder.length === 0) {
                const result = await reader.read();
                if (result.done || !result.value)
                    return null;
                remainder = result.value;
            }
            const count = Math.min(data.length, remainder.length);
            data.set(remainder.subarray(0, count));
            remainder = remainder.subarray(count);
            return count;
        },
        readSync(data) {
            if (data.length === 0)
                return null;
            throw new Error("synchronous reads are not provided by txiki.js streams");
        },
        isTerm: () => false,
        close() { },
    };
    stdoutValue = makeWriter(runtime.stdout);
    stderrValue = makeWriter(runtime.stderr);
}
else if (globals.process) {
    // @ts-types="npm:@types/node@^22.17.0"
    const process = globals.process;
    // The Node builtins are resolved synchronously so this module stays a plain script.
    // Top-level `await import()` here would make every importer an async module, which
    // engines without top-level await (JerryScript, bare ClearScript hosts, iife bundles)
    // reject at parse time even though these branches never run for them.
    const fsBuiltin = getBuiltinModule("node:fs");
    const ttyBuiltin = getBuiltinModule("node:tty");
    if (!fsBuiltin || !ttyBuiltin) {
        throw new Error("The process streams require a Node-compatible host that implements process.getBuiltinModule.");
    }
    const fs = fsBuiltin;
    const tty = ttyBuiltin;
    stdoutValue = {
        /**
         * Writes the specified chunk of data to the stream.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        write(chunk) {
            return new Promise((resolve, reject) => {
                process.stdout.write(chunk, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
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
        writeSync(chunk) {
            return fs.writeSync(process.stdout.fd, chunk);
        },
        /**
         * Checks if stream is TTY (terminal).
         *
         * @returns True if the stream is a terminal; otherwise, false.
         */
        isTerm() {
            return tty.isatty(process.stdout.fd);
        },
        close() { },
    };
    stderrValue = {
        /**
         * Writes the specified chunk of data to the stream.
         * @param chunk The data to write.
         */
        write(chunk) {
            return new Promise((resolve, reject) => {
                process.stderr.write(chunk, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(chunk.length);
                    }
                });
            });
        },
        /**
         * Writes the specified chunk of data to the stream synchronously.
         * @param chunk The data to write.
         */
        writeSync(chunk) {
            return fs.writeSync(process.stderr.fd, chunk);
        },
        /**
         * Checks if stream is TTY (terminal).
         *
         * @returns True if the stream is a terminal; otherwise, false.
         */
        isTerm() {
            return tty.isatty(process.stderr.fd);
        },
        close() { },
    };
    stdinValue = createNodeStdinReader(process.stdin.fd, fs.read.bind(fs), fs.readSync.bind(fs), tty.isatty.bind(tty));
}
/**
 * The standard input stream of the process. The input
 * stream is a reader that can be used to read data for
 * a process. The file descriptor for the standard input
 * on Unix is 0, and on Windows it is CONIN$.
 */
export const stdin = stdinValue;
/**
 * The standard output stream of the process. The output
 * stream is a writer that can be used to write data. The
 * file descriptor for the standard output on Unix is 1,
 * and on Windows it is CONOUT$.
 */
export const stdout = stdoutValue;
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
export const stderr = stderrValue;
