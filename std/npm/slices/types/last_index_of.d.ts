/**
 * The `lastIndexOf` module provides functions to find the last index of a
 * substring in a character buffer, searching backwards from the end or a
 * specified position. Supports both case-sensitive and case-insensitive
 * (fold) searching with full Unicode support.
 *
 * @example Find last occurrence of a substring
 * ```ts
 * import { lastIndexOf } from "@neotales/slices/last-index-of";
 *
 * lastIndexOf("foo bar foo", "foo");  // Returns 8 (last "foo")
 * lastIndexOf("foo bar foo", "foo", 5);  // Returns 0 (searching up to index 5)
 * lastIndexOf("hello", "x");  // Returns -1 (not found)
 * ```
 *
 * @example Case-insensitive search
 * ```ts
 * import { lastIndexOfFold } from "@neotales/slices/last-index-of";
 *
 * lastIndexOfFold("FOO bar Foo", "foo");  // Returns 8
 * lastIndexOfFold("ÜBER über", "über");  // Returns 5
 * ```
 *
 * @module
 */
import { type CharBuffer } from "./utils.js";
/**
 * Finds the last occurrence of a substring in a character buffer using
 * case-insensitive (fold) comparison. Searches backwards from the end or
 * the specified index position.
 *
 * Uses Unicode case folding for proper comparison of international characters
 * including accented letters, Greek, Cyrillic, and other scripts.
 *
 * @param value - The character buffer to search in.
 * @param test - The substring to search for.
 * @param index - The index to start searching backwards from (default: 0).
 * @returns The index of the last occurrence, or -1 if not found.
 *
 * @example Basic case-insensitive search
 * ```ts
 * lastIndexOfFold("Hello HELLO hello", "hello");  // Returns 12
 * lastIndexOfFold("ABC abc ABC", "abc");  // Returns 8
 * ```
 *
 * @example With accented characters
 * ```ts
 * lastIndexOfFold("café CAFÉ café", "café");  // Returns 10
 * lastIndexOfFold("über ÜBER", "über");  // Returns 5
 * ```
 *
 * @example With index limit
 * ```ts
 * lastIndexOfFold("foo FOO foo", "foo", 5);  // Returns 4
 * ```
 */
export declare function lastIndexOfFold(value: CharBuffer, test: CharBuffer, index?: number): number;
/**
 * Finds the last occurrence of a substring in a character buffer using
 * case-sensitive comparison. Searches backwards from the end or the
 * specified index position.
 *
 * @param value - The character buffer to search in.
 * @param test - The substring to search for.
 * @param index - The index to start searching backwards from (default: Infinity,
 *                meaning search from the end).
 * @returns The index of the last occurrence, or -1 if not found.
 *
 * @example Basic search
 * ```ts
 * lastIndexOf("foo bar foo", "foo");  // Returns 8
 * lastIndexOf("abcabc", "abc");  // Returns 3
 * ```
 *
 * @example Case-sensitive
 * ```ts
 * lastIndexOf("Hello HELLO", "HELLO");  // Returns 6
 * lastIndexOf("Hello HELLO", "hello");  // Returns -1 (case mismatch)
 * ```
 *
 * @example With index limit
 * ```ts
 * lastIndexOf("foo bar foo", "foo", 5);  // Returns 0 (only searches up to index 5)
 * ```
 *
 * @example Not found
 * ```ts
 * lastIndexOf("hello world", "xyz");  // Returns -1
 * lastIndexOf("abc", "abcd");  // Returns -1 (test longer than value)
 * ```
 */
export declare function lastIndexOf(value: CharBuffer, test: CharBuffer, index?: number): number;
