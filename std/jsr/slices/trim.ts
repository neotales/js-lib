/**
 * Functions for trimming whitespace or characters from character buffers.
 *
 * This module provides functions to remove leading, trailing, or both
 * leading and trailing characters from a `Uint32Array` of Unicode code points
 * or a string. All functions return a new `Uint32Array` with the trimmed content.
 *
 * The functions come in three variants:
 * - **Space variants** (`trimSpace`, `trimStartSpace`, `trimEndSpace`): Remove Unicode whitespace
 * - **Char variants** (`trimChar`, `trimStartChar`, `trimEndChar`): Remove a single code point
 * - **Slice variants** (`trimSlice`, `trimStartSlice`, `trimEndSlice`): Remove any of a set of code points
 *
 * The main `trim`, `trimStart`, and `trimEnd` functions dispatch to the appropriate
 * variant based on the parameters provided.
 *
 * @example
 * ```typescript
 * import { trim, trimStart, trimEnd } from '@neotales/slices/trim';
 *
 * // Remove whitespace from both ends
 * String.fromCodePoint(...trim("  hello world  ")); // "hello world"
 *
 * // Remove specific character from start
 * String.fromCodePoint(...trimStart("...hello", ".")); // "hello"
 *
 * // Remove set of characters from end
 * String.fromCodePoint(...trimEnd("hello!?!", "!?")); // "hello"
 * ```
 *
 * @module
 */

import { isSpace } from "@neotales/chars/is-space";
import { type CharBuffer, toCharSliceLike } from "./utils.ts";

/**
 * Trims trailing Unicode whitespace from the end of a character buffer.
 *
 * Removes all trailing characters that are classified as whitespace by
 * the `isSpace` function (space, tab, newline, etc.).
 *
 * @param buffer - The character buffer or string to trim.
 * @returns A new `Uint32Array` with trailing whitespace removed.
 *
 * @example
 * ```typescript
 * import { trimEndSpace } from '@neotales/slices/trim';
 *
 * String.fromCodePoint(...trimEndSpace("hello  ")); // "hello"
 * String.fromCodePoint(...trimEndSpace("hello\t\n")); // "hello"
 * String.fromCodePoint(...trimEndSpace("hello")); // "hello" (no change)
 * ```
 */
export function trimEndSpace(buffer: CharBuffer): Uint32Array {
  const s = toCharSliceLike(buffer);
  let size = s.length;

  for (let i = s.length - 1; i >= 0; i--) {
    const c = s.at(i) ?? -1;
    if (isSpace(c)) {
      size--;
    } else {
      break;
    }
  }

  const buffer2 = new Uint32Array(size);
  if (s instanceof Uint32Array) {
    buffer2.set(s.subarray(0, size));
    return buffer2;
  }

  for (let i = 0; i < size; i++) {
    buffer2[i] = s.at(i) ?? 0;
  }

  return buffer2;
}

/**
 * Trims occurrences of a specific character from the end of a character buffer.
 *
 * Removes all consecutive occurrences of the specified code point from
 * the end of the buffer.
 *
 * @param buffer - The character buffer or string to trim.
 * @param suffix - The Unicode code point to remove.
 * @returns A new `Uint32Array` with the trailing characters removed.
 *
 * @example
 * ```typescript
 * import { trimEndChar } from '@neotales/slices/trim';
 *
 * String.fromCodePoint(...trimEndChar("hello...", 46)); // "hello" (46 = '.')
 * String.fromCodePoint(...trimEndChar("hello", 46)); // "hello" (no change)
 * ```
 */
export function trimEndChar(buffer: CharBuffer, suffix: number): Uint32Array {
  const s = toCharSliceLike(buffer);

  let size = s.length;

  for (let i = s.length - 1; i >= 0; i--) {
    if (s.at(i) === suffix) {
      size--;
    } else {
      break;
    }
  }

  if (size === s.length && s instanceof Uint32Array) {
    return s;
  }

  if (s instanceof Uint32Array) {
    return s.subarray(0, size);
  }

  const buffer2 = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    buffer2[i] = s.at(i) ?? 0;
  }

  return buffer2;
}

/**
 * Trims any of a set of characters from the end of a character buffer.
 *
 * Removes all consecutive trailing characters that appear in the suffix set.
 * Characters are removed individually, not as a sequence.
 *
 * @param buffer - The character buffer or string to trim.
 * @param suffix - The set of characters to remove (as string or `Uint32Array`).
 * @returns A new `Uint32Array` with the trailing characters removed.
 *
 * @example
 * ```typescript
 * import { trimEndSlice } from '@neotales/slices/trim';
 *
 * // Remove any combination of '!' and '?' from end
 * String.fromCodePoint(...trimEndSlice("hello!?!", "!?")); // "hello"
 * String.fromCodePoint(...trimEndSlice("hello???", "!?")); // "hello"
 * ```
 */
