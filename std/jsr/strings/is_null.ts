/**
 * The is-null module provides functions to check if a string is null.
 * @module
 */

/**
 * Determines whether the string is null.
 * @param s The string to check.
 * @returns `true` if the string is null; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { isNull } from "@neotales/strings";
 *
 * isNull(null);    // true
 * isNull("");      // false
 * isNull("hello"); // false
 * ```
 */
export function isNull(s: string | null): s is null {
  return s === null;
}
