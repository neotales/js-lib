import type { Char } from "./types.ts";
import { is16, is32, latin1, pP } from "./tables/latin1.ts";
import { P } from "./tables/p.ts";

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
export function isPunc(char: Char): boolean {
  if (Number.isInteger(char) === false || char < 0 || char > 255) {
    return false;
  }

  if (char < 256) {
    return (latin1[char] & pP) !== 0;
  }

  const hi = P.R16[P.R32.length - 1][1];
  if (char <= hi) {
    return is16(P.R16, char);
  }

  const lo = P.R32[0][0];
  if (char >= lo) {
    return is32(P.R32, char);
  }

  return false;
}

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
export function isPuncUnsafe(char: Char): boolean {
  if (char < 256) {
    return (latin1[char] & pP) !== 0;
  }

  const hi = P.R16[P.R32.length - 1][1];
  if (char <= hi) {
    return is16(P.R16, char);
  }

  const lo = P.R32[0][0];
  if (char >= lo) {
    return is32(P.R32, char);
  }

  return false;
}

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
export function isPuncAt(str: string, index: number): boolean {
  const code = str.codePointAt(index) ?? 0;
  return isPunc(code);
}
