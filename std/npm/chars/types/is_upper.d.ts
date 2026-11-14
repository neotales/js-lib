import type { Char } from "./types.js";
/**
 * Determines if the given character is an uppercase letter.
 *
 * @param char The character to check.
 * @returns `true` if the character is an uppercase letter; otherwise, `false`.
 *
 * @example
 * ```typescript
 * import { isUpper } from "@neotales/chars";
 *
 * console.log(isUpper(0x41)); // true 'A'
 * console.log(isUpper(0x61)); // false 'a'
 * console.log(isUpper(0x0391)); // true 'Α'
 * console.log(isUpper(0x03B1)); // false 'α'
 * ```
 */
export declare function isUpper(char: Char): boolean;
/**
 * Determines if the given character is an uppercase letter. Unsafe version
 * assumes valid input.
 *
 * @param char The character to check.
 * @returns `true` if the character is an uppercase letter, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isUpper } from "@neotales/chars";
 *
 * console.log(isUpper(0x41)); // true 'A'
 * console.log(isUpper(0x61)); // false 'a'
 * console.log(isUpper(0x0391)); // true 'Α'
 * console.log(isUpper(0x03B1)); // false 'α'
 * ```
 */
export declare function isUpperUnsafe(char: Char): boolean;
/**
 * Determines if the character at the specified index in the string is an
 * uppercase letter.
 *
 * @param str The string to check.
 * @param index The index of the character to check.
 * @returns `true` if the character at the specified index is an uppercase letter,
 * `false` otherwise.
 * @example
 * ```typescript
 * import { isUpperAt } from "@neotales/chars";
 *
 * console.log(isUpperAt("Hello", 0)); // true 'H'
 * console.log(isUpperAt("Hello", 1)); // false 'e'
 * console.log(isUpperAt("Αθήνα", 0)); // true 'Α'
 * console.log(isUpperAt("Αθήνα", 1)); // false 'θ'
 * ```
 */
export declare function isUpperAt(str: string, index: number): boolean;
