/**
 * The starts-with module provides functions to check if a string starts with a given prefix.
 *
 * @module
 */
import { startsWith as og, startsWithFold as ogFold } from "@neotales/slices/starts-with";
/**
 * Determines if the leading characters in the string matches the prefix.
 * @param value The string to check.
 * @param prefix The characters to search for.
 * @returns `true` if the string starts with the prefix; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { startsWith } from "@neotales/strings";
 *
 * startsWith("Hello World", "Hello");  // true
 * startsWith("Hello World", "hello");  // false (case-sensitive)
 * startsWith("Hello World", "World");  // false
 * ```
 */
export function startsWith(value, prefix) {
    return og(value, prefix);
}
/**
 * Determines if the leading characters in the string matches the prefix
 * using case-insensitive comparison.
 * @param value The string to check.
 * @param prefix The characters to search for.
 * @returns `true` if the string starts with the prefix; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { startsWithFold } from "@neotales/strings";
 *
 * startsWithFold("Hello World", "hello");  // true
 * startsWithFold("Hello World", "HELLO");  // true
 * startsWithFold("Hello World", "World");  // false
 * ```
 */
export function startsWithFold(value, prefix) {
    return ogFold(value, prefix);
}
