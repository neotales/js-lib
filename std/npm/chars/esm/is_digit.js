import { Nd } from "./tables/nd.js";
import { is16, is32 } from "./tables/latin1.js";
/**
 * Checks if the given value is a decimal digit.
 *
 * A decimal digit is a character in the Unicode `Nd` (Decimal_Number)
 * category. Numerals in the other number categories are not digits: a
 * superscript numeral such as `\u00B2` (`²`) and a fraction such as
 * `\u00BC` (`¼`) both return `false`.
 *
 * @param char - The value to check.
 * @returns `true` if the value is a decimal digit, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isDigit } from '@neotales/chars/is-digit';
 *
 * console.log(isDigit('5'.charCodeAt(0))); // true
 * console.log(isDigit('a'.charCodeAt(0))); //  false
 * console.log(isDigit(0x00b2)); // false, superscript two is No
 * console.log(isDigit(0x00bc)); // false, one quarter is No
 * ```
 */
export function isDigit(char) {
    if (Number.isInteger(char) === false || char < 0 || char > 0x10ffff) {
        return false;
    }
    if (char < 256) {
        return char >= 0x30 && char <= 0x39;
    }
    const hi = Nd.R16[Nd.R16.length - 1][1];
    if (char <= hi) {
        return is16(Nd.R16, char);
    }
    const lo = Nd.R32[0][0];
    if (char >= lo) {
        return is32(Nd.R32, char);
    }
    return false;
}
/**
 * Determines whether the given character is a decimal digit (`Nd`).
 *
 * @param char The character to check.
 * @returns `true` if the character is a decimal digit; otherwise, `false`.
 *
 * @example
 * ```ts
 * import { isDigitUnsafe } from "@neotales/chars/is-digit";
 *
 * console.log(isDigitUnsafe(0x10FFFF)); //  false
 * console.log(isDigitUnsafe(0.32)); //  false
 * console.log(isDigitUnsafe(10)); //  true
 * ```
 */
export function isDigitUnsafe(char) {
    if (char < 256) {
        return char >= 0x30 && char <= 0x39;
    }
    const hi = Nd.R16[Nd.R16.length - 1][1];
    if (char <= hi) {
        return is16(Nd.R16, char);
    }
    const lo = Nd.R32[0][0];
    if (char >= lo) {
        return is32(Nd.R32, char);
    }
    return false;
}
/**
 * Checks if the character at the specified index in the given string is a
 * decimal digit (`Nd`).
 *
 * @param value - The string to check.
 * @param index - The index of the character to check.
 * @returns `true` if the character at the specified index is a decimal digit, `false` otherwise.
 * @example
 * ```typescript
 * import { isDigitAt } from "@neotales/chars/is-digit";
 *
 * const str = "Hello, world!";
 * const index = 4;
 * const isDigit = isDigitAt(str, index);
 * console.log(isDigit); //  false
 *
 * const str1 = "Hello, 123!";
 * const index1 = 8;
 * const isDigit1 = isDigitAt(str1, index1);
 * console.log(isDigit1); //  true
 *
 * ```
 */
export function isDigitAt(value, index) {
    const code = value.codePointAt(index) ?? 0;
    return isDigitUnsafe(code);
}
