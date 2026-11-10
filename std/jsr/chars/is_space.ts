import type { Char } from "./types.ts";
import { is16 } from "./tables/latin1.ts";

const R16 = [
  [0x0009, 0x000d, 1],
  [0x0020, 0x0085, 101],
  [0x00a0, 0x1680, 5600],
  [0x2000, 0x200a, 1],
  [0x2028, 0x2029, 1],
  [0x202f, 0x205f, 48],
  [0x3000, 0x3000, 1],
];

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
export function isSpace(char: Char): boolean {
  if (!Number.isInteger(char) || char < 1 || char > 0x10ffff) {
    return false;
  }

  if (char < 256) {
    return (
      char === 0x20 ||
      char === 0x09 ||
      char === 0x0b ||
      char === 0x0c ||
      char === 0x0a ||
      char === 0x0d ||
      char === 0x85 ||
      char === 0xa0
    );
  }

  const hi = R16[R16.length - 1][1];
  if (char <= hi) {
    return is16(R16, char);
  }

  return false;
}

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
export function isSpaceUnsafe(char: Char): boolean {
  if (char < 256) {
    return (
      char === 0x20 ||
      char === 0x09 ||
      char === 0x0b ||
      char === 0x0c ||
      char === 0x0a ||
      char === 0x0d ||
      char === 0x85 ||
      char === 0xa0
    );
  }

  const hi = R16[R16.length - 1][1];
  if (char <= hi) {
    return is16(R16, char);
  }

  return false;
}

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
export function isSpaceAt(value: string, index: number): boolean {
  const code = value.codePointAt(index) ?? 0;
  return isSpace(code);
}
