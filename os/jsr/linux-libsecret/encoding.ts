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
export function assertText(label: string, value: string): void {
  if (value.includes("\0")) {
    throw new RangeError(`${label} must not contain a NUL character.`);
  }
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new RangeError(`${label} must not contain an unpaired surrogate.`);
      }
      index++;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new RangeError(`${label} must not contain an unpaired surrogate.`);
    }
  }
}

/**
 * Decodes UTF-8 without dropping a leading BOM.
 *
 * @param value UTF-8 bytes.
 * @param label Value name used in the error.
 * @returns The decoded text, preserving U+FEFF.
 * @throws {RangeError} If the bytes are not valid UTF-8.
 */
export function decodeUtf8(value: Uint8Array, label = "text"): string {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(value);
  } catch {
    throw new RangeError(`${label} must be valid UTF-8.`);
  }
}

/**
 * Decodes a byte secret as UTF-8, rejecting NUL and malformed sequences.
 *
 * @param value Secret bytes.
 * @returns The decoded text.
 * @throws {RangeError} If the bytes contain NUL or are not valid UTF-8.
 */
export function decodeSecretText(value: Uint8Array): string {
  for (const byte of value) {
    if (byte === 0) throw new RangeError("secret must not contain a NUL byte.");
  }
  const text = decodeUtf8(value, "secret");
  assertText("secret", text);
  return text;
}
