import { readError } from "./read_error.js";
/**
 * Builds the Node stdin reader used by the package's exported `stdin` value.
 *
 * @param fd The host's stdin file descriptor.
 * @param readAsync Node-compatible asynchronous read operation.
 * @param readSync Node-compatible synchronous read operation.
 * @param isatty Node-compatible terminal check.
 * @returns A standard input reader backed by the supplied host operations.
 */
export function createNodeStdinReader(fd, readAsync, readSync, isatty) {
    function readAsyncChunk(buffer) {
        return new Promise((resolve, reject) => {
            readAsync(fd, buffer, 0, buffer.length, null, (error, bytesRead) => {
                if (error)
                    reject(error);
                else
                    resolve(bytesRead);
            });
        });
    }
    return {
        async read(data) {
            try {
                const count = await readAsyncChunk(data);
                return count === 0 ? null : count;
            }
            catch (error) {
                return readError(error);
            }
        },
        readSync(data) {
            try {
                const count = readSync(fd, data, 0, data.length, null);
                return count === 0 ? null : count;
            }
            catch (error) {
                return readError(error);
            }
        },
        isTerm() {
            return isatty(fd);
        },
        close() { },
    };
}
