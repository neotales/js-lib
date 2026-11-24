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
export function readU32(buf: Uint8Array, offset = 0): number {
  return (
    (buf[offset] |
      (buf[offset + 1] << 8) |
      (buf[offset + 2] << 16) |
      (buf[offset + 3] << 24)) >>> 0
  );
}

/**
 * Writes a little-endian unsigned 32-bit integer into a buffer.
 *
 * @param buf The buffer to write to.
 * @param value The value to write.
 * @param offset The byte offset to write at.
 */
export function writeU32(buf: Uint8Array, value: number, offset = 0): void {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >> 8) & 0xff;
  buf[offset + 2] = (value >> 16) & 0xff;
  buf[offset + 3] = (value >> 24) & 0xff;
}

/**
 * Reads a little-endian unsigned 64-bit integer from a buffer.
 *
 * @param buf The buffer to read from.
 * @param offset The byte offset to read at.
 * @returns The decoded unsigned 64-bit integer.
 */
export function readU64(buf: Uint8Array, offset = 0): bigint {
  const lo = BigInt(readU32(buf, offset));
  const hi = BigInt(readU32(buf, offset + 4));
  return (hi << 32n) | lo;
}
