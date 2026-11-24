/**
 * ## Overview
 *
 * Split, join, splat, and parse command line arguments.
 *
 * ![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)
 *
 * [![JSR](https://jsr.io/badges/@neotales/args)](https://jsr.io/@neotales/args)
 * [![npm version](https://badge.fury.io/js/@neotales%2Fargs.svg)](https://badge.fury.io/js/@neotales%2Fargs)
 * [![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-lib.svg)](https://badge.fury.io/gh/neotales%2Fjs-lib)
 *
 * ## Documentation
 *
 * Documentation is available on [jsr.io](https://jsr.io/@neotales/args/doc)
 *
 * A list of other modules can be found at [github.com/neotales/js-lib](https://github.com/neotales/js-lib)
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@neotales/args
 *
 * # npm from jsr
 * npx jsr add @neotales/args
 *
 * # from npmjs.org
 * npm install @neotales/args
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { split, join, parse, splat } from "@neotales/args";
 *
 * console.log(split("echo hello world --test")); // ["echo", "hello", "world", "--test"]
 *
 * console.log(join(["echo", "hello", "world"])); // "echo hello world"
 *
 * console.log(join(["echo", "hello world"])); // "echo \"hello world\""
 *
 * const args = splat({
 *     "foo": "bar",
 *     splat: {
 *         command: ["git", "clone"],
 *     } as SplatOptions,
 * });
 *
 * console.log(args); // ["git", "clone", "--foo", "bar"]
 *
 * console.log(parse(["--name", "neo", "input.txt"]));
 * // { _: ["input.txt"], name: "neo" }
 * ```
 *
 * ## Functions
 *
 * - `split` - splits a string into an array of arguments/args.
 * - `join` - joins an array of arguments/args into a string.
 * - `splat` - converts an object with args into an array of arguments/args.
 * - `parse` - parses command line arguments into an object.
 *
 * ## License
 *
 * [MIT License](./LICENSE.md)
 *
 * @module
 */
export * from "./splat.js";
export * from "./join.js";
export * from "./split.js";
export * from "./parse.js";
