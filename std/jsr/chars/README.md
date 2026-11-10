# @neotales/chars

## Overview

Unicode character utility functions such as `isSpace`,
`isLetter`, `isUpper`, `isDigit`, `equalFold`.

The module will handle characters outside latin and ascii such as
Cyrillic or Greek characters. The chars library is heavily based on golang's
unicode module.

![logo](https://raw.githubusercontent.com/neotales/js-libraries/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/chars)](https://jsr.io/@neotales/chars)
[![npm version](https://badge.fury.io/js/@neotales%2Fchars.svg?icon=si%3Anpm)](https://badge.fury.io/js/@neotales%2Fchars)

<!-- runtime-support:begin -->

## Runtime support

Generated from `runtimes.json`. Run `deno task readme` after changing it.

| Capability | Deno | Node.js | Bun | Chromium | Cloudflare Workers | QuickJS-ng | txiki.js | JerryScript | ClearScript |
| ---------- | ---- | ------- | --- | -------- | ------------------ | ---------- | -------- | ----------- | ----------- |
| Supported  | Yes  | Yes     | Yes | Yes      | Yes                | Yes        | Yes      | Yes         | Yes         |

Pure character handling. Runs everywhere.

Yes = full support, Partial = usable subset, No = not supported.

How each column is established -- Deno: tested per module by the group's own test matrix, on every push; Node.js, Bun: tested per module against the generated npm package, on every push; Chromium, Cloudflare Workers: **no automated coverage**; an end-to-end suite exists but no CI job runs it; QuickJS-ng, txiki.js, JerryScript, ClearScript: **asserted**; verified only by the conformance lab, which nothing here runs.

<!-- runtime-support:end -->

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/chars/doc)

A list of other modules can be found at [github.com/neotales/js-libraries](https://github.com/neotales/js-libraries)

## Installation

```bash
# Deno
deno add jsr:@neotales/chars

# npm from jsr
npx jsr add @neotales/chars

# from npmjs.org
npm install @neotales/chars
```

## Usage

```typescript
import {
  equalFold,
  isAscii,
  isDigit,
  isLatin1,
  isLowerAt,
  isSpaceAt,
  isUpperAt,
} from "@neotales/chars";

const str = "Hello, World 123";
console.log(isUpperAt(str, 0)); // true
console.log(isUpperAt(str, 1)); // false
console.log(isLowerAt(str, 1)); // false
console.log(isDigit(str, 1)); // false
console.log(isDigit(str, 14)); // true

const left = "Ꙏ".codePointAt(0);
const right = "ꙏ".codePointAt(0);
console.log(equalFold(left, right)); // true

console.log(isAsciiAt("⇼", 0)); // false
console.log(isAsciiAt(str, 0)); // true
console.log(isLatin1At("⇼", 0)); // false

const str2 = " \n\r\t\f";
console.log(isSpaceAt(str2, 0)); // true
console.log(isSpaceAt(str2, 1)); // true
console.log(isSpaceAt(str2, 2)); // true
console.log(isSpaceAt(str2, 3)); // true
```

## Functions

The char module provides functions common character functions:

- `equalFold` - `true` when two characters are equal using case insensitivity.
- `isAscii` - `true` when character is ascii.
- `isChar` - `true` when a number value is a valid character.
- `isControl` - `true` when a character is a control character.
- `isDigit` - `true` when a character is a digit.
- `isLatin1` - `true` when a character is in the latin charset.
- `isLetterOrDigit` - `true` when a character is a letter or digit.
- `isLetter` - `true` when a charater is a letter.
- `isLower` - `true` when a character is a lower case letter.
- `isPunc` - `true` when a character is a punction mark.
- `isSpace` - `true` when a character is a space character.`\n \r\t\f`.
- `isSymbol` - `true` when a character is a symbol.
- `isUpper` - `true` when a character is uppercase.
- `simpleFold` - when a character has a lower or higher character, fold will flip them.
- `toLower` - converts a character to its lowercase counterpart, if applicable.
- `toUpper` - converts a character to its uppercase counterpart, if applicable.

## Constants

```ts
export const CHAR_UPPERCASE_A = 65; /* A */
export const CHAR_LOWERCASE_A = 97; /* a */
export const CHAR_UPPERCASE_Z = 90; /* Z */
export const CHAR_LOWERCASE_Z = 122; /* z */
// Non-alphabetic chars.
export const CHAR_DOT = 46; /* . */
export const CHAR_FORWARD_SLASH = 47; /* / */
export const CHAR_BACKWARD_SLASH = 92; /* \ */
export const CHAR_VERTICAL_LINE = 124; /* | */
export const CHAR_COLON = 58; /* : */
export const CHAR_QUESTION_MARK = 63; /* ? */
export const CHAR_UNDERSCORE = 95; /* _ */
export const CHAR_LINE_FEED = 10; /* \n */
export const CHAR_CARRIAGE_RETURN = 13; /* \r */
export const CHAR_TAB = 9; /* \t */
export const CHAR_FORM_FEED = 12; /* \f */
export const CHAR_EXCLAMATION_MARK = 33; /* ! */
export const CHAR_HASH = 35; /* # */
export const CHAR_SPACE = 32; /*   */
export const CHAR_NO_BREAK_SPACE = 160; /* \u00A0 */
export const CHAR_ZERO_WIDTH_NOBREAK_SPACE = 65279; /* \uFEFF */
export const CHAR_LEFT_SQUARE_BRACKET = 91; /* [ */
export const CHAR_RIGHT_SQUARE_BRACKET = 93; /* ] */
export const CHAR_LEFT_ANGLE_BRACKET = 60; /* < */
export const CHAR_RIGHT_ANGLE_BRACKET = 62; /* > */
export const CHAR_LEFT_CURLY_BRACKET = 123; /* { */
export const CHAR_RIGHT_CURLY_BRACKET = 125; /* } */
export const CHAR_HYPHEN_MINUS = 45; /* - */
export const CHAR_PLUS = 43; /* + */
export const CHAR_DOUBLE_QUOTE = 34; /* " */
export const CHAR_SINGLE_QUOTE = 39; /* ' */
export const CHAR_PERCENT = 37; /* % */
export const CHAR_SEMICOLON = 59; /* ; */
export const CHAR_CIRCUMFLEX_ACCENT = 94; /* ^ */
export const CHAR_GRAVE_ACCENT = 96; /* ` */
export const CHAR_AT = 64; /* @ */
export const CHAR_AMPERSAND = 38; /* & */
export const CHAR_TILDA = 126; /* ~ */
export const CHAR_DOLLAR = 36; /* $ */
export const CHAR_VERTICAL_TAB = 11; /* \v */
export const CHAR_ASTERISK = 42; /* * */
export const CHAR_COMMA = 44; /* , */
/**
 * Equal character (`=`) code (61).
 */
export const CHAR_EQUAL = 61; /* = */
// Digits
export const CHAR_0 = 48; /* 0 */
export const CHAR_9 = 57; /* 9 */
export const MAX_RUNE = 0x10ffff;
```

## License

[MIT License](./LICENSE.md)
