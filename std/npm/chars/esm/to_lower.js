import { CaseRanges } from "./tables/case.js";
import { MAX_RUNE } from "./constants.js";
/**
 * Converts the given Unicode code point to its lowercase equivalent.
 * If is uppercase, the lowercase character code point is returned; otherwise,
 * the original character code point is returned.
 *
 * @param char - The Unicode code point to convert to lowercase.
 * @returns The lowercase equivalent of the given Unicode code point.
 *
 * @example
 * ```typescript
 * import { toLower } from '@neotales/chars';
 *
 * console.log(toLower(65)); //  97
 * console.log(toLower(97)); //  97
 * console.log(toLower(48)); //  48
 * ```
 */
export function toLower(char) {
    if (char < 128) {
        if (char >= 65 && char <= 90) {
            return char + 32;
        }
        return char;
    }
    let lo = 0;
    let hi = CaseRanges.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        const range = CaseRanges[mid];
        const l = range[0];
        const h = range[1];
        const d = range[2];
        if (l <= char && char <= h) {
            const delta = d[1];
            if (delta > MAX_RUNE) {
                return ((l + (char - l)) & ~1) | (1 & 1);
            }
            return char + delta;
        }
        if (char < l) {
            hi = mid;
        }
        else {
            lo = mid + 1;
        }
    }
    return char;
}
/**
 * Converts the given Unicode code point to its lowercase equivalent from the given index.
 * If is uppercase, the lowercase character code point is returned; otherwise,
 * the original character code point is returned.
 *
 * If the index is out of range, the value will default to 0, which is the min character.
 *
 * @param value - The string value.
 * @param index - The index of the character
 * @returns The lowercase equivalent of the given Unicode code point.
 *
 * @example
 * ```typescript
 * import { toLowerAt } from '@neotales/chars';
 *
 * const str = "HELLO"
 *
 * console.log(str.charCodeAt(0)); // 72
 * console.log(toLowerAt(str, 0)); // 104
 *
 * // doesn't exist
 * console.log(toLowerAt(str, 20)); // 0
 * ```
 */
export function toLowerAt(value, index) {
    const code = value.codePointAt(index) ?? 0;
    return toLower(code);
}
