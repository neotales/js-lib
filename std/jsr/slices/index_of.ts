/**
 * The `indexOf` module provides functions to find the first index of a
 * substring in a character buffer. Supports both case-sensitive and
 * case-insensitive (fold) searching with full Unicode support.
 *
 * @example Find first occurrence of a substring
 * ```ts
 * import { indexOf } from "@neotales/slices/index-of";
 *
 * indexOf("hello world", "world");  // Returns 6
 * indexOf("foo bar foo", "foo", 1);  // Returns 8 (starts at index 1)
 * indexOf("hello", "x");  // Returns -1 (not found)
 * ```
 *
 * @example Case-insensitive search
 * ```ts
 * import { indexOfFold } from "@neotales/slices/index-of";
 *
 * indexOfFold("Hello World", "WORLD");  // Returns 6
 * indexOfFold("café CAFÉ", "CAFÉ");  // Returns 0
 * ```
 *
 * @module
 */

import { simpleFold } from "@neotales/chars/simple-fold";
import { type CharBuffer, toCharSliceLike } from "./utils.ts";

/**
 * Finds the first occurrence of a substring in a character buffer using
 * case-insensitive (fold) comparison.
 *
 * Uses Unicode case folding for proper comparison of international characters
 * including accented letters, Greek, Cyrillic, and other scripts.
 *
 * @param value - The character buffer to search in.
 * @param test - The substring to search for.
 * @param index - The index to start searching from (default: 0).
 * @returns The index of the first occurrence, or -1 if not found.
 * @throws {RangeError} If index is out of range.
 *
 * @example Basic case-insensitive search
 * ```ts
 * indexOfFold("Hello World", "world");  // Returns 6
 * indexOfFold("ABC abc ABC", "ABC");  // Returns 0
 * ```
 *
 * @example With accented characters
 * ```ts
 * indexOfFold("CAFÉ café", "café");  // Returns 0
 * indexOfFold("ÜBER über", "über");  // Returns 0
 * ```
 *
 * @example With start index
 * ```ts
 * indexOfFold("foo FOO foo", "foo", 1);  // Returns 4
 * ```
 */
export function indexOfFold(value: CharBuffer, test: CharBuffer, index = 0): number {
  const s = toCharSliceLike(value);
  const t = toCharSliceLike(test);

  if (index < 0 || (index > 0 && index >= s.length)) {
    throw new RangeError(`Argument index (${index}) out of range`);
  }

  if (t.length == 0 || s.length == 0 || t.length > s.length) {
    return -1;
  }

  let f = 0;
  let i = index;
  for (; i < s.length; i++) {
    let sr = s.at(i) ?? -1;
    let tr = t.at(f) ?? -1;

    if (sr === -1 || tr === -1) {
      f = 0;
      continue;
    }

    if ((sr | tr) >= 0x80) {
      {
        let j = i;

        for (; j < s.length; j++) {
          let sourceRune = s.at(j) ?? -1;
          let testRune = t.at(f) ?? -1;
          if (sourceRune === -1 || testRune === -1) {
            f = 0;
            continue;
          }

          if (testRune === sourceRune) {
            f++;
            if (f === t.length) {
              return j - t.length + 1;
            }

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
              f++;

              if (f === t.length) {
                return j - t.length + 1;
              }
              continue;
            }

            f = 0;
            continue;
          }

          let r = simpleFold(sourceRune);
          while (r != sourceRune && r < testRune) {
            r = simpleFold(r);
          }

          if (r == testRune) {
            f++;

            if (f === t.length) {
              return j - t.length + 1;
            }
            continue;
          }

          f = 0;
        }

        if (f === t.length) {
          return j - t.length;
        }

        return -1;
      }
    }

    if (tr === sr) {
      f++;

      if (f === t.length) {
        return i + 1 - f;
      }

      continue;
    }

    if (tr < sr) {
      const tmp = tr;
      tr = sr;
      sr = tmp;
    }

    if (65 <= sr && sr <= 90 && tr === sr + 32) {
      f++;

      if (f === t.length) {
        return i + 1 - f;
      }

      continue;
    }

    f = 0;
  }

  if (f === t.length) {
    return i - f;
  }

  return -1;
}

/**
 * Finds the first occurrence of a substring in a character buffer using
 * case-sensitive comparison.
 *
 * @param value - The character buffer to search in.
 * @param test - The substring to search for.
 * @param index - The index to start searching from (default: 0).
 * @returns The index of the first occurrence, or -1 if not found.
 *
 * @example Basic search
 * ```ts
 * indexOf("hello world", "world");  // Returns 6
 * indexOf("abcabc", "abc");  // Returns 0 (first occurrence)
 * ```
 *
 * @example Case-sensitive
 * ```ts
 * indexOf("Hello HELLO", "HELLO");  // Returns 6
 * indexOf("Hello HELLO", "hello");  // Returns -1 (case mismatch)
 * ```
 *
 * @example With start index
 * ```ts
 * indexOf("foo bar foo", "foo", 1);  // Returns 8
 * ```
 *
 * @example Not found
 * ```ts
 * indexOf("hello world", "xyz");  // Returns -1
 * indexOf("abc", "abcd");  // Returns -1 (test longer than remaining)
 * ```
 */
export function indexOf(value: CharBuffer, test: CharBuffer, index = 0): number {
  const s = toCharSliceLike(value);
  const t = toCharSliceLike(test);

  if (t.length == 0 || s.length == 0 || t.length > s.length) {
    return -1;
  }

  let f = 0;
  let i = index;
  for (; i < s.length; i++) {
    const sr = s.at(i) ?? -1;
    const tr = t.at(f) ?? -1;

    if (sr === -1 || tr === -1) {
      f = 0;
      continue;
    }

    if (sr === tr) {
      f++;
      if (f === t.length) {
        return i - t.length + 1;
      }

      continue;
    }

    f = 0;
  }

  if (f === t.length) {
    return i - f;
  }

  return -1;
}