export function trimEndSlice(buffer: CharBuffer, suffix: CharBuffer): Uint32Array {
  const s = toCharSliceLike(buffer);
  const t = toCharSliceLike(suffix);
  let size = s.length;

  for (let i = s.length - 1; i >= 0; i--) {
    let match = false;
    for (let j = 0; j < t.length; j++) {
      if (s.at(i) === t.at(j)) {
        size--;
        match = true;
        break;
      }
    }

    if (!match) {
      break;
    }
  }

  if (size === s.length && s instanceof Uint32Array) {
    return s;
  }

  if (s instanceof Uint32Array) {
    return s.subarray(0, size);
  }

  const buffer2 = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    buffer2[i] = s.at(i) ?? 0;
  }

  return buffer2;
}

/**
 * Trims trailing characters from the end of a character buffer.
 *
 * This is a convenience function that dispatches to:
 * - `trimEndSpace` when no suffix is provided
 * - `trimEndChar` when suffix is a single character
 * - `trimEndSlice` when suffix contains multiple characters
 *
 * @param buffer - The character buffer or string to trim.
 * @param suffix - The character(s) to remove. If undefined, removes whitespace.
 * @returns A new `Uint32Array` with the trailing characters removed.
 *
 * @example
 * ```typescript
 * import { trimEnd } from '@neotales/slices/trim';
 *
 * // Remove whitespace (default)
 * String.fromCodePoint(...trimEnd("hello  ")); // "hello"
 *
 * // Remove single character
 * String.fromCodePoint(...trimEnd("hello...", ".")); // "hello"
 *
 * // Remove set of characters
 * String.fromCodePoint(...trimEnd("hello!?!", "!?")); // "hello"
 * ```
 */
export function trimEnd(buffer: CharBuffer, suffix?: CharBuffer): Uint32Array {
  if (suffix === undefined) {
    return trimEndSpace(buffer);
  }

  if (suffix.length === 1) {
    const t = toCharSliceLike(suffix);
    const rune = t.at(0) ?? -1;
    return trimEndChar(buffer, rune);
  }

  return trimEndSlice(buffer, suffix);
}

/**
 * Trims leading Unicode whitespace from the start of a character buffer.
 *
 * Removes all leading characters that are classified as whitespace by
 * the `isSpace` function (space, tab, newline, etc.).
 *
 * @param buffer - The character buffer or string to trim.
 * @returns A new `Uint32Array` with leading whitespace removed.
 *
 * @example
 * ```typescript
 * import { trimStartSpace } from '@neotales/slices/trim';
 *
 * String.fromCodePoint(...trimStartSpace("  hello")); // "hello"
 * String.fromCodePoint(...trimStartSpace("\t\nhello")); // "hello"
 * String.fromCodePoint(...trimStartSpace("hello")); // "hello" (no change)
 * ```
 */
export function trimStartSpace(buffer: CharBuffer): Uint32Array {
  const s = toCharSliceLike(buffer);
  let size = s.length;

  for (let i = 0; i < s.length; i++) {
    if (isSpace(s.at(i) ?? -1)) {
      size--;
    } else {
      break;
    }
  }

  if (size === s.length && s instanceof Uint32Array) {
    return s;
  }

  const offset = s.length - size;

  if (s instanceof Uint32Array) {
    return s.subarray(offset);
  }

  const buffer2 = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    buffer2[i] = s.at(offset + i) ?? 0;
  }

  return buffer2;
}

/**
 * Trims occurrences of a specific character from the start of a character buffer.
 *
 * Removes all consecutive occurrences of the specified code point from
 * the start of the buffer.
 *
 * @param buffer - The character buffer or string to trim.
 * @param prefix - The Unicode code point to remove.
 * @returns A new `Uint32Array` with the leading characters removed.
 * @throws {RangeError} If the prefix is not a valid Unicode code point.
 *
 * @example
 * ```typescript
 * import { trimStartChar } from '@neotales/slices/trim';
 *
 * String.fromCodePoint(...trimStartChar("...hello", 46)); // "hello" (46 = '.')
 * String.fromCodePoint(...trimStartChar("hello", 46)); // "hello" (no change)
 * ```
 */
export function trimStartChar(buffer: CharBuffer, prefix: number): Uint32Array {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 0x10ffff) {
    throw new RangeError("Invalid code point");
  }

  const s = toCharSliceLike(buffer);
  let size = s.length;
  let start = 0;

  for (let i = 0; i < s.length; i++) {
    if (s.at(i) === prefix) {
      size--;
      start++;
    } else {
      break;
    }
  }

  if (size === s.length && s instanceof Uint32Array) {
    return s;
  }

  if (s instanceof Uint32Array) {
    return s.subarray(start);
  }

  const buffer2 = new Uint32Array(size);
  for (let j = start, i = 0; j < s.length; j++, i++) {
    buffer2[i] = s.at(j) ?? 0;
  }

  return buffer2;
}

