/**
 * The is-empty module provides functions to check if a string is empty or null.
 *
 * @module
 */

/**
 * Determines whether the string is empty.
 * @param s The string to check.
 * @returns `true` if the string is empty; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { isEmpty } from "@neotales/strings";
 *
 * isEmpty("");       // true
 * isEmpty("hello");  // false
 * isEmpty(" ");      // false (whitespace is not empty)
 * ```
 */
export function isEmpty(s: string): s is "" {
  return s.length === 0;
}

/**
 * Determines whether the string is null, undefined, or empty.
 * @param s The string to check.
 * @returns `true` if the string is null or undefined or empty; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { isNullOrEmpty } from "@neotales/strings";
 *
 * isNullOrEmpty(null);      // true
 * isNullOrEmpty(undefined); // true
 * isNullOrEmpty("");        // true
 * isNullOrEmpty("hello");   // false
 * isNullOrEmpty(" ");       // false (whitespace is not empty)
 * ```
 */
export function isNullOrEmpty(s?: string | null): s is undefined | null | "" {
  return s === null || s === undefined || s.length === 0;
}
