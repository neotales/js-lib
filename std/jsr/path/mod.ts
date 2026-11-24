/**
 * ## Overview
 *
 * Path utilities for operating system file paths that is a repackage
 * of the [@std/path](https://jsr.io/@std/path) module with minor
 * changes to enable it to work in node and bun.
 *
 * Deno's @std/path is based upon [Browserify's implementation of path](https://github.com/browserify/path-browserify/tree/master).
 *
 * ![logo](https://raw.githubusercontent.com/neotales/js-libraries/refs/heads/dev/eng/assets/logo.png)
 *
 * [![JSR](https://jsr.io/badges/@neotales/path)](https://jsr.io/@neotales/path)
 * [![npm version](https://badge.fury.io/js/@neotales%2Fpath.svg)](https://badge.fury.io/js/@neotales%2Fpath)
 * [![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-std.svg)](https://badge.fury.io/gh/neotales%2Fjs-std)
 *
 * ## Documentation
 *
 * Documentation is available on [jsr.io](https://jsr.io/@neotales/path/doc)
 *
 * A list of other modules can be found at [github.com/neotales/js-libraries](https://github.com/neotales/js-libraries)
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@neotales/path
 *
 * # npm from jsr
 * npx jsr add @neotales/path
 *
 * # from npmjs.org
 * npm install @neotales/path
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { resolve, join, isAbsolute, basename, dirname } from "@neotales/path";
 *
 * console.log(isAbsolute("./test"));
 *
 * const dir = resolve("./test");
 * const file = join(dir, "text.txt");
 * console.log(dir);
 * console.log(isAbsolute(dir));
 * console.log(file);
 * console.log(dirname(file));
 * console.log(basename(file));
 *
 * ```
 *
 * ## Functions
 *
 * - **basename** - Return the last portion of a path.
 * - **common** - Determines the common path from a set of paths for the given OS.
 * - **dirname** - Return the directory path of a path.
 * - **extname** - Return the extension of the path with leading period (".").
 * - **format** - Generate a path from a ParsedPath object.
 * - **fromFileUrl** - Converts a file URL to a path string.
 * - **globToRegexp** - Converts a glob string to a regular expression.
 * - **isAbsolute** - Verifies whether provided path is absolute.
 * - **isGlob** - Test whether the given string is a glob.
 * - **joinGlobs** - Joins a sequence of globs, then normalizes the resulting glob.
 * - **join** - Joins a sequence of paths, then normalizes the resulting path.
 * - **match** - Tests a path against a glob pattern.
 * - **matchesGlob** - Node.js-compatible alias for `match`.
 * - **normalizeGlob** - Normalizes a glob string.
 * - **normalize** - Normalize the path, resolving `'..'` and `'.'` segments.
 * - **parse** - Return an object containing the parsed components of the path.
 * - **relative** - Return the relative path from `from` to `to` based on current working directory.
 * - **resolve** -  Resolves path segments into a path.
 * - **toFileUrl** - Converts a path string to a file URL.
 * - **toNamespacedPath** - Resolves path to a namespace path.  This is a no-op on non-windows systems.
 *
 * ## Notes
 *
 * @neotales/path repackages @std/path for Node and Bun and avoids runtime
 * package shims when shipping @neotales modules to npm. It also includes URL
 * helpers such as `toFileUrl` and `fromFileUrl`.
 *
 * ## License
 *
 * [MIT License](./LICENSE.md)
 *
 * @module
 */
export * from "./basename.ts";
export * from "./constants.ts";
export * from "./dirname.ts";
export * from "./extname.ts";
export * from "./format.ts";
export * from "./from_file_url.ts";
export * from "./is_absolute.ts";
export * from "./join.ts";
export * from "./normalize.ts";
export * from "./parse.ts";
export * from "./relative.ts";
export * from "./resolve.ts";
export * from "./to_file_url.ts";
export * from "./to_namespaced_path.ts";
export * from "./common.ts";
export * from "./types.ts";
export * from "./glob_to_regexp.ts";
export * from "./is_glob.ts";
export * from "./join_globs.ts";
export * from "./match.ts";
export * from "./matches_glob.ts";
export * from "./normalize_glob.ts";
