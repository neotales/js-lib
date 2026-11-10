import type { Char } from "./types.ts";
import { is16, is32, latin1, pLmask } from "./tables/latin1.ts";
import { L } from "./tables/l.ts";

/**
 * Checks if the given value represents a letter.
 *
 * @param char - The numeric value to check.
 * @returns `true` if the value represents a letter, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isLetter } from '@neotales/chars/is-letter';
 *
 * console.log(isLetter(65)); // char 'A'  true
 * console.log(isLetter(48)); // char '0'   false
 * ```
 */
export function isLetter(char: Char): boolean {
  if (!Number.isInteger(char) || char < 1 || char > 0x10ffff) {
    return false;
  }

  if (char < 256) {
    return (latin1[char] & pLmask) !== 0;
  }

  const hi = L.R16[L.R32.length - 1][1];
  if (char <= hi) {
    return is16(L.R16, char);
  }

  const lo = L.R32[0][0];
  if (char >= lo) {
    return is32(L.R32, char);
  }

  return false;
}

/**
 * Checks if the given value represents a letter.
 *
 * @description
 * The function skips the type check and the range check for a small performance boost.
 *
 * @param char - The numeric value to check.
 * @returns `true` if the value represents a letter, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isLetterUnsafe } from '@neotales/chars/is-letter';
 *
 * console.log(isLetterUnsafe(65)); // char 'A'  true
 * console.log(isLetterUnsafe(48)); // char '0'   false
 * ```
 */
export function isLetterUnsafe(char: Char): boolean {
  if (char < 256) {
    return (latin1[char] & pLmask) !== 0;
  }

  const hi = L.R16[L.R32.length - 1][1];
  if (char <= hi) {
    return is16(L.R16, char);
  }

  const lo = L.R32[0][0];
  if (char >= lo) {
    return is32(L.R32, char);
  }

  return false;
}

/**
 * Checks if the character at the specified index in the given string is a letter.
 *
 * @param value - The string to check.
 * @param index - The index of the character to check.
 * @returns `true` if the character at the specified index is a letter, `false` otherwise.
 *
 * @example
 * ```typescript
 * import { isLetterAt } from "@neotales/chars/is-letter";
 *
 * const str = "Hello, world!";
 * const index = 4;
 * const isLetter = isLetterAt(str, index);
 * console.log(isLetter); //  true
 *
 * const str1 = "Hello, 123!";
 * const index1 = 8;
 * const isLetter1 = isLetterAt(str1, index1);
 * console.log(isLetter1); //  false
 * ```
 */
export function isLetterAt(value: string, index: number): boolean {
  const char = value.codePointAt(index) ?? 0;
  return isLetterUnsafe(char);
}
