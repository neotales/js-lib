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
export declare function isSpace(s: string): boolean;
/**
 * Determines whether the string is null, undefined, empty, or only contains whitespace.
 * @param s The string to check.
 * @returns `true` if the string is null, undefined, empty, or
 * only contains whitespace; otherwise, `false`.
 */
export declare function isNullOrSpace(s?: string | null): s is null | undefined | "";
