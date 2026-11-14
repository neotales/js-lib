import type { Char } from "./types.js";
/**
 * Converts a lowercase letter to uppercase.
 * If the input value is a lowercase letter, it converts it to uppercase using the specified locales;
 * otherwise, returns the character as-is.
 * @param char - The Unicode value of the character to convert.
 * @param locales - Optional. A string or an array of strings that specify the locales to use for the conversion.
 * @returns The Unicode value of the uppercase character.
 *
 * @example
 * ```typescript
 * import { toUpper } from '@neotales/chars';
 *
 * console.log(toUpper(65)); //  65
 * console.log(toUpper(97)); //  65
 * console.log(toUpper(48)); //  48
 * ```
 */
export declare function toUpper(char: Char): Char;
/**
 * Converts the given Unicode code point to its uppercase equivalent from the given index.
 * If the character at the index is uppercase, then the lowercase character code point is returned; otherwise,
 * the original character code point is returned.
 *
 * If the index is out of range, the value will default to 0, which is the min character.
 *
 * @param value - The string value.
 * @param index - The index of the character
 * @returns The lowercase equivalent of the given Unicode code point.
 *
 * @example
 * ```typescript
 * import { toUpperAt } from '@neotales/chars';
 *
 * const str = "hello"
 *
 * console.log(str.charCodeAt(0)); // 104
 * console.log(toUpperAt(str, 0)); // 72
 *
 * // doesn't exist
 * console.log(toUpperAt(str, 20)); // 0
 * ```
 */
export declare function toUpperAt(value: string, index: number): Char;
