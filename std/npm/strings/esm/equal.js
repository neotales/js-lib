/**
 * The equal module provides functions to compare strings for equality.
 * It includes case-sensitive and case-insensitive comparison functions.
 *
 * @module
 */
import { equal as og, equalFold as ogFold } from "@neotales/slices/equal";
/**
 * Determines whether the string is equal to the specified other string.
 * @param value The string to compare.
 * @param other The other string to compare.
 * @returns `true` if the strings are equal; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { equal } from "@neotales/strings";
 *
 * equal("hello", "hello");  // true
 * equal("hello", "Hello");  // false (case-sensitive)
 * equal("hello", "world");  // false
 * ```
 */
export function equal(value, other) {
    return og(value, other);
}
/**
 * Determines whether the string is equal to the specified other string
 * using case-insensitive comparison.
 *
 * @param value The string to compare.
 * @param other The other string to compare.
 * @returns `true` if the strings are equal; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { equalFold } from "@neotales/strings";
 *
 * equalFold("hello", "HELLO");       // true
 * equalFold("Hello", "hElLo");       // true
 * equalFold("hello WÖrLD", "Hello wörld"); // true (UTF-8 support)
 * ```
 */
export function equalFold(value, other) {
    return ogFold(value, other);
}