/**
 * Trims any of a set of characters from the start of a character buffer.
 *
 * Removes all consecutive leading characters that appear in the prefix set.
 * Characters are removed individually, not as a sequence.
 *
 * @param buffer - The character buffer or string to trim.
 * @param prefix - The set of characters to remove (as string or `Uint32Array`).
 * @returns A new `Uint32Array` with the leading characters removed.
 *
 * @example
 * ```typescript
 * import { trimStartSlice } from '@neotales/slices/trim';
 *
 * // Remove any combination of '!' and '?' from start
 * String.fromCodePoint(...trimStartSlice("!?!hello", "!?")); // "hello"
 * String.fromCodePoint(...trimStartSlice("???hello", "!?")); // "hello"
 * ```
 */
export function trimStartSlice(buffer: CharBuffer, prefix: CharBuffer): Uint32Array {
  const s = toCharSliceLike(buffer);
  const t = toCharSliceLike(prefix);

  let size = s.length;
  let j = 0;

  for (j = 0; j < s.length; j++) {
    let match = false;
    const c = s.at(j) ?? -1;
    for (let i = 0; i < t.length; i++) {
      if (c === t.at(i)) {
        size--;
        match = true;
        break;
      }
    }

    if (!match) {
      break;
    }
  }

  if (size === s.length && s instanceof Uint32Array) {
    return s;
  }

  if (s instanceof Uint32Array) {
    return s.subarray(j);
  }

  const buffer2 = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    buffer2[i] = s.at(i + j) ?? 0;
  }

  return buffer2;
}

/**
 * Trims leading characters from the start of a character buffer.
 *
 * This is a convenience function that dispatches to:
 * - `trimStartSpace` when no prefix is provided
 * - `trimStartChar` when prefix is a single character
 * - `trimStartSlice` when prefix contains multiple characters
 *
 * @param buffer - The character buffer or string to trim.
 * @param prefix - The character(s) to remove. If undefined, removes whitespace.
 * @returns A new `Uint32Array` with the leading characters removed.
 *
 * @example
 * ```typescript
 * import { trimStart } from '@neotales/slices/trim';
 *
 * // Remove whitespace (default)
 * String.fromCodePoint(...trimStart("  hello")); // "hello"
 *
 * // Remove single character
 * String.fromCodePoint(...trimStart("...hello", ".")); // "hello"
 *
 * // Remove set of characters
 * String.fromCodePoint(...trimStart("!?!hello", "!?")); // "hello"
 * ```
 */
export function trimStart(buffer: CharBuffer, prefix?: CharBuffer): Uint32Array {
  if (prefix === undefined) {
    return trimStartSpace(buffer);
  }

  if (prefix.length === 1) {
    const t = toCharSliceLike(prefix);
    const rune = t.at(0) ?? -1;
    return trimStartChar(buffer, rune);
  }

  return trimStartSlice(buffer, prefix);
}

/**
 * Trims leading and trailing Unicode whitespace from a character buffer.
 *
 * Removes all leading and trailing characters that are classified as whitespace
 * by the `isSpace` function (space, tab, newline, etc.).
 *
 * @param buffer - The character buffer or string to trim.
 * @returns A new `Uint32Array` with leading and trailing whitespace removed.
 *
 * @example
 * ```typescript
 * import { trimSpace } from '@neotales/slices/trim';
 *
 * String.fromCodePoint(...trimSpace("  hello  ")); // "hello"
 * String.fromCodePoint(...trimSpace("\t\nhello\n\t")); // "hello"
 * String.fromCodePoint(...trimSpace("hello")); // "hello" (no change)
 * ```
 */
export function trimSpace(buffer: CharBuffer): Uint32Array {
  const s = toCharSliceLike(buffer);

  let start = 0;
  let end = s.length;

  for (let i = 0; i < s.length; i++) {
    if (isSpace(s.at(i) ?? -1)) {
      start++;
    } else {
      break;
    }
  }

  if (start === s.length) {
    return new Uint32Array(0);
  }

  for (let i = s.length - 1; i >= 0; i--) {
    if (isSpace(s.at(i) ?? -1)) {
      end--;
    } else {
      break;
    }
  }

  if (start === 0 && end === s.length && s instanceof Uint32Array) {
    return s;
  }

  if (s instanceof Uint32Array) {
    return s.subarray(start, end);
  }

  const buffer2 = new Uint32Array(end - start);
  for (let i = start; i < end; i++) {
    buffer2[i - start] = s.at(i) ?? 0;
  }

  return buffer2;
}

