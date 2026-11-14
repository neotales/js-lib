/**
 * The `endsWith` module provides functions for checking if a character buffer
 * ends with a given suffix. Supports both case-sensitive and case-insensitive
 * (fold) comparison with full Unicode support.
 *
 * @example Case-sensitive suffix check
 * ```ts
 * import { endsWith } from "@neotales/slices/ends-with";
 *
 * endsWith("hello world", "world");  // Returns true
 * endsWith("hello world", "World");  // Returns false
 * ```
 *
 * @example Case-insensitive suffix check
 * ```ts
 * import { endsWithFold } from "@neotales/slices/ends-with";
 *
 * endsWithFold("hello WORLD", "world");  // Returns true
 * endsWithFold("café CAFÉ", "café");  // Returns true
 * ```
 *
 * @module
 */
import { type CharBuffer } from "./utils.js";
/**
 * Determines if a character buffer ends with the given suffix using
 * case-insensitive (fold) comparison.
 *
 * Uses Unicode case folding for proper comparison of international characters
 * including accented letters, Greek, Cyrillic, and other scripts.
 *
 * @param value - The character buffer to check.
 * @param test - The suffix to look for.
 * @returns `true` if value ends with test (case-insensitive); otherwise `false`.
 *
 * @example Basic case-insensitive suffix check
 * ```ts
 * endsWithFold("Hello World", "WORLD");  // Returns true
 * endsWithFold("file.TXT", ".txt");  // Returns true
 * ```
 *
 * @example With accented characters
 * ```ts
 * endsWithFold("Bonjour CAFÉ", "café");  // Returns true
 * endsWithFold("Guten Tag ÜBER", "über");  // Returns true
 * ```
 *
 * @example Returns false when suffix is longer
 * ```ts
 * endsWithFold("hi", "hello");  // Returns false
 * ```
 */
export declare function endsWithFold(value: CharBuffer, test: CharBuffer): boolean;
/**
 * Determines if a character buffer ends with the given suffix using
 * case-sensitive comparison.
 *
 * @param value - The character buffer to check.
 * @param test - The suffix to look for.
 * @returns `true` if value ends with test exactly; otherwise `false`.
 *
 * @example Basic suffix check
 * ```ts
 * endsWith("hello world", "world");  // Returns true
 * endsWith("file.txt", ".txt");  // Returns true
 * ```
 *
 * @example Case-sensitive
 * ```ts
 * endsWith("hello World", "world");  // Returns false
 * endsWith("hello World", "World");  // Returns true
 * ```
 *
 * @example With Unicode
 * ```ts
 * endsWith("bonjour café", "café");  // Returns true
 * endsWith("你好世界", "世界");  // Returns true
 * ```
 *
 * @example Empty suffix always matches
 * ```ts
 * endsWith("hello", "");  // Returns true
 * ```
 */
export declare function endsWith(value: CharBuffer, test: CharBuffer): boolean;
