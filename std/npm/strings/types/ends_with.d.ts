import type { CharBuffer } from "@neotales/slices/utils";
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
export declare function endsWithFold(value: string, suffix: CharBuffer): boolean;
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
export declare function endsWith(value: string, suffix: CharBuffer): boolean;
