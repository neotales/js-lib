/**
 * Text validation for the libsecret API.
 *
 * libsecret takes NUL-terminated UTF-8 C strings. A JavaScript string with an
 * embedded NUL would be truncated, and an invalid byte sequence would be
 * silently replaced, so both are rejected before any native call.
 *
 * @module
 * @internal
 */
/**
 * Rejects NUL and unpaired UTF-16 surrogates in a string.
 *
 * @param label Value name used in the error.
 * @param value String to validate.
 * @throws {RangeError} If the value cannot be encoded without loss.
 */
export declare function assertText(label: string, value: string): void;
/**
 * Decodes UTF-8 without dropping a leading BOM.
 *
 * @param value UTF-8 bytes.
 * @param label Value name used in the error.
 * @returns The decoded text, preserving U+FEFF.
 * @throws {RangeError} If the bytes are not valid UTF-8.
 */
export declare function decodeUtf8(value: Uint8Array, label?: string): string;
/**
 * Decodes a byte secret as UTF-8, rejecting NUL and malformed sequences.
 *
 * @param value Secret bytes.
 * @returns The decoded text.
 * @throws {RangeError} If the bytes contain NUL or are not valid UTF-8.
 */
export declare function decodeSecretText(value: Uint8Array): string;
