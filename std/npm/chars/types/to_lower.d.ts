import type { Char } from "./types.js";
/**
 * Converts the given Unicode code point to its lowercase equivalent.
 * If is uppercase, the lowercase character code point is returned; otherwise,
 * the original character code point is returned.
 *
 * @param char - The Unicode code point to convert to lowercase.
 * @returns The lowercase equivalent of the given Unicode code point.
 *
 * @example
 * ```typescript
 * import { toLower } from '@neotales/chars';
 *
 * console.log(toLower(65)); //  97
 * console.log(toLower(97)); //  97
 * console.log(toLower(48)); //  48
 * ```
 */
export declare function toLower(char: Char): Char;
/**
 * Converts the given Unicode code point to its lowercase equivalent from the given index.
 * If is uppercase, the lowercase character code point is returned; otherwise,
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
 * import { toLowerAt } from '@neotales/chars';
 *
 * const str = "HELLO"
 *
 * console.log(str.charCodeAt(0)); // 72
 * console.log(toLowerAt(str, 0)); // 104
 *
 * // doesn't exist
 * console.log(toLowerAt(str, 20)); // 0
 * ```
 */
export declare function toLowerAt(value: string, index: number): Char;
