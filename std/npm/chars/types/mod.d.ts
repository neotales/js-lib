/**
 * ## Overview
 *
 * The chars library provides functions for working with characters
 * found in other standard libraries or frameworks such as `isSpace`,
 * `isLetter`, `isUpper`, `isDigit`, etc.
 *
 * The module will handle characters outside latin and ascii such as
 * Cyrillic or Greek characters. The chars library is heavily based on golang's
 * unicode module. The Unicode tables are generated from Go 1.24.0, which uses
 * Unicode 15.0.0.
 *
 * ![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)
 *
 * [![JSR](https://jsr.io/badges/@neotales/chars)](https://jsr.io/@neotales/chars)
 * [![npm version](https://badge.fury.io/js/@neotales%2Fchars.svg)](https://badge.fury.io/js/@neotales%2Fchars)
 * [![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-lib.svg)](https://badge.fury.io/gh/neotales%2Fjs-lib)
 *
 * ## Documentation
 *
 * Documentation is available on [jsr.io](https://jsr.io/@neotales/chars/doc)
 *
 * A list of other modules can be found at [github.com/neotales/js-lib](https://github.com/neotales/js-lib)
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@neotales/chars
 *
 * # npm from jsr
 * npx jsr add @neotales/chars
 *
 * # from npmjs.org
 * npm install @neotales/chars
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *     isUpperAt,
 *     isLowerAt,
 *     isDigit,
 *     isAscii,
 *     isLatin1,
 *     isSpaceAt,
 *     equalFold
 * } from "@neotales/chars";
 *
 * const str = "Hello, World 123";
 * console.log(isUpperAt(str, 0)); // true
 * console.log(isUpperAt(str, 1)); // false
 * console.log(isLowerAt(str, 1)); // false
 * console.log(isDigit(str, 1)); // false
 * console.log(isDigit(str, 14)); // true
 *
 * const left = "Ꙏ".codePointAt(0)
 * const right = "ꙏ".codePointAt(0)
 * console.log(equalFold(left, right)); // true
 *
 * console.log(isAsciiAt("⇼", 0)); // false
 * console.log(isAsciiAt(str, 0)); // true
 * console.log(isLatin1At("⇼", 0)); // false
 *
 * const str2 = " \n\r\t\f"
 * console.log(isSpaceAt(str2, 0)); // true
 * console.log(isSpaceAt(str2, 1)); // true
 * console.log(isSpaceAt(str2, 2)); // true
 * console.log(isSpaceAt(str2, 3)); // true
 * ```
 *
 * ## Functions
 *
 * The char module provides functions common character functions:
 *
 * - `equalFold` - `true` when two characters are equal using case insensitivity.
 *   Returns `false` for an invalid code point.
 * - `isAscii` - `true` when character is ascii.
 * - `isChar` - `true` when a number value is a valid character.
 * - `isControl` - `true` when a character is a control character.
 * - `isDigit` - `true` when a character is a decimal digit (`Nd`). Superscript
 *   numerals such as `²` and fractions such as `¼` are not digits.
 * - `isLatin1` - `true` when a character is in the latin charset.
 * - `isLetterOrDigit` - `true` when a character is a letter or digit.
 * - `isLetter` - `true` when a charater is a letter.
 * - `isLower` - `true` when a character is a lower case letter.
 * - `isPunc` - `true` when a character is a punction mark.
 * - `isSpace` - `true` when a character is a space character.`\n \r\t\f`.
 * - `isSymbol` - `true` when a character is a symbol.
 * - `isUpper` - `true` when a character is uppercase.
 * - `simpleFold` - when a character has a lower or higher character, fold will flip them.
 *   Returns an invalid code point unchanged.
 * - `toLower` - converts a character to its lowercase counterpart, if applicable.
 * - `toUpper` - converts a character to its uppercase counterpart, if applicable.
 *
 * ## Constants
 *
 * ```ts
 * export const CHAR_UPPERCASE_A = 65; /* A *\/
 * export const CHAR_LOWERCASE_A = 97; /* a *\/
 * export const CHAR_UPPERCASE_Z = 90; /* Z *\/
 * export const CHAR_LOWERCASE_Z = 122; /* z *\/
 * // Non-alphabetic chars.
 * export const CHAR_DOT = 46; /* . *\/
 * export const CHAR_FORWARD_SLASH = 47; /* / *\/
 * export const CHAR_BACKWARD_SLASH = 92; /* \ *\/
 * export const CHAR_VERTICAL_LINE = 124; /* | *\/
 * export const CHAR_COLON = 58; /* : *\/
 * export const CHAR_QUESTION_MARK = 63; /* ? *\/
 * export const CHAR_UNDERSCORE = 95; /* _ *\/
 * export const CHAR_LINE_FEED = 10; /* \n *\/
 * export const CHAR_CARRIAGE_RETURN = 13; /* \r *\/
 * export const CHAR_TAB = 9; /* \t *\/
 * export const CHAR_FORM_FEED = 12; /* \f *\/
 * export const CHAR_EXCLAMATION_MARK = 33; /* ! *\/
 * export const CHAR_HASH = 35; /* # *\/
 * export const CHAR_SPACE = 32; /*   *\/
 * export const CHAR_NO_BREAK_SPACE = 160; /* \u00A0 *\/
 * export const CHAR_ZERO_WIDTH_NOBREAK_SPACE = 65279; /* \uFEFF *\/
 * export const CHAR_LEFT_SQUARE_BRACKET = 91; /* [ *\/
 * export const CHAR_RIGHT_SQUARE_BRACKET = 93; /* ] *\/
 * export const CHAR_LEFT_ANGLE_BRACKET = 60; /* < *\/
 * export const CHAR_RIGHT_ANGLE_BRACKET = 62; /* > *\/
 * export const CHAR_LEFT_CURLY_BRACKET = 123; /* { *\/
 * export const CHAR_RIGHT_CURLY_BRACKET = 125; /* } *\/
 * export const CHAR_HYPHEN_MINUS = 45; /* - *\/
 * export const CHAR_PLUS = 43; /* + *\/
 * export const CHAR_DOUBLE_QUOTE = 34; /* " *\/
 * export const CHAR_SINGLE_QUOTE = 39; /* ' *\/
 * export const CHAR_PERCENT = 37; /* % *\/
 * export const CHAR_SEMICOLON = 59; /* ; *\/
 * export const CHAR_CIRCUMFLEX_ACCENT = 94; /* ^ *\/
 * export const CHAR_GRAVE_ACCENT = 96; /* ` *\/
 * export const CHAR_AT = 64; /* @ *\/
 * export const CHAR_AMPERSAND = 38; /* & *\/
 * export const CHAR_TILDA = 126; /* ~ *\/
 * export const CHAR_DOLLAR = 36; /* $ *\/
 * export const CHAR_VERTICAL_TAB = 11; /* \v *\/
 * export const CHAR_ASTERISK = 42; /* * *\/
 * export const CHAR_COMMA = 44; /* , *\/
 * /**
 *  * Equal character (`=`) code (61).
 *  *\/
 * export const CHAR_EQUAL = 61; /* = *\/
 * // Digits
 * export const CHAR_0 = 48; /* 0 *\/
 * export const CHAR_9 = 57; /* 9 *\/
 * export const MAX_RUNE = 0x10FFFF;
 * ```
 *
 * ## License
 *
 * [MIT License](./LICENSE.md)
 *
 * @module
 */
