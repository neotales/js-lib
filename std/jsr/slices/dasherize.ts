/**
 * The `dasherize` module provides a function to convert strings to kebab-case
 * (dash-separated lowercase). Handles camelCase, PascalCase, snake_case, and
 * space-separated words.
 *
 * @example Basic usage
 * ```ts
 * import { dasherize } from "@neotales/slices/dasherize";
 *
 * String.fromCodePoint(...dasherize("helloWorld"));  // "hello-world"
 * String.fromCodePoint(...dasherize("HelloWorld"));  // "hello-world"
 * String.fromCodePoint(...dasherize("hello_world"));  // "hello-world"
 * ```
 *
 * @example With options
 * ```ts
 * // SCREAMING-KEBAB-CASE
 * String.fromCodePoint(...dasherize("hello world", { screaming: true }));  // "HELLO-WORLD"
 *
 * // Preserve original case
 * String.fromCodePoint(...dasherize("helloWorld", { preserveCase: true }));  // "hello-World"
 * ```
 *
 * @module
 */

import { CharArrayBuilder } from "./char_array_builder.ts";
import { CHAR_HYPHEN_MINUS, CHAR_UNDERSCORE } from "@neotales/chars/constants";
import { isDigit } from "@neotales/chars/is-digit";
import { isLetter } from "@neotales/chars/is-letter";
import { isLower } from "@neotales/chars/is-lower";
import { isSpace } from "@neotales/chars/is-space";
import { isUpper } from "@neotales/chars/is-upper";
import { toLower } from "@neotales/chars/to-lower";
import { toUpper } from "@neotales/chars/to-upper";
import { type CharBuffer, toCharSliceLike } from "./utils.ts";

/**
 * Options for the `dasherize` function.
 */
export interface DasherizeOptions {
  /**
   * Convert all characters to uppercase (SCREAMING-KEBAB-CASE).
   * Cannot be used with `preserveCase`.
   */
  screaming?: boolean;
  /**
   * Preserve the original case of characters instead of lowercasing.
   * Cannot be used with `screaming`.
   */
  preserveCase?: boolean;
}

/**
 * Converts a string to kebab-case (dash-separated). Handles camelCase,
 * PascalCase, snake_case, and space-separated input.
 *
 * By default, converts all characters to lowercase. Use options to modify
 * the case behavior.
 *
 * @param value - The string to convert to kebab-case.
 * @param options - Options to control case handling.
 * @returns The kebab-case string as a Uint32Array.
 * @throws {Error} If both `preserveCase` and `screaming` are true.
 *
 * @example Basic conversions
 * ```ts
 * String.fromCodePoint(...dasherize("helloWorld"));  // "hello-world"
 * String.fromCodePoint(...dasherize("HelloWorld"));  // "hello-world"
 * String.fromCodePoint(...dasherize("hello_world"));  // "hello-world"
 * String.fromCodePoint(...dasherize("hello world"));  // "hello-world"
 * ```
 *
 * @example Screaming kebab-case
 * ```ts
 * String.fromCodePoint(...dasherize("helloWorld", { screaming: true }));  // "HELLO-WORLD"
 * ```
 *
 * @example Preserve case
 * ```ts
 * String.fromCodePoint(...dasherize("helloWorld", { preserveCase: true }));  // "hello-World"
 * ```
 *
 * @example With Unicode
 * ```ts
 * String.fromCodePoint(...dasherize("hello wörld"));  // "hello-wörld"
 * String.fromCodePoint(...dasherize("caféLatte"));  // "café-latte"
 * ```
 */
export function dasherize(value: CharBuffer, options?: DasherizeOptions): Uint32Array {
  const v = toCharSliceLike(value);

  options ??= {};
  if (options.preserveCase && options.screaming) {
    throw new Error("preserveCase and screaming cannot be used together");
  }

  const sb = new CharArrayBuilder();
  let last = 0;

  for (let i = 0; i < value.length; i++) {
    const c = v.at(i) ?? -1;
    if (c === -1) {
      continue;
    }

    if (isLetter(c)) {
      if (isUpper(c)) {
        if (isLetter(last) && isLower(last)) {
          sb.appendChar(CHAR_HYPHEN_MINUS);

          if (options.preserveCase || options.screaming) {
            sb.appendChar(c);
            last = c;
            continue;
          }

          sb.appendChar(toLower(c));
          last = c;
          continue;
        }

        if (options.preserveCase || options.screaming) {
          sb.appendChar(c);
          last = c;
          continue;
        }

        sb.appendChar(toLower(c));
        last = c;
        continue;
      }

      if (options.screaming) {
        sb.appendChar(toUpper(c));
      } else if (options.preserveCase) {
        sb.appendChar(c);
      } else {
        sb.appendChar(toLower(c));
      }

      last = c;
      continue;
    }

    if (isDigit(c)) {
      last = c;
      sb.appendChar(c);
    }

    if (c === CHAR_UNDERSCORE || c === CHAR_HYPHEN_MINUS || isSpace(c)) {
      if (sb.length === 0) {
        continue;
      }

      if (last === CHAR_HYPHEN_MINUS) {
        continue;
      }

      sb.appendChar(CHAR_HYPHEN_MINUS);
      last = CHAR_HYPHEN_MINUS;
      continue;
    }
  }
  const r = sb.toArray();
  sb.clear();
  return r;
}
