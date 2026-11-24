import { simpleFold } from "./simple_fold.js";
/**
 * Compares two characters for equality under simple case folding
 * which is a more general form of case-insensitivity.
 *
 * A `Char` is a number, but only integer code points from `0` to `0x10FFFF`
 * are valid. If either argument is fractional, `NaN`, infinite, negative, or
 * above `0x10FFFF`, the result is `false`; the function does not throw.
 *
 * @param a The first character to compare.
 * @param b The second character to compare.
 * @returns `true` if the characters are equal under simple case folding;
 * `false` otherwise, including when either argument is not a valid code point.
 *
 * @example
 * ```ts
 * import { equalFold } from "@neotales/chars";
 *
 * console.log(equalFold(0x41, 0x61)); // true ('A' and 'a')
 * console.log(equalFold(0xDF, 0x1E9E)); // true ('ß' and 'ẞ')
 * console.log(equalFold(0x1C4, 0x1C6)); // true ('Ǆ' and 'ǆ')
 * console.log(equalFold(0x1F88, 0x1F80)); // true ('ᾈ' and 'ᾀ')
 * console.log(equalFold(0x41, 0x42)); // false ('A' and 'B')
 * ```
 */
export function equalFold(a, b) {
    if (!Number.isInteger(a) || a < 0 || a > 0x10ffff ||
        !Number.isInteger(b) || b < 0 || b > 0x10ffff) {
        return false;
    }
    if (a === b) {
        return true;
    }
    if (a < 128 && b < 128) {
        if (a >= 65 && a <= 90) {
            a += 32;
        }
        if (b >= 65 && b <= 90) {
            b += 32;
        }
        return a === b;
    }
    // Walk the full simple-fold orbit. A single step is not enough: an orbit
    // can have three or more members, and either argument may be any member.
    let folded = a;
    do {
        folded = simpleFold(folded);
        if (folded === b) {
            return true;
        }
    } while (folded !== a);
    return false;
}