import { isAscii } from "./is_ascii.js";
import { isChar } from "./is_char.js";
import { isControl } from "./is_control.js";
import { isDigit } from "./is_digit.js";
import { isLatin1 } from "./is_latin1.js";
import { isLetter } from "./is_letter.js";
import { isLetterOrDigit } from "./is_letter_or_digit.js";
import { isLower } from "./is_lower.js";
import { isPunc } from "./is_punc.js";
import { isSpace } from "./is_space.js";
import { isSymbol } from "./is_symbol.js";
import { isUpper } from "./is_upper.js";
import { equalFold } from "./equal_fold.js";
import { simpleFold } from "./simple_fold.js";
import { toLower } from "./to_lower.js";
import { toUpper } from "./to_upper.js";
export * from "./types.js";
export { equalFold, isAscii, isChar, isControl, isDigit, isLatin1, isLetter, isLetterOrDigit, isLower, isPunc, isSpace, isSymbol, isUpper, simpleFold, toLower, toUpper, };
declare const _default: {
    equalFold: typeof equalFold;
    isAscii: typeof isAscii;
    isChar: typeof isChar;
    isControl: typeof isControl;
    isDigit: typeof isDigit;
    isLatin1: typeof isLatin1;
    isLetter: typeof isLetter;
    isLetterOrDigit: typeof isLetterOrDigit;
    isLower: typeof isLower;
    isPunc: typeof isPunc;
    isSpace: typeof isSpace;
    isSymbol: typeof isSymbol;
    simpleFold: typeof simpleFold;
    toLower: typeof toLower;
    toUpper: typeof toUpper;
};
export default _default;
