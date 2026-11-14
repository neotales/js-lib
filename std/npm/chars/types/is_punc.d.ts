import type { Char } from "./types.js";
/**
 * Checks if the given character is a punctuation character.
 *
 * @param char - The character to check.
 * @returns `true` if the character is a punctuation character, `false` otherwise.
 * @example
 * ```ts
 * import { isPunc } from "@neotales/chars/is-punc";
 *
 * console.log(isPunc(0x21)); //  true
 * console.log(isPunc(0x20)); //  false
 * ```
 */
export declare function isPunc(char: Char): boolean;
/**
 * Determines whether the given character is a punctuation character.
 *
 * @description
 * The function skips the type check and the range check for a small performance boost.
 *
 * @param char The character to check.
 * @returns `true` if the character is a punctuation character; otherwise, `false`.
 *
 * @example
 * ```ts
 * import { isPuncUnsafe } from "@neotales/chars/is-punc";
 *
 * console.log(isPuncUnsafe(0x21)); //  true
 * console.log(isPuncUnsafe(0x20)); //  false
 * ```
 */
export declare function isPuncUnsafe(char: Char): boolean;
/**
 * Determines whether the character at the specified index in the given string is a punctuation character.
 * @param str The input string.
 * @param index The index of the character to check.
 * @returns `true` if the character at the specified index is a punctuation character; otherwise, `false`.
 * @example
 * ```ts
 * import { isPuncAt } from "@neotales/chars/is-punc";
 *
 * const str = "Hello!";
 * const index = 4;
 * const isPunc = isPuncAt(str, index);
 * console.log(isPunc); //  false
 * console.log(isPuncAt(str, 5)); //  true
 * ```
 */
export declare function isPuncAt(str: string, index: number): boolean;
