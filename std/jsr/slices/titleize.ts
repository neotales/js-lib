/**
 * Provides a function to convert strings to title case.
 *
 * Title case capitalizes the first letter of each word, except for common
 * articles, conjunctions, and prepositions (like "the", "and", "of").
 *
 * @module
 */

import { CHAR_SPACE, CHAR_UNDERSCORE } from "@neotales/chars/constants";
import { isLetter } from "@neotales/chars/is-letter";
import { isLetterOrDigit } from "@neotales/chars/is-letter-or-digit";
import { isLower } from "@neotales/chars/is-lower";
import { isSpace } from "@neotales/chars/is-space";
import { isUpper } from "@neotales/chars/is-upper";
import { toLower } from "@neotales/chars/to-lower";
import { toUpper } from "@neotales/chars/to-upper";
import { CharArrayBuilder } from "./char_array_builder.ts";
import { equalFold } from "./equal.ts";
import { Tokens } from "./tokens.ts";
import { type CharSliceLike, toCharSliceLike } from "./utils.ts";

/**
 * A set of words that should not be capitalized in title case.
 *
 * Includes common articles ("a", "an", "the"), conjunctions ("and", "or", "but"),
 * and prepositions ("of", "in", "on", "to", etc.).
 *
 * @example
 * ```typescript
 * import { NoCapitalizeWords } from '@neotales/slices/titleize';
 *
 * // Check if a word should not be capitalized
 * NoCapitalizeWords.has("the");  // true
 * NoCapitalizeWords.has("Hello"); // false
 * ```
 */
export const NoCapitalizeWords: Tokens = new Tokens();
[
  "and",
  "or",
  "nor",
  "a",
  "an",
  "the",
  "so",
  "but",
  "to",
  "of",
  "at",
  "by",
  "from",
  "into",
  "on",
  "onto",
  "off",
  "out",
  "in",
  "over",
  "with",
  "for",
].forEach((o) => NoCapitalizeWords.addString(o));

/**
 * Converts a string or character buffer to title case.
 *
 * Title case capitalizes the first letter of each word, with the exception
 * of common articles, conjunctions, and prepositions (defined in {@link NoCapitalizeWords}).
 *
 * The function handles:
 * - camelCase and PascalCase word boundaries
 * - Underscore-separated words (snake_case)
 * - Space-separated words
 * - Unicode characters including accented letters
 *
 * To avoid allocations, the function returns a `Uint32Array` of code points.
 * Use `String.fromCodePoint(...result)` to convert to a string.
 *
 * @param s - The string or character buffer to convert to title case.
 * @returns A new `Uint32Array` containing the title case code points.
 *
 * @example
 * ```typescript
 * import { titleize } from '@neotales/slices/titleize';
 *
 * // Basic usage
 * String.fromCodePoint(...titleize("hello world"));  // "Hello World"
 *
 * // camelCase to title case
 * String.fromCodePoint(...titleize("helloWorld"));   // "Hello World"
 *
 * // snake_case to title case
 * String.fromCodePoint(...titleize("bob_the_king")); // "Bob the King"
 *
 * // PascalCase with articles
 * String.fromCodePoint(...titleize("BobTheKing"));   // "Bob the King"
 *
 * // Unicode support
 * String.fromCodePoint(...titleize("hello wörld"));  // "Hello Wörld"
 * ```
 */
export function titleize(s: CharSliceLike | string): Uint32Array {
  if (typeof s === "string") {
    s = toCharSliceLike(s);
  }

  const sb = new CharArrayBuilder();
  let last = 0;
  const tokens = new Array<Uint32Array>();

  for (let i = 0; i < s.length; i++) {
    const c = s.at(i) ?? -1;
    if (c === -1) {
      continue;
    }

    if (isLetterOrDigit(c)) {
      if (isUpper(c)) {
        if (isLetter(last) && isLower(last)) {
          tokens.push(sb.toArray());
          sb.clear();

          sb.appendChar(c);
          last = c;
          continue;
        }
      }

      sb.appendChar(toLower(c));
      last = c;
      continue;
    }

    if (c === CHAR_UNDERSCORE || isSpace(c)) {
      if (sb.length === 0) {
        continue;
      }

      if (last === CHAR_UNDERSCORE) {
        continue;
      }

      tokens.push(sb.toArray());
      sb.clear();

      last = c;
      continue;
    }
  }

  if (sb.length > 0) {
    tokens.push(sb.toArray());
    sb.clear();
  }

  for (const token of tokens) {
    let skip = false;
    for (const title of NoCapitalizeWords) {
      if (equalFold(title, token)) {
        if (sb.length > 0) {
          sb.appendChar(CHAR_SPACE);
        }

        sb.appendCharArray(title); // already lower case.
        skip = true;
        break;
      }
    }

    if (skip) {
      continue;
    }

    const first = toUpper(token[0]);
    token[0] = first;

    if (sb.length > 0) {
      sb.appendChar(CHAR_SPACE);
    }

    sb.appendCharArray(token);
  }

  const v = sb.toArray();
  sb.clear();
  return v;
}