/**
 * Trims occurrences of a specific character from both ends of a character buffer.
 *
 * Removes all consecutive occurrences of the specified code point from
 * both the start and end of the buffer.
 *
 * @param buffer - The character buffer or string to trim.
 * @param prefix - The Unicode code point to remove.
 * @returns A new `Uint32Array` with the characters removed from both ends.
 * @throws {RangeError} If the prefix is not a valid Unicode code point.
 *
 * @example
 * ```typescript
 * import { trimChar } from '@neotales/slices/trim';
 *
 * String.fromCodePoint(...trimChar("...hello...", 46)); // "hello" (46 = '.')
 * String.fromCodePoint(...trimChar("hello", 46)); // "hello" (no change)
 * ```
 */
export function trimChar(buffer: CharBuffer, prefix: number): Uint32Array {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 0x10ffff) {
    throw new RangeError("Invalid code point");
  }

  const s = toCharSliceLike(buffer);
  let start = 0;
  let end = s.length;

  for (let i = 0; i < s.length; i++) {
    if (s.at(i) === prefix) {
      start++;
    } else {
      break;
    }
  }

  if (start === s.length) {
    return new Uint32Array(0);
  }

  for (let i = s.length - 1; i >= 0; i--) {
    if (s.at(i) === prefix) {
      end--;
    } else {
      break;
    }
  }

  if (start === 0 && end === s.length && s instanceof Uint32Array) {
    return s;
  }

  if (s instanceof Uint32Array) {
    return s.subarray(start, end);
  }

  const buffer2 = new Uint32Array(end - start);
  for (let i = start; i < end; i++) {
    buffer2[i - start] = s.at(i) ?? 0;
  }

  return buffer2;
}

/**
 * Trims any of a set of characters from both ends of a character buffer.
 *
 * Removes all consecutive characters that appear in the chars set from
 * both the start and end of the buffer. Characters are removed individually,
 * not as a sequence.
 *
 * @param buffer - The character buffer or string to trim.
 * @param chars - The set of characters to remove (as string or `Uint32Array`).
 * @returns A new `Uint32Array` with the characters removed from both ends.
 *
 * @example
 * ```typescript
 * import { trimSlice } from '@neotales/slices/trim';
 *
 * // Remove any combination of '!' and '?' from both ends
 * String.fromCodePoint(...trimSlice("!?hello!?", "!?")); // "hello"
 * String.fromCodePoint(...trimSlice("???hello!!!", "!?")); // "hello"
 * ```
 */
export function trimSlice(buffer: CharBuffer, chars: CharBuffer): Uint32Array {
  const s = toCharSliceLike(buffer);
  const t = toCharSliceLike(chars);

  let start = 0;
  let end = s.length;

  for (let i = 0; i < s.length; i++) {
    let match = false;
    for (let j = 0; j < t.length; j++) {
      if (s.at(i) === t.at(j)) {
        start++;
        match = true;
        break;
      }
    }

    if (!match) {
      break;
    }
  }

  if (start === s.length) {
    return new Uint32Array(0);
  }

  for (let i = s.length - 1; i >= 0; i--) {
    let match = false;
    for (let j = 0; j < t.length; j++) {
      if (s.at(i) === t.at(j)) {
        end--;
        match = true;
        break;
      }
    }

    if (!match) {
      break;
    }
  }

  if (start === 0 && end === s.length && s instanceof Uint32Array) {
    return s;
  }

  if (s instanceof Uint32Array) {
    return s.subarray(start, end);
  }

  const buffer2 = new Uint32Array(end - start);
  for (let i = start; i < end; i++) {
    buffer2[i - start] = s.at(i) ?? 0;
  }

  return buffer2;
}

/**
 * Trims characters from both ends of a character buffer.
 *
 * This is a convenience function that dispatches to:
 * - `trimSpace` when no chars parameter is provided
 * - `trimChar` when chars is a single character
 * - `trimSlice` when chars contains multiple characters
 *
 * @param buffer - The character buffer or string to trim.
 * @param chars - The character(s) to remove. If undefined, removes whitespace.
 * @returns A new `Uint32Array` with characters removed from both ends.
 *
 * @example
 * ```typescript
 * import { trim } from '@neotales/slices/trim';
 *
 * // Remove whitespace (default)
 * String.fromCodePoint(...trim("  hello  ")); // "hello"
 *
 * // Remove single character
 * String.fromCodePoint(...trim("...hello...", ".")); // "hello"
 *
 * // Remove set of characters
 * String.fromCodePoint(...trim("!?hello!?", "!?")); // "hello"
 * ```
 */
export function trim(buffer: CharBuffer, chars?: CharBuffer): Uint32Array {
  if (chars === undefined) {
    return trimSpace(buffer);
  }

  if (chars.length === 1) {
    const t = toCharSliceLike(chars);
    const rune = t.at(0) ?? -1;
    return trimChar(buffer, rune);
  }

  return trimSlice(buffer, chars);
}
