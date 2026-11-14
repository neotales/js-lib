/**
 * The `indexOf` module provides functions to find the first index of a
 * substring in a character buffer. Supports both case-sensitive and
 * case-insensitive (fold) searching with full Unicode support.
 *
 * @example Find first occurrence of a substring
 * ```ts
 * import { indexOf } from "@neotales/slices/index-of";
 *
 * indexOf("hello world", "world");  // Returns 6
 * indexOf("foo bar foo", "foo", 1);  // Returns 8 (starts at index 1)
 * indexOf("hello", "x");  // Returns -1 (not found)
 * ```
 *
 * @example Case-insensitive search
 * ```ts
 * import { indexOfFold } from "@neotales/slices/index-of";
 *
 * indexOfFold("Hello World", "WORLD");  // Returns 6
 * indexOfFold("café CAFÉ", "CAFÉ");  // Returns 0
 * ```
 *
 * @module
 */
import { type CharBuffer } from "./utils.js";
/**
 * Finds the first occurrence of a substring in a character buffer using
 * case-insensitive (fold) comparison.
 *
 * Uses Unicode case folding for proper comparison of international characters
 * including accented letters, Greek, Cyrillic, and other scripts.
 *
 * @param value - The character buffer to search in.
 * @param test - The substring to search for.
 * @param index - The index to start searching from (default: 0).
 * @returns The index of the first occurrence, or -1 if not found.
 * @throws {RangeError} If index is out of range.
 *
 * @example Basic case-insensitive search
 * ```ts
 * indexOfFold("Hello World", "world");  // Returns 6
 * indexOfFold("ABC abc ABC", "ABC");  // Returns 0
 * ```
 *
 * @example With accented characters
 * ```ts
 * indexOfFold("CAFÉ café", "café");  // Returns 0
 * indexOfFold("ÜBER über", "über");  // Returns 0
 * ```
 *
 * @example With start index
 * ```ts
 * indexOfFold("foo FOO foo", "foo", 1);  // Returns 4
 * ```
 */
export declare function indexOfFold(value: CharBuffer, test: CharBuffer, index?: number): number;
/**
 * Finds the first occurrence of a substring in a character buffer using
 * case-sensitive comparison.
 *
 * @param value - The character buffer to search in.
 * @param test - The substring to search for.
 * @param index - The index to start searching from (default: 0).
 * @returns The index of the first occurrence, or -1 if not found.
 *
 * @example Basic search
 * ```ts
 * indexOf("hello world", "world");  // Returns 6
 * indexOf("abcabc", "abc");  // Returns 0 (first occurrence)
 * ```
 *
 * @example Case-sensitive
 * ```ts
 * indexOf("Hello HELLO", "HELLO");  // Returns 6
 * indexOf("Hello HELLO", "hello");  // Returns -1 (case mismatch)
 * ```
 *
 * @example With start index
 * ```ts
 * indexOf("foo bar foo", "foo", 1);  // Returns 8
 * ```
 *
 * @example Not found
 * ```ts
 * indexOf("hello world", "xyz");  // Returns -1
 * indexOf("abc", "abcd");  // Returns -1 (test longer than remaining)
 * ```
 */
export declare function indexOf(value: CharBuffer, test: CharBuffer, index?: number): number;
