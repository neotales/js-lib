type ReadCallback = (error: Error | null, bytesRead: number) => void;
type NodeRead = (fd: number, buffer: Uint8Array, offset: number, length: number, position: number | null, callback: ReadCallback) => void;
type NodeReadSync = (fd: number, buffer: Uint8Array, offset: number, length: number, position: number | null) => number;
/**
 * Builds the Node stdin reader used by the package's exported `stdin` value.
 *
 * @param fd The host's stdin file descriptor.
 * @param readAsync Node-compatible asynchronous read operation.
 * @param readSync Node-compatible synchronous read operation.
 * @param isatty Node-compatible terminal check.
 * @returns A standard input reader backed by the supplied host operations.
 */
export declare function createNodeStdinReader(fd: number, readAsync: NodeRead, readSync: NodeReadSync, isatty: (fd: number) => boolean): {
    read(data: Uint8Array): Promise<number | null>;
    readSync(data: Uint8Array): number | null;
    isTerm(): boolean;
    close(): void;
};
export {};
