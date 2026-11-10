import type { Char } from "./types.ts";
import { simpleFold } from "./simple_fold.ts";

/**
 * Compares two characters for equality under simple case folding
 * which is a more general form of case-insensitivity.
 *
 * @param a The first character to compare.
 * @param b The second character to compare.
 * @returns `true` if the characters are equal under simple cas
 * folding, `false` otherwise.
 *
 * @example
 * ```ts
 * import { equalFold } from "@neotales/chars";
 *
 * console.log(equalFold(0x41, 0x61)); // true ('A' and 'a')
 * console.log(equalFold(0xDF, 0x73)); // true ('ß' and 's')
 * console.log(equalFold(0x1F88, 0x1F80)); // true ('ᾈ' and 'ᾀ')
 * console.log(equalFold(0x41, 0x42)); // false ('A' and 'B')
 * ```
 */
export function equalFold(a: Char, b: Char): boolean {
  if (a === b) {
    return true;
  }

  if (a < 128 && b < 128) {
    if (a >= 65 && a <= 90) {
      a += 32;
    }

    if (b >= 65 && b <= 90) {
      b += 32;
    }

    return a === b;
  }

  return simpleFold(a) === b;
}
