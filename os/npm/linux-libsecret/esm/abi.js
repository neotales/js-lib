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
/**
 * Maps a runtime architecture name to a pointer width.
 *
 * @param arch Runtime architecture, such as `"x86_64"` or `"ia32"`.
 * @returns The width, or `null` when the name is unknown.
 */
export function widthFromArch(arch) {
    switch (arch) {
        case "x86_64":
        case "amd64":
        case "x64":
        case "aarch64":
        case "arm64":
        case "ppc64":
        case "s390x":
            return 64;
        case "x86":
        case "ia32":
        case "i386":
        case "i686":
        case "arm":
        case "armv7":
        case "ppc":
        case "s390":
            return 32;
        default:
            return null;
    }
}
/**
 * Detects the host pointer width without assuming 64-bit.
 *
 * @returns The detected width, or `null` when no runtime source is known.
 */
export function detectPointerWidth() {
    const global = globalThis;
    // Runtime build arch describes the process, not the host uname. Do not use
    // navigator.platform or navigator.userAgentData.bitness: a 32-bit process
    // can run on a 64-bit host and those values describe the host.
    return widthFromArch(global.Deno?.build?.arch) ??
        widthFromArch(global.process?.arch);
}
/**
 * Maps an FFI type size to a pointer width.
 *
 * @param size Byte size reported by the FFI implementation.
 * @returns The width, or `null` for an unknown size.
 */
export function widthFromByteSize(size) {
    if (size === 8)
        return 64;
    if (size === 4)
        return 32;
    return null;
}
/**
 * Detects the running process byte order.
 *
 * Typed arrays share the process byte order, so this describes the ABI rather
 * than a host name.
 *
 * @returns The byte order, or `null` when the probe is inconclusive.
 */
export function detectEndianness() {
    const bytes = new Uint8Array(new Uint16Array([1]).buffer);
    if (bytes[0] === 1 && bytes[1] === 0)
        return "little";
    if (bytes[0] === 0 && bytes[1] === 1)
        return "big";
    return null;
}
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
export function requireLibsecretAbi(width, endianness) {
    if (width !== 64) {
        throw new Error(`libsecret requires a verified 64-bit process pointer/gsize ABI; detected ${width ? `${width}-bit` : "unknown"}`);
    }
    if (endianness !== "little") {
        throw new Error(`libsecret requires a verified little-endian process ABI; detected ${endianness ?? "unknown"}`);
    }
    return 64;
}
/** @deprecated Use {@link requireLibsecretAbi}. */
export function requireLittleEndian64(width, endianness) {
    return requireLibsecretAbi(width, endianness);
}
/**
 * Requires the 64-bit ABI used by enumeration.
 *
 * @param width Detected width.
 * @returns `64`.
 * @throws {Error} When the width is unknown or 32-bit.
 */
export function require64Bit(width) {
    if (width !== 64) {
        throw new Error(`libsecret enumeration requires a verified 64-bit pointer/gsize ABI; detected ${width ?? "unknown"}`);
    }
    return 64;
}
/**
 * Reads a `gsize` from a native output buffer.
 *
 * @param buffer Buffer written by the native call.
 * @param width Verified pointer width.
 * @returns The size as a safe integer.
 * @throws {RangeError} When the value does not fit a safe integer.
 */
export function readGSize(buffer, width) {
    const value = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        .getBigUint64(0, true);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new RangeError("libsecret returned a gsize larger than Number.MAX_SAFE_INTEGER");
    }
    return Number(value);
}
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
export function copyExactBytes(length, readByte) {
    if (!Number.isSafeInteger(length) || length < 0 || length > 0x7fffffff) {
        throw new RangeError(`libsecret returned an invalid secret length: ${length}`);
    }
    if (length === 0)
        return new Uint8Array(0);
    const out = new Uint8Array(length);
    for (let index = 0; index < length; index++)
        out[index] = readByte(index);
    return out;
}
