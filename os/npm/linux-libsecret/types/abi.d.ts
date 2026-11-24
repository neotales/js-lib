/**
 * Pointer and gsize handling for libsecret enumeration.
 *
 * The enumeration ABI is only implemented for a verified 64-bit host. Guessing
 * 8-byte reads on a 32-bit process would read adjacent memory, so an unknown
 * or 32-bit width fails closed instead.
 *
 * @module
 * @internal
 */
/** A verified pointer width. */
export type PointerWidth = 32 | 64;
/**
 * Maps a runtime architecture name to a pointer width.
 *
 * @param arch Runtime architecture, such as `"x86_64"` or `"ia32"`.
 * @returns The width, or `null` when the name is unknown.
 */
export declare function widthFromArch(arch: string | undefined): PointerWidth | null;
/**
 * Detects the host pointer width without assuming 64-bit.
 *
 * @returns The detected width, or `null` when no runtime source is known.
 */
export declare function detectPointerWidth(): PointerWidth | null;
/**
 * Maps an FFI type size to a pointer width.
 *
 * @param size Byte size reported by the FFI implementation.
 * @returns The width, or `null` for an unknown size.
 */
export declare function widthFromByteSize(size: number | undefined): PointerWidth | null;
/** The byte order of the running process. */
export type Endianness = "little" | "big";
/**
 * Detects the running process byte order.
 *
 * Typed arrays share the process byte order, so this describes the ABI rather
 * than a host name.
 *
 * @returns The byte order, or `null` when the probe is inconclusive.
 */
export declare function detectEndianness(): Endianness | null;
/**
 * Requires the only ABI this backend can parse safely.
 *
 * Ordinary lookup/store/clear also read GError and pointer outputs at 8-byte
 * little-endian offsets, so every operation uses this gate, not just
 * enumeration.
 *
 * @param width Verified pointer width.
 * @param endianness Verified byte order.
 * @returns `64`.
 * @throws {Error} When the ABI is 32-bit, big-endian, or unknown.
 */
export declare function requireLibsecretAbi(width: PointerWidth | null, endianness: Endianness | null): 64;
/** @deprecated Use {@link requireLibsecretAbi}. */
export declare function requireLittleEndian64(width: PointerWidth | null, endianness: Endianness | null): 64;
/**
 * Requires the 64-bit ABI used by enumeration.
 *
 * @param width Detected width.
 * @returns `64`.
 * @throws {Error} When the width is unknown or 32-bit.
 */
export declare function require64Bit(width: PointerWidth | null): 64;
/**
 * Reads a `gsize` from a native output buffer.
 *
 * @param buffer Buffer written by the native call.
 * @param width Verified pointer width.
 * @returns The size as a safe integer.
 * @throws {RangeError} When the value does not fit a safe integer.
 */
export declare function readGSize(buffer: Uint8Array, width: 64): number;
/**
 * Copies exactly `length` bytes from a native pointer.
 *
 * Native secret data is not necessarily NUL terminated, so the copy never
 * scans for a terminator and preserves embedded NUL bytes.
 *
 * @param length Exact byte count returned by the native call.
 * @param readByte Reader for one byte at an offset.
 * @returns A byte-for-byte copy.
 * @throws {RangeError} When the length is not a safe non-negative bound.
 */
export declare function copyExactBytes(length: number, readByte: (index: number) => number): Uint8Array;
