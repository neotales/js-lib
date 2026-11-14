/**
 * The `camelize` module provides a function to convert strings to camelCase.
 * Handles snake_case, kebab-case, and space-separated words.
 *
 * @example Basic usage
 * ```ts
 * import { camelize } from "@neotales/slices/camelize";
 *
 * String.fromCodePoint(...camelize("hello_world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello-world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello world"));  // "helloWorld"
 * ```
 *
 * @module
 */

import { CharArrayBuilder } from "./char_array_builder.ts";
import { CHAR_UNDERSCORE } from "@neotales/chars/constants";
import { isDigit } from "@neotales/chars/is-digit";
import { isLetter } from "@neotales/chars/is-letter";
import { isPunc } from "@neotales/chars/is-punc";
import { isSpace } from "@neotales/chars/is-space";
import { isSymbol } from "@neotales/chars/is-symbol";
import { toLower } from "@neotales/chars/to-lower";
import { toUpper } from "@neotales/chars/to-upper";
import { type CharBuffer, toCharSliceLike } from "./utils.ts";

/**
 * Options for the `camelize` function.
 */
export interface CamelizeOptions {
  /**
   * If true, preserves the case of characters that are not the first character
   * or immediately after a separator. By default, those characters are lowercased.
   */
  preserveCase?: boolean;
}

/**
 * Converts a string to camelCase. Handles snake_case, kebab-case, and
 * space-separated words by removing separators and capitalizing the
 * following character.
 *
 * The first character is always lowercased. Characters after separators
 * (`_`, `-`, or space) are uppercased.
 *
 * @param value - The string to convert to camelCase.
 * @param options - Options to control case handling.
 * @returns The camelCase string as a Uint32Array.
 *
 * @example Basic conversions
 * ```ts
 * String.fromCodePoint(...camelize("hello_world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello-world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("HelloWorld"));   // "helloWorld"
 * ```
 *
 * @example Multiple separators
 * ```ts
 * String.fromCodePoint(...camelize("hello__world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello--world"));  // "helloWorld"
 * ```
 *
 * @example With numbers
 * ```ts
 * String.fromCodePoint(...camelize("hello_world_123"));  // "helloWorld123"
 * String.fromCodePoint(...camelize("version_2_0"));  // "version20"
 * ```
 *
 * @example With Unicode
 * ```ts
 * String.fromCodePoint(...camelize("café_latte"));  // "caféLatte"
 * String.fromCodePoint(...camelize("über_mensch"));  // "überMensch"
 * ```
 */
export function camelize(value: CharBuffer | string, options: CamelizeOptions = {}): Uint32Array {
  const v = toCharSliceLike(value);

  const sb = new CharArrayBuilder();

  let last = 0;
  let started = false;
  for (let i = 0; i < value.length; i++) {
    const c = v.at(i) ?? -1;
    if (c === -1) {
      continue;
    }

    if (i === 0 && isLetter(c)) {
      sb.appendChar(toLower(c));
      started = true;
      last = c;
      continue;
    }

    if (!started && (isPunc(c) || isSpace(c))) {
      last = 0;
      continue;
    }

    started = true;

    if (isLetter(c)) {
      if (last === CHAR_UNDERSCORE) {
        sb.appendChar(toUpper(c));
        last = c;
        continue;
      }

      sb.appendChar(options.preserveCase ? c : toLower(c));
      last = c;
      continue;
    }

    if (isPunc(c) || isSpace(c) || isSymbol(c)) {
      last = CHAR_UNDERSCORE;
      continue;
    }

    if (isDigit(c)) {
      last = c;
      sb.appendChar(c);
      continue;
    }

    sb.appendChar(c);
    last = c;
  }

  const r = sb.toArray();
  sb.clear();
  return r;
}
