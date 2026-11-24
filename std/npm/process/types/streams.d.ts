import "./_dnt.polyfills.js";
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
/**
 * The standard input stream of the process. The input
 * stream is a reader that can be used to read data for
 * a process. The file descriptor for the standard input
 * on Unix is 0, and on Windows it is CONIN$.
 */
export declare const stdin: StdReader;
/**
 * The standard output stream of the process. The output
 * stream is a writer that can be used to write data. The
 * file descriptor for the standard output on Unix is 1,
 * and on Windows it is CONOUT$.
 */
export declare const stdout: StdWriter;
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
export declare const stderr: StdWriter;
