/**
 * The index-of module provides functions to find the index of the first occurrence
 * of specified characters in a string. It includes both case-sensitive and
 * case-insensitive comparison functions.
 *
 * @module
 */

import { indexOf as og, indexOfFold as ogFold } from "@neotales/slices/index-of";
import type { CharBuffer } from "@neotales/slices/utils";

/**
 * Gets the index of the first occurrence of the specified characters
 * in the string using case-insensitive comparison.
 * @param value The string to search.
 * @param chars The characters to search for.
 * @param index The index to start searching from.
 * @returns The index of the first occurrence of the characters in the string.
 * If the string is not found, returns -1.
 *
 * @example
 * ```typescript
 * import { indexOfFold } from "@neotales/strings";
 *
 * indexOfFold("Hello World", "world");  // 6
 * indexOfFold("Hello World", "HELLO");  // 0
 * indexOfFold("Hello World", "xyz");    // -1
 * ```
 */
export function indexOfFold(value: string, chars: CharBuffer, index = 0): number {
  return ogFold(value, chars, index);
}

/**
 * Gets the index of the first occurrence of the specified characters
 * in the string.
 * @param value The string to search.
 * @param chars The characters to search for.
 * @param index The index to start searching from.
 * @returns The index of the first occurrence of the characters in the string.
 * If the string is not found, returns -1.
 *
 * @example
 * ```typescript
 * import { indexOf } from "@neotales/strings";
 *
 * indexOf("Hello World", "World");  // 6
 * indexOf("Hello World", "world");  // -1 (case-sensitive)
 * indexOf("Hello World", "o");      // 4
 * indexOf("Hello World", "o", 5);   // 7 (start from index 5)
 * ```
 */
export function indexOf(value: string, chars: CharBuffer, index = 0): number {
  return og(value, chars, index);
}
