/**
 * The ends-with module provides functions to check if a string ends with a
 * specified suffix. It includes both case-sensitive and case-insensitive
 * comparisons. The functions are primarily used for string manipulation
 * and validation.
 * @module
 */
import { endsWith as og, endsWithFold as ogFold } from "@neotales/slices/ends-with";
/**
 * Determines whether the string ends with the specified suffix using
 * case-insensitive comparison.
 * @param value The string to check.
 * @param suffix The suffix to check for.
 * @returns `true` if the string ends with the suffix; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { endsWithFold } from "@neotales/strings";
 *
 * endsWithFold("Hello World", "WORLD");  // true
 * endsWithFold("Hello World", "world");  // true
 * endsWithFold("Hello World", "Hello");  // false
 * ```
 */
export function endsWithFold(value, suffix) {
    if (suffix.length > value.length) {
        return false;
    }
    return ogFold(value, suffix);
}
/**
 * Determines whether the string ends with the specified suffix.
 * @param value The string to check.
 * @param suffix The suffix to check for.
 * @returns `true` if the string ends with the suffix; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { endsWith } from "@neotales/strings";
 *
 * endsWith("Hello World", "World");  // true
 * endsWith("Hello World", "world");  // false (case-sensitive)
 * endsWith("Hello World", "Hello");  // false
 * ```
 */
export function endsWith(value, suffix) {
    if (suffix.length > value.length) {
        return false;
    }
    return og(value, suffix);
}
