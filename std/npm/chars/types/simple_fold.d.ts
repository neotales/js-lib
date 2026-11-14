import type { Char } from "./types.js";
/**
 * Returns the folded character of the given character. If the character is
 * uppercase, lowercase is returned.  If the character is lowercase, uppercase is returned.
 *
 * If the character like digits 0-1 cannot be folded, the original character is returned.
 *
 * @param char The character to fold.
 * @returns The folded character.
 *
 * @example
 * ```ts
 * import { simpleFold } from "@neotales/chars";
 *
 * console.log(String.fromCharCode(simpleFold(0x41))); // 'a'
 * console.log(String.fromCharCode(simpleFold(0x61))); // 'A'
 * console.log(String.fromCharCode(simpleFold(0xDF))); // 's'
 * console.log(String.fromCharCode(simpleFold(0x73))); // 'ß'
 * console.log(String.fromCharCode(simpleFold(0x1F88))); // 'ᾀ'
 * console.log(String.fromCharCode(simpleFold(0x1F80))); // 'ᾈ'
 * ```
 */
export declare function simpleFold(char: Char): Char;
