/**
 * The `capitalize` module provides a function to capitalize the first character
 * of a string while optionally lowercasing the rest.
 *
 * @example Basic usage
 * ```ts
 * import { capitalize } from "@neotales/slices/capitalize";
 *
 * String.fromCodePoint(...capitalize("hello"));  // "Hello"
 * String.fromCodePoint(...capitalize("helloWorld"));  // "Helloworld"
 * ```
 *
 * @example Preserve case
 * ```ts
 * String.fromCodePoint(...capitalize("helloWorld", { preserveCase: true }));  // "HelloWorld"
 * ```
 *
 * @module
 */

import { type CharBuffer, toCharSliceLike } from "./utils.ts";
import { toLower } from "@neotales/chars/to-lower";
import { toUpper } from "@neotales/chars/to-upper";

/**
 * Options for the `capitalize` function.
 */
export interface CapitalizeOptions {
  /**
   * If true, preserves the case of all characters except the first.
   * If false (default), converts all characters after the first to lowercase.
   */
  preserveCase?: boolean;
}

/**
 * Capitalizes the first character of a string. By default, converts all other
 * characters to lowercase. Use `preserveCase` option to keep original casing.
 *
 * @param value - The string to capitalize.
 * @param options - Options to control case handling.
 * @returns The capitalized string as a Uint32Array.
 *
 * @example Basic capitalization
 * ```ts
 * String.fromCodePoint(...capitalize("hello"));  // "Hello"
 * String.fromCodePoint(...capitalize("HELLO"));  // "Hello"
 * String.fromCodePoint(...capitalize("hello world"));  // "Hello world"
 * ```
 *
 * @example Preserve case
 * ```ts
 * String.fromCodePoint(...capitalize("helloWorld", { preserveCase: true }));  // "HelloWorld"
 * String.fromCodePoint(...capitalize("HELLO", { preserveCase: true }));  // "HELLO"
 * ```
 *
 * @example With Unicode
 * ```ts
 * String.fromCodePoint(...capitalize("école"));  // "École"
 * String.fromCodePoint(...capitalize("über"));  // "Über"
 * String.fromCodePoint(...capitalize("αβγ"));  // "Αβγ"
 * ```
 */
export function capitalize(value: CharBuffer, options?: CapitalizeOptions): Uint32Array {
  const v = toCharSliceLike(value);

  options ??= {};

  const buffer = new Uint32Array(v.length);
  if (v instanceof Uint32Array) {
    buffer.set(v);
    buffer[0] = toUpper(buffer[0]);
    return buffer;
  }

  for (let i = 0; i < value.length; i++) {
    const r = v.at(i);
    if (r === undefined) {
      buffer[i] = 0;
      continue;
    }
    if (i === 0) {
      buffer[i] = toUpper(r);
      continue;
    }

    if (options.preserveCase) {
      buffer[i] = r;
      continue;
    }

    buffer[i] = toLower(r);
  }

  return buffer;
}
