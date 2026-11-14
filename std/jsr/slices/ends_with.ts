/**
 * The `endsWith` module provides functions for checking if a character buffer
 * ends with a given suffix. Supports both case-sensitive and case-insensitive
 * (fold) comparison with full Unicode support.
 *
 * @example Case-sensitive suffix check
 * ```ts
 * import { endsWith } from "@neotales/slices/ends-with";
 *
 * endsWith("hello world", "world");  // Returns true
 * endsWith("hello world", "World");  // Returns false
 * ```
 *
 * @example Case-insensitive suffix check
 * ```ts
 * import { endsWithFold } from "@neotales/slices/ends-with";
 *
 * endsWithFold("hello WORLD", "world");  // Returns true
 * endsWithFold("café CAFÉ", "café");  // Returns true
 * ```
 *
 * @module
 */
import { type CharBuffer, toCharSliceLike } from "./utils.ts";
import { simpleFold } from "@neotales/chars/simple-fold";

/**
 * Determines if a character buffer ends with the given suffix using
 * case-insensitive (fold) comparison.
 *
 * Uses Unicode case folding for proper comparison of international characters
 * including accented letters, Greek, Cyrillic, and other scripts.
 *
 * @param value - The character buffer to check.
 * @param test - The suffix to look for.
 * @returns `true` if value ends with test (case-insensitive); otherwise `false`.
 *
 * @example Basic case-insensitive suffix check
 * ```ts
 * endsWithFold("Hello World", "WORLD");  // Returns true
 * endsWithFold("file.TXT", ".txt");  // Returns true
 * ```
 *
 * @example With accented characters
 * ```ts
 * endsWithFold("Bonjour CAFÉ", "café");  // Returns true
 * endsWithFold("Guten Tag ÜBER", "über");  // Returns true
 * ```
 *
 * @example Returns false when suffix is longer
 * ```ts
 * endsWithFold("hi", "hello");  // Returns false
 * ```
 */
export function endsWithFold(value: CharBuffer, test: CharBuffer): boolean {
  const s = toCharSliceLike(value);
  const t = toCharSliceLike(test);

  if (t.length > s.length) {
    return false;
  }

  let i = Math.min(s.length, t.length);
  for (i; i > 0; i--) {
    let sr = s.at(s.length - i) ?? -1;
    let tr = t.at(t.length - i) ?? -1;
    if (sr === -1 || tr === -1) {
      return false;
    }

    if ((sr | tr) >= 0x80) {
      {
        let j = i;

        for (; j > 0; j--) {
          let sourceRune = s.at(s.length - j) ?? -1;
          let testRune = t.at(t.length - j) ?? -1;
          if (sourceRune === -1 || testRune === -1) {
            return false;
          }

          if (testRune === sourceRune) {
            continue;
          }

          if (testRune < sourceRune) {
            const tmp = testRune;
            testRune = sourceRune;
            sourceRune = tmp;
          }

          // short circuit if testRune is ASCII
          if (testRune < 0x80) {
            if (65 <= sourceRune && sourceRune <= 90 && testRune === sourceRune + 32) {
              continue;
            }

            return false;
          }

          let r = simpleFold(sourceRune);
          while (r !== sourceRune && r < testRune) {
            r = simpleFold(r);
          }

          if (r === testRune) {
            continue;
          }

          return false;
        }

        return true;
      }
    }

    if (tr === sr) {
      continue;
    }

    if (tr < sr) {
      const tmp = tr;
      tr = sr;
      sr = tmp;
    }

    if (65 <= sr && sr <= 90 && tr === sr + 32) {
      continue;
    }

    return false;
  }

  return true;
}

/**
 * Determines if a character buffer ends with the given suffix using
 * case-sensitive comparison.
 *
 * @param value - The character buffer to check.
 * @param test - The suffix to look for.
 * @returns `true` if value ends with test exactly; otherwise `false`.
 *
 * @example Basic suffix check
 * ```ts
 * endsWith("hello world", "world");  // Returns true
 * endsWith("file.txt", ".txt");  // Returns true
 * ```
 *
 * @example Case-sensitive
 * ```ts
 * endsWith("hello World", "world");  // Returns false
 * endsWith("hello World", "World");  // Returns true
 * ```
 *
 * @example With Unicode
 * ```ts
 * endsWith("bonjour café", "café");  // Returns true
 * endsWith("你好世界", "世界");  // Returns true
 * ```
 *
 * @example Empty suffix always matches
 * ```ts
 * endsWith("hello", "");  // Returns true
 * ```
 */
export function endsWith(value: CharBuffer, test: CharBuffer): boolean {
  const s = toCharSliceLike(value);
  const t = toCharSliceLike(test);

  if (t.length > s.length) {
    return false;
  }

  for (let i = 0; i < t.length; i++) {
    if (s.at(s.length - t.length + i) !== t.at(i)) {
      return false;
    }
  }

  return true;
}
