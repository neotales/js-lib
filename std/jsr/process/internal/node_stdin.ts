import { readError } from "./read_error.ts";

type ReadCallback = (error: Error | null, bytesRead: number) => void;
type NodeRead = (
  fd: number,
  buffer: Uint8Array,
  offset: number,
  length: number,
  position: number | null,
  callback: ReadCallback,
) => void;
type NodeReadSync = (
  fd: number,
  buffer: Uint8Array,
  offset: number,
  length: number,
  position: number | null,
) => number;

/**
 * Builds the Node stdin reader used by the package's exported `stdin` value.
 *
 * @param fd The host's stdin file descriptor.
 * @param readAsync Node-compatible asynchronous read operation.
 * @param readSync Node-compatible synchronous read operation.
 * @param isatty Node-compatible terminal check.
 * @returns A standard input reader backed by the supplied host operations.
 */
export function createNodeStdinReader(
  fd: number,
  readAsync: NodeRead,
  readSync: NodeReadSync,
  isatty: (fd: number) => boolean,
): {
  read(data: Uint8Array): Promise<number | null>;
  readSync(data: Uint8Array): number | null;
  isTerm(): boolean;
  close(): void;
} {
  function readAsyncChunk(buffer: Uint8Array): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      readAsync(fd, buffer, 0, buffer.length, null, (error, bytesRead) => {
        if (error) reject(error);
        else resolve(bytesRead);
      });
    });
  }

  return {
    async read(data: Uint8Array): Promise<number | null> {
      try {
        const count = await readAsyncChunk(data);
        return count === 0 ? null : count;
      } catch (error) {
        return readError(error);
      }
    },
    readSync(data: Uint8Array): number | null {
      try {
        const count = readSync(fd, data, 0, data.length, null);
        return count === 0 ? null : count;
      } catch (error) {
        return readError(error);
      }
    },
    isTerm(): boolean {
      return isatty(fd);
    },
    close(): void {},
  };
}
