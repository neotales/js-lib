/**
 * Allocation-free little-endian binary conversion helpers shared by the FFI
 * backends.
 *
 * Values are composed directly from `Uint8Array` bytes with bitwise
 * operations instead of constructing `DataView` instances, so reading and
 * writing scalars never allocates.
 *
 * @module
 * @internal
 */
/**
 * Reads a little-endian unsigned 32-bit integer from a buffer.
 *
 * @param buf The buffer to read from.
 * @param offset The byte offset to read at.
 * @returns The decoded unsigned 32-bit integer.
 */
export declare function readU32(buf: Uint8Array, offset?: number): number;
/**
 * Writes a little-endian unsigned 32-bit integer into a buffer.
 *
 * @param buf The buffer to write to.
 * @param value The value to write.
 * @param offset The byte offset to write at.
 */
export declare function writeU32(buf: Uint8Array, value: number, offset?: number): void;
/**
 * Reads a little-endian unsigned 64-bit integer from a buffer.
 *
 * @param buf The buffer to read from.
 * @param offset The byte offset to read at.
 * @returns The decoded unsigned 64-bit integer.
 */
export declare function readU64(buf: Uint8Array, offset?: number): bigint;
