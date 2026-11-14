/**
 * Utiltity functions for working with character buffers.
 *
 * @module
 */
/**
 * Converts a string to a Uint32Array of characters.
 * Each element represents a Unicode code point, properly handling
 * characters outside the BMP (like emoji) that use surrogate pairs.
 * @param s The string to convert.
 * @returns The Uint32Array of characters (code points)
 */
export function toCharArray(s) {
    const len = s.length;
    // Allocate max possible size (all BMP characters = s.length)
    // Actual size will be <= len since surrogate pairs reduce the count
    const result = new Uint32Array(len);
    let j = 0;
    for (let i = 0; i < len; i++) {
        const code = s.charCodeAt(i);
        // Check for high surrogate (0xD800-0xDBFF)
        if (code >= 0xd800 && code <= 0xdbff && i + 1 < len) {
            const low = s.charCodeAt(i + 1);
            // Check for low surrogate (0xDC00-0xDFFF)
            if (low >= 0xdc00 && low <= 0xdfff) {
                // Combine surrogate pair into code point
                result[j++] = ((code - 0xd800) << 10) + (low - 0xdc00) + 0x10000;
                i++; // Skip the low surrogate
                continue;
            }
        }
        result[j++] = code;
    }
    // Return exact-sized array if we had surrogate pairs, otherwise return as-is
    return j < len ? result.subarray(0, j) : result;
}
/**
 * Converts a CharBuffer to a string.
 * @param buffer The character buffer to convert.
 * @returns The string.
 */
export function toString(buffer) {
    if (typeof buffer === "string") {
        return buffer;
    }
    if (buffer instanceof Uint32Array) {
        return String.fromCodePoint(...buffer);
    }
    if (buffer instanceof Uint16Array) {
        const codePoints = new Uint32Array(buffer.buffer);
        return String.fromCodePoint(...codePoints);
    }
    if (buffer instanceof Uint8Array) {
        const codePoints = new Uint32Array(buffer.buffer);
        return String.fromCodePoint(...codePoints);
    }
    const codePoints = new Uint32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        codePoints[i] = buffer.at(i) ?? 0;
    }
    return String.fromCodePoint(...codePoints);
}
/**
 * Converts a CharBuffer to a CharSliceLike interface.
 * @param buffer The character buffer to convert.
 * @returns The slice.
 */
export function toCharSliceLike(buffer) {
    if (typeof buffer === "string") {
        const buf = toCharArray(buffer);
        return {
            at(i) {
                return buf.at(i);
            },
            length: buf.length,
        };
    }
    if (buffer instanceof Uint32Array) {
        return buffer;
    }
    if (buffer instanceof Uint16Array) {
        const buf = new Uint32Array(buffer.buffer);
        return buf;
    }
    if (buffer instanceof Uint8Array) {
        const buf = new Uint32Array(buffer.buffer);
        return buf;
    }
    return buffer;
}
