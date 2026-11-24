/**
 * Splits a string into an array of substrings based on a specified separator.
 *
 * @param str - The input string, Uint8Array, or Uint32Array.
 * @param separator - The separator string or regular expression.
 * @param trim - Optional. Specifies whether to trim the resulting substrings and
 * filter out empty strings. Defaults to `false`.
 * @param limit - Optional. The maximum number of substrings to return.
 * @returns An array of substrings.
 */
export function split(str, separator, trim = false, limit) {
    if (str instanceof Uint8Array) {
        str = new TextDecoder().decode(str);
    }
    if (str instanceof Uint32Array) {
        str = String.fromCodePoint(...str);
    }
    const result = str.split(separator, limit);
    if (trim) {
        return result.map((x) => x.trim()).filter((x) => x.length > 0);
    }
    return result;
}
