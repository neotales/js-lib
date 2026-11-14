import type { Char } from "./types.js";
/**
 * Checks if the given character is a whitespace character.
 *
 * @param char - The character to check.
 * @returns `true` if the character is a whitespace character, `false` otherwise.
 * @example
 * ```typescript
 * import { isSpace } from "@neotales/chars";
 *
 * console.log(isSpace(0x20)); // true
 * console.log(isSpace(0x41)); // false
 * console.log(isSpace(0x3000)); // true
 * ```
 */
export declare function isSpace(char: Char): boolean;
/**
 * Checks if the given character is a whitespace character.
 * @param char The character to check.
 * @returns `true` if the character is a whitespace character, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isSpaceUnsafe } from "@neotales/chars";
 *
 * console.log(isSpaceUnsafe(0x20)); // true
 * console.log(isSpaceUnsafe(0x41)); // false
 * console.log(isSpaceUnsafe(0x3000)); // true
 * ```
 */
export declare function isSpaceUnsafe(char: Char): boolean;
/**
 * Checks if the character at the specified index in the given string is a whitespace character.
 *
 * @param value - The string to check.
 * @param index - The index of the character to check.
 * @returns `true` if the character is a whitespace character, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isWhiteSpaceAt } from "@neotales/chars";
 *
 * const str = "Hello, world!";
 * console.log(isSpaceAt(str, 4)); //  false
 * console.log(isSpaceAt(str, 6)); //  true
 * ```
 */
export declare function isSpaceAt(value: string, index: number): boolean;
