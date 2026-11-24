# @neotales/strings

## Overview

String utilities with case-insensitive comparisons, case transformations,
inflections, validation helpers, trims, splitting, and a `StringBuilder`. The
`Fold` variants compare without allocating a lowercase copy.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/strings)](https://jsr.io/@neotales/strings)
[![npm version](https://badge.fury.io/js/@neotales%2Fstrings.svg?icon=si%3Anpm)](https://badge.fury.io/js/@neotales%2Fstrings)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/strings/doc).

[Module list](https://github.com/neotales/js-lib).

## Installation

```bash
# Deno
deno add jsr:@neotales/strings

# npm from jsr
npx jsr add @neotales/strings

# from npmjs.org
npm install @neotales/strings
```

### Runtime support

The module README table is the support claim.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source |
| Node.js | ✅ | published npm ESM twin (node >= 22) |
| Bun | ✅ | source; Bun rewrites @neotales/ imports to relative paths |
| Ende | ✅ | source |
| QuickJS-ng | ✅* | one ESM bundle |
| workerd | ✅ | one ESM bundle, imported from the worker |
| txiki.js | ✅ | one ESM bundle, run with `tjs run` |
| ClearScript | ✅* | TypeScript graph transpiled to .js, then loaded by the host |
| browsers | ✅ | one ESM bundle, no syntax rewrite |
| JerryScript | ✅* | IIFE, ES2020 pass, then console mapped to print; the pass rewrites the private fields in slices |

* `split` accepts a string, a `Uint8Array`, or a `Uint32Array`. Decoding the
`Uint8Array` form uses the runtime's `TextDecoder`. QuickJS-ng, ClearScript,
and JerryScript do not provide `TextDecoder`, so that one case is skipped and
the rest of the suite runs.

Load instructions: [runtime documentation](../../../docs/README.md).

## Usage

```typescript
import * as str from "@neotales/strings";

// Case-insensitive comparison (supports UTF-8)
str.equalFold("Hello WÖrLD", "hello wörld"); // true

// String transformations
str.camelize("hello_world"); // "helloWorld"
str.dasherize("HelloWorld"); // "hello-world"
str.titleize("hello world"); // "Hello World"
str.underscore("helloWorld"); // "hello_world"

// Inflections
str.pluralize("person"); // "people"
str.singularize("octopuses"); // "octopus"

// Validation
str.isEmpty(""); // true
str.isNullOrSpace("   "); // true

// Trim any character (not just whitespace)
str.trimEnd("file.txt...", "."); // "file.txt"
```

## String comparison

| Function                                | Description                        |
| --------------------------------------- | ---------------------------------- |
| `equal(value, other)`                   | Case-sensitive string equality     |
| `equalFold(value, other)`               | Case-insensitive string equality   |
| `startsWith(value, prefix)`             | Check if string starts with prefix |
| `startsWithFold(value, prefix)`         | Case-insensitive prefix check      |
| `endsWith(value, suffix)`               | Check if string ends with suffix   |
| `endsWithFold(value, suffix)`           | Case-insensitive suffix check      |
| `indexOf(value, chars, index?)`         | Find first occurrence of substring |
| `indexOfFold(value, chars, index?)`     | Case-insensitive indexOf           |
| `lastIndexOf(value, chars, index?)`     | Find last occurrence of substring  |
| `lastIndexOfFold(value, chars, index?)` | Case-insensitive lastIndexOf       |

## String transformations

| Function                      | Description             |
| ----------------------------- | ----------------------- |
| `camelize(value, options?)`   | Convert to camelCase    |
| `pascalize(value)`            | Convert to PascalCase   |
| `dasherize(value, options?)`  | Convert to kebab-case   |
| `underscore(value, options?)` | Convert to snake_case   |
| `titleize(value)`             | Convert to Title Case   |
| `capitalize(value, options?)` | Capitalize first letter |

## Inflections

| Function                                   | Description                |
| ------------------------------------------ | -------------------------- |
| `pluralize(word)`                          | Convert singular to plural |
| `singularize(word)`                        | Convert plural to singular |
| `inflect(word, count, singular?, plural?)` | Convert based on a count   |

Pluralize and singularize come from
[dreamerslab/node.inflection](https://github.com/dreamerslab/node.inflection),
which is MIT licensed.

## Validation

| Function           | Description                                    |
| ------------------ | ---------------------------------------------- |
| `isEmpty(s)`       | Check if string is empty                       |
| `isNull(s)`        | Check if string is null                        |
| `isSpace(s)`       | Check if string is only whitespace             |
| `isUndefined(s)`   | Check if string is undefined                   |
| `isNullOrEmpty(s)` | Check if null, undefined, or empty             |
| `isNullOrSpace(s)` | Check if null, undefined, empty, or whitespace |

## Trim

These functions can trim any character, not just whitespace.

| Function                     | Description                          |
| ---------------------------- | ------------------------------------ |
| `trim(value, chars?)`        | Trim from both ends                  |
| `trimStart(value, prefix?)`  | Trim from start                      |
| `trimEnd(value, suffix?)`    | Trim from end                        |
| `trimChar(value, char)`      | Trim single character from both ends |
| `trimStartChar(value, char)` | Trim single character from start     |
| `trimEndChar(value, char)`   | Trim single character from end       |

## Conversion and splitting

| Function                                 | Description                             |
| ---------------------------------------- | --------------------------------------- |
| `split(value, separator, trim?, limit?)` | Split strings or character buffers      |
| `toCharArray(value)`                     | Convert a string to Unicode code points |
| `toString(value)`                        | Convert a character buffer to a string  |

## Classes

| Class           | Description                                     |
| --------------- | ----------------------------------------------- |
| `StringBuilder` | Efficient string building without concatenation |

## License

[MIT License](./LICENSE.md)
