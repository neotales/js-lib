# @neotales/slices

## Overview

Slices enable working with slices of an array without resizing or
creating new arrays in most cases. Instead, new slices are
created that that allows one to work with a segment of the
array.

They are not as effecient as go's `slice` or .NET's `Span<T>`, but
they do provide some benefits for dealing with smaller segments
of arrays or character slices and helpful with dealing with chars
and strings. Slices can convert a string into Uint8array and perform
multiple transforms before being converted back into a string.

The CharSlice and ReadOnlyCharSlice are specialized slice types
for working with string characters in their uint32 codepoint format
and provide string like methods such as trim, indexof, toUpper,
toLower, includes, and more without the need to convert them
back into strings to perform those operations.

The CharSlice and ReadOnlyCharSlice allow you to work with
strings without allocating multiple copies of immuatable strings
and allow you to make multiple transforms before
converting back to a string.

The case insensitive formats of methods end with "Fold" which
are based upon go's `SimpleFold` and `EqualFold` methods. For
example: `equalFold`, `startsWithFold`, `endsWithFold`, `indexOfFold`
perform case insensitive comparisons over strings or CharSliceLike
objects such as CharSlice or Uint32Arrays.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/slices)](https://jsr.io/@neotales/slices)
[![npm version](https://badge.fury.io/js/@neotales%2Fslices.svg?icon=si%3Anpm)](https://badge.fury.io/js/@neotales%2Fslices)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/slices/doc)

[Module list](https://github.com/neotales/js-lib).

## Installation

```bash
# Deno
deno add jsr:@neotales/slices

# npm from jsr
npx jsr add @neotales/slices

# from npmjs.org
npm install @neotales/slices
```

### Runtime support

The module README table is the support claim.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source |
| Node.js | ✅ | published npm ESM twin (node >= 22) |
| Bun | ✅ | source; Bun rewrites @neotales/ imports to relative paths |
| Ende | ✅ | source |
| QuickJS-ng | ✅ | one ESM bundle |
| workerd | ✅ | one ESM bundle, imported from the worker |
| txiki.js | ✅ | one ESM bundle, run with `tjs run` |
| ClearScript | ✅ | TypeScript graph transpiled to .js, then loaded by the host |
| browsers | ✅ | one ESM bundle, no syntax rewrite |
| JerryScript | ✅ | IIFE, ES2020 pass, then console mapped to print; rewrites `#set`, `#offset`, `#length`, `#buffer`, `#start`, and `#end` |

Load instructions: [runtime documentation](../../../docs/README.md).

## Usage

```typescript
import * from slices from '@neotales/slices'

console.log(slices.equalIgnoreCase("left", "LeFT")); // true
console.log(slices.trimEnd("my random text...", ".")); // my random text
console.log(slices.underscore("first-place")); // first_place


var sb = new slices.CharArrayBuilder()
sb.append("test")
   .append(new TextEncoder().encode(": another test"));

// faster
sb.appendString("test")
  .appendUtf8Array(new TextEncoder().encode(": another test"))

console.log(sb.toString())

const slice = new slices.Slice([0, 3, 4], 1);
console.log(slice.at(0)); // 3
console.log(slice.length); // 2

const slice2 = slices.slice([0, 1, 2])
const slice3 = slice2.slice(1)
console.log(slice2).at(0); // 0
console.log(slice3.at(0)); // 1
```

## Classes

- `CharArrayBuilder` - A builder for character arrays.
- `CharSlice` - A slice of characters.
- `ReadOnlySlice` - A readonly slice of characters.
- `Slice` - A slice of an array, which doesn't create a new array but
  acts as a view over the array.
- `ReadOnlySlice - A readonly slice of an array.

## Functions

- `camelize` - converts a word to camel case.
- `capitalize` - capitalizes a word.
- `charSlice` - creates a slice of characters from a string or Uint32Array.
- `readonlyCharSlice` - creates a readonly slice of characters from a string or Uint32Array.
- `dasherize` - converts a word to hyphen/dash case.
- `endsWith` - determines if a string or char array ends with characters.
- `endsWithFold` - determines if a string or char array ends with characters using case insensitivity.
- `equalFold` - determines if a string or char array with characeters.
- `equal` - determines if a string or char array with characters.
- `indexOfFold` - determines the index of a character or char array using case insensitivity.
- `indexOf` - determines the index of of a character or char array.
- `lastIndexOfFolder` - determines the last index of a character or char array using case insensitivity.
- `lastIndex` - determines the last index of a character or char array.
- `ordinalize` - converts word/number to the ordinal case.
- `pascalize` - converts a word to pascal case.
- `slice` - creates a slice from an array
- `readonlySlice` - creates a readonly slice from an array
- `startsWith` - determines if a string or char array starts with another char array.
- `startsWithFold` - determines if a string or char array starts with another char array using case insensitivity.
- `titleize` - converts characters into title case.
- `trim` - trims the specified characters from the start and end of a char array. defaults to whitespace.
- `trimStart` - trims the specified characters from the start of a char array. defaults to whitespace.
- `trimEnd` - trims the specified characters from the end of a char array. defaults to whitespace.
- `toCharArray` - converts a string to in array of characters/runes represented by a number.
- `toString` - converts an array of characters into a string.

## License

[MIT License](./LICENSE.md)
