/**
 * The is-space module provides functions to check if a string
 * is null, undefined, empty, or only contains whitespace.
 *
 * This module includes the following functions:
 * - `isSpace`: Determines whether the string only contains whitespace.
 * - `isNullOrSpace`: Determines whether the string is null, undefined, empty,
 *   or only contains whitespace.
 * @module
 */
import { isSpaceAt } from "@neotales/chars/is-space";
/**
 * Determines whether the string only contains whitespace.
 * @param s The string to check.
 * @returns `true` if the string only contains whitespace; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { isSpace } from "@neotales/strings";
 *
 * isSpace("   ");      // true
 * isSpace("\t\n");     // true
 * isSpace("");         // true (empty is considered whitespace)
 * isSpace(" hello ");  // false
 * ```
 */
export function isSpace(s) {
    for (let i = 0; i < s.length; i++) {
        if (!isSpaceAt(s, i)) {
            return false;
        }
    }
    return true;
}
/**
 * Determines whether the string is null, undefined, empty, or only contains whitespace.
 * @param s The string to check.
 * @returns `true` if the string is null, undefined, empty, or
 * only contains whitespace; otherwise, `false`.
 */
export function isNullOrSpace(s) {
    if (s === null || s === undefined || s.length === 0) {
        return true;
    }
    for (let i = 0; i < s.length; i++) {
        if (!isSpaceAt(s, i)) {
            return false;
        }
    }
    return true;
}
