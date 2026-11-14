import { type CharBuffer } from "./utils.js";
/**
 * Determines if two character buffers are equal using case-insensitive
 * (fold) comparison.
 *
 * Uses Unicode case folding for proper comparison of international characters
 * including accented letters, Greek, Cyrillic, and other scripts.
 *
 * @param value - The first character buffer to compare.
 * @param test - The second character buffer to compare.
 * @returns `true` if the buffers are equal (case-insensitive); otherwise `false`.
 *
 * @example Basic case-insensitive comparison
 * ```ts
 * equalFold("Hello", "HELLO");  // Returns true
 * equalFold("ABC", "abc");  // Returns true
 * ```
 *
 * @example With accented characters
 * ```ts
 * equalFold("café", "CAFÉ");  // Returns true
 * equalFold("über", "ÜBER");  // Returns true
 * ```
 *
 * @example Different lengths return false
 * ```ts
 * equalFold("hello", "hello ");  // Returns false
 * ```
 */
export declare function equalFold(value: CharBuffer, test: CharBuffer): boolean;
/**
 * Determines if two character buffers are equal using case-sensitive comparison.
 *
 * @param value - The first character buffer to compare.
 * @param test - The second character buffer to compare.
 * @returns `true` if the buffers are exactly equal; otherwise `false`.
 *
 * @example Basic comparison
 * ```ts
 * equal("hello", "hello");  // Returns true
 * equal("Hello", "hello");  // Returns false (case mismatch)
 * ```
 *
 * @example With Unicode
 * ```ts
 * equal("café", "café");  // Returns true
 * equal("你好", "你好");  // Returns true
 * ```
 *
 * @example Different lengths return false
 * ```ts
 * equal("hello", "hello ");  // Returns false
 * ```
 */
export declare function equal(value: CharBuffer, test: CharBuffer): boolean;
