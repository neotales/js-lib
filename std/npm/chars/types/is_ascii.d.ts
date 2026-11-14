/**
 * Checks if the given value is an ASCII character.
 *
 * @param value - The value to check.
 * @returns `true` if the value is an ASCII character, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isAscii } from '@neotales/chars/is-ascii';
 *
 * const result = isAscii(65);
 * // result: true
 * ```
 */
export declare function isAscii(value: number): boolean;
/**
 * Checks if the character at the specified index in the given string is an ASCII character.
 *
 * @param str - The input string.
 * @param index - The index of the character to check.
 * @returns A boolean indicating whether the character at the specified index is an ASCII character.
 *
 * @example
 * ```typescript
 * import { isAsciiAt } from "@neotales/chars/is-ascii";
 * const str = "Hello, world!";
 * const index = 4;
 * const isAscii = isAsciiAt(str, index);
 * console.log(isAscii); //  true
 * ```
 */
export declare function isAsciiAt(value: string, index: number): boolean;
