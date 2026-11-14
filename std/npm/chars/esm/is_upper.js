import { is16, is32, latin1, pLu } from "./tables/latin1.js";
import { Lu } from "./tables/lu.js";
/**
 * Determines if the given character is an uppercase letter.
 *
 * @param char The character to check.
 * @returns `true` if the character is an uppercase letter; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { isUpper } from "@neotales/chars";
 *
 * console.log(isUpper(0x41)); // true 'A'
 * console.log(isUpper(0x61)); // false 'a'
 * console.log(isUpper(0x0391)); // true 'Α'
 * console.log(isUpper(0x03B1)); // false 'α'
 * ```
 */
export function isUpper(char) {
    if (Number.isInteger(char) === false || char < 0 || char > 0x10ffff) {
        return false;
    }
    if (char < 256) {
        return (latin1[char] & pLu) !== 0;
    }
    const hi = Lu.R16[Lu.R16.length - 1][1];
    if (char <= hi) {
        return is16(Lu.R16, char);
    }
    const lo = Lu.R32[0][0];
    if (char >= lo) {
        return is32(Lu.R32, char);
    }
    return false;
}
/**
 * Determines if the given character is an uppercase letter. Unsafe version
 * assumes valid input.
 *
 * @param char The character to check.
 * @returns `true` if the character is an uppercase letter, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isUpper } from "@neotales/chars";
 *
 * console.log(isUpper(0x41)); // true 'A'
 * console.log(isUpper(0x61)); // false 'a'
 * console.log(isUpper(0x0391)); // true 'Α'
 * console.log(isUpper(0x03B1)); // false 'α'
 * ```
 */
export function isUpperUnsafe(char) {
    if (char < 256) {
        return (latin1[char] & pLu) !== 0;
    }
    const hi = Lu.R16[Lu.R16.length - 1][1];
    if (char <= hi) {
        return is16(Lu.R16, char);
    }
    const lo = Lu.R32[0][0];
    if (char >= lo) {
        return is32(Lu.R32, char);
    }
    return false;
}
/**
 * Determines if the character at the specified index in the string is an
 * uppercase letter.
 *
 * @param str The string to check.
 * @param index The index of the character to check.
 * @returns `true` if the character at the specified index is an uppercase letter,
 * `false` otherwise.
 * @example
 * ```typescript
 * import { isUpperAt } from "@neotales/chars";
 *
 * console.log(isUpperAt("Hello", 0)); // true 'H'
 * console.log(isUpperAt("Hello", 1)); // false 'e'
 * console.log(isUpperAt("Αθήνα", 0)); // true 'Α'
 * console.log(isUpperAt("Αθήνα", 1)); // false 'θ'
 * ```
 */
export function isUpperAt(str, index) {
    const code = str.codePointAt(index) ?? 0;
    return isUpperUnsafe(code);
}
