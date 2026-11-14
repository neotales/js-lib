import type { Char } from "./types.js";
/**
 * Checks if the given value is a digit.
 *
 * @param char - The value to check.
 * @returns `true` if the value is a digit, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isDigit } from '@neotales/chars/is-digit';
 *
 * console.log(isDigit('5'.charCodeAt(0))); // true
 * console.log(isDigit('a'.charCodeAt(0))); //  false
 * ```
 */
export declare function isDigit(char: number): boolean;
/**
 * Determines whether the given character is a digit.
 *
 * @param char The character to check.
 * @returns `true` if the character is a digit; otherwise, `false`.
 *
 * @example
 * ```ts
 * import { isDigitUnsafe } from "@neotales/chars/is-digit";
 *
 * console.log(isDigitUnsafe(0x10FFFF)); //  false
 * console.log(isDigitUnsafe(0.32)); //  false
 * console.log(isDigitUnsafe(10)); //  true
 * ```
 */
export declare function isDigitUnsafe(char: Char): boolean;
/**
 * Checks if the character at the specified index in the given string is a digit.
 *
 * @param value - The string to check.
 * @param index - The index of the character to check.
 * @returns `true` if the character at the specified index is a digit, `false` otherwise.
 * @example
 * ```typescript
 * import { isDigitAt } from "@neotales/chars/is-digit";
 *
 * const str = "Hello, world!";
 * const index = 4;
 * const isDigit = isDigitAt(str, index);
 * console.log(isDigit); //  false
 *
 * const str1 = "Hello, 123!";
 * const index1 = 8;
 * const isDigit1 = isDigitAt(str1, index1);
 * console.log(isDigit1); //  true
 *
 * ```
 */
export declare function isDigitAt(value: string, index: number): boolean;
