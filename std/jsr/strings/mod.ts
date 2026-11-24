/**
 * ## Overview
 *
 * A comprehensive string utilities library providing case-insensitive comparisons,
 * string transformations (camelize, dasherize, titleize), inflections (pluralize,
 * singularize), and validation functions. All comparison functions have a `Fold`
 * variant for case-insensitive matching with full UTF-8 support.
 *
 * ![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)
 *
 * [![JSR](https://jsr.io/badges/@neotales/strings)](https://jsr.io/@neotales/strings)
 * [![npm version](https://badge.fury.io/js/@neotales%2Fstrings.svg)](https://badge.fury.io/js/@neotales%2Fstrings)
 * [![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-lib.svg)](https://badge.fury.io/gh/neotales%2Fjs-lib)
 *
 * ## Documentation
 *
 * Documentation is available on [jsr.io](https://jsr.io/@neotales/strings/doc)
 *
 * A list of other modules can be found at [github.com/neotales/js-lib](https://github.com/neotales/js-lib)
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@neotales/strings
 *
 * # npm from jsr
 * npx jsr add @neotales/strings
 *
 * # from npmjs.org
 * npm install @neotales/strings
 * ```
 *
 * ## Quick Start
 *
 * ```typescript
 * import * as str from "@neotales/strings";
 *
 * // Case-insensitive comparison (supports UTF-8)
 * str.equalFold("Hello WÖrLD", "hello wörld"); // true
 *
 * // String transformations
 * str.camelize("hello_world");    // "helloWorld"
 * str.dasherize("HelloWorld");    // "hello-world"
 * str.titleize("hello world");    // "Hello World"
 * str.underscore("helloWorld");   // "hello_world"
 *
 * // Inflections
 * str.pluralize("person");        // "people"
 * str.singularize("octopuses");   // "octopus"
 *
 * // Validation
 * str.isEmpty("");                // true
 * str.isNullOrSpace("   ");       // true
 *
 * // Trim any character (not just whitespace)
 * str.trimEnd("file.txt...", "."); // "file.txt"
 * ```
 *
 * ## API Reference
 *
 * ### String Comparison
 *
 * | Function | Description |
 * |----------|-------------|
 * | `equal(value, other)` | Case-sensitive string equality |
 * | `equalFold(value, other)` | Case-insensitive string equality |
 * | `startsWith(value, prefix)` | Check if string starts with prefix |
 * | `startsWithFold(value, prefix)` | Case-insensitive prefix check |
 * | `endsWith(value, suffix)` | Check if string ends with suffix |
 * | `endsWithFold(value, suffix)` | Case-insensitive suffix check |
 * | `indexOf(value, chars, index?)` | Find first occurrence of substring |
 * | `indexOfFold(value, chars, index?)` | Case-insensitive indexOf |
 * | `lastIndexOf(value, chars, index?)` | Find last occurrence of substring |
 * | `lastIndexOfFold(value, chars, index?)` | Case-insensitive lastIndexOf |
 *
 * ```typescript
 * import { equalFold, startsWithFold, indexOf } from "@neotales/strings";
 *
 * // Case-insensitive comparison with UTF-8 support
 * equalFold("hello WÖrLD", "Hello wörld"); // true
 *
 * // Case-insensitive prefix check
 * startsWithFold("Hello World", "HELLO");  // true
 *
 * // Find substring position
 * indexOf("Hello World", "World");         // 6
 * indexOf("Hello World", "o", 5);          // 7 (start from index 5)
 * ```
 *
 * ### String Transformations
 *
 * | Function | Description |
 * |----------|-------------|
 * | `camelize(value, options?)` | Convert to camelCase |
 * | `pascalize(value)` | Convert to PascalCase |
 * | `dasherize(value, options?)` | Convert to kebab-case |
 * | `underscore(value, options?)` | Convert to snake_case |
 * | `titleize(value)` | Convert to Title Case |
 * | `capitalize(value, options?)` | Capitalize first letter |
 *
 * ```typescript
 * import { camelize, dasherize, underscore, titleize } from "@neotales/strings";
 *
 * // Case conversions
 * camelize("hello_world");           // "helloWorld"
 * camelize("hello WORLD", { preserveCase: true }); // "helloWORLD"
 *
 * dasherize("helloWorld");           // "hello-world"
 * dasherize("HelloWorld");           // "hello-world"
 *
 * underscore("helloWorld");          // "hello_world"
 * underscore("helloWorld", { screaming: true }); // "HELLO_WORLD"
 *
 * titleize("hello world");           // "Hello World"
 * ```
 *
 * ### Inflections
 *
 * | Function | Description |
 * |----------|-------------|
 * | `pluralize(word)` | Convert singular to plural |
 * | `singularize(word)` | Convert plural to singular |
 * | `inflect(word, count, singular?, plural?)` | Convert based on a count |
 *
 * ```typescript
 * import { inflect, pluralize, singularize } from "@neotales/strings";
 *
 * // Pluralization handles irregular forms
 * pluralize("person");    // "people"
 * pluralize("octopus");   // "octopuses"
 * pluralize("life");      // "lives"
 * pluralize("index");     // "indices"
 *
 * // Singularization
 * singularize("people");  // "person"
 * singularize("teeth");   // "tooth"
 * singularize("data");    // "datum"
 * inflect("person", 2);   // "people"
 * ```
 *
 * ### Validation Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `isEmpty(s)` | Check if string is empty |
 * | `isNull(s)` | Check if string is null |
 * | `isSpace(s)` | Check if string is only whitespace |
 * | `isUndefined(s)` | Check if string is undefined |
 * | `isNullOrEmpty(s)` | Check if null, undefined, or empty |
 * | `isNullOrSpace(s)` | Check if null, undefined, empty, or whitespace |
 *
 * ```typescript
 * import { isEmpty, isNullOrEmpty, isNullOrSpace, isUndefined } from "@neotales/strings";
 *
 * isEmpty("");           // true
 * isEmpty(" ");          // false (whitespace is not empty)
 *
 * isNullOrEmpty(null);   // true
 * isNullOrEmpty("");     // true
 *
 * isNullOrSpace("   ");  // true
 * isNullOrSpace("\t\n"); // true
 * isUndefined(undefined); // true
 * ```
 *
 * ### Trim Functions
 *
 * These functions can trim any character, not just whitespace.
 *
 * | Function | Description |
 * |----------|-------------|
 * | `trim(value, chars?)` | Trim from both ends |
 * | `trimStart(value, prefix?)` | Trim from start |
 * | `trimEnd(value, suffix?)` | Trim from end |
 * | `trimChar(value, char)` | Trim single character from both ends |
 * | `trimStartChar(value, char)` | Trim single character from start |
 * | `trimEndChar(value, char)` | Trim single character from end |
 *
 * ```typescript
 * import { trim, trimEnd, trimStart } from "@neotales/strings";
 *
 * // Trim specific characters
 * trimEnd("file.txt...", ".");      // "file.txt"
 * trimStart("///path/to", "/");     // "path/to"
 * trim("##title##", "#");           // "title"
 *
 * // Default behavior trims whitespace
 * trim("  hello  ");                // "hello"
 * ```
 *
 * ### Conversion And Splitting
 *
 * | Function | Description |
 * |----------|-------------|
 * | `split(value, separator, trim?, limit?)` | Split strings or character buffers |
 * | `toCharArray(value)` | Convert a string to Unicode code points |
 * | `toString(value)` | Convert a character buffer to a string |
 *
 * ```typescript
 * import { split, toCharArray, toString } from "@neotales/strings";
 *
 * split("a,b,c", ","); // ["a", "b", "c"]
 * [...toCharArray("a😀")]; // [97, 128512]
 * toString([97, 98, 99]); // "abc"
 * ```
 *
 * ### Classes
 *
 * | Class | Description |
 * |-------|-------------|
 * | `StringBuilder` | Efficient string building without concatenation |
 *
 * ```typescript
 * import { StringBuilder } from "@neotales/strings";
 *
 * const sb = new StringBuilder();
 * sb.append("Hello")
 *   .append(" ")
 *   .append("World");
 *
 * console.log(sb.toString()); // "Hello World"
 * console.log(sb.length);     // 11
 *
 * sb.clear();
 * console.log(sb.length);     // 0
 * ```
 *
 * ## Why Use This?
 *
 * - **Case-insensitive UTF-8**: `equalFold("WÖrLD", "wörld")` works correctly
 * - **No allocations**: Fold functions compare without creating lowercase copies
 * - **Trim any character**: Unlike native `trim()`, trim any characters you want
 * - **Comprehensive inflections**: Handles irregular plurals like person→people
 *
 * ## LICENSE
 *
 * [MIT License](./LICENSE.md)
 *
 * Pluralize and singularize comes from
 * [dreamerslab/node.inflection](https://github.com/dreamerslab/node.inflection) which is under the
 * [MIT LICENSE](https://github.com/dreamerslab/node.inflection/blob/master/LICENSE)
 *
 * @module
 */
export * from "./camelize.ts";
export * from "./capitalize.ts";
export * from "./dasherize.ts";
export * from "./ends_with.ts";
export * from "./equal.ts";
export * from "./index_of.ts";
export * from "./inflect.ts";
export * from "./is_null.ts";
export * from "./is_empty.ts";
export * from "./is_space.ts";
export * from "./is_undefined.ts";
export * from "./last_index_of.ts";
export * from "./pascalize.ts";
export * from "./split.ts";
export * from "./starts_with.ts";
export * from "./string_builder.ts";
export * from "./titleize.ts";
export * from "./to_char_array.ts";
export * from "./trim.ts";
export * from "./underscore.ts";
