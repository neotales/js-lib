/**
 * Test whether the given string is a glob.
 *
 * @example Usage
 * ```ts
 * import { isGlob } from "@neotales/path/is-glob";
 * import { ok as assert } from "node:assert/strict";
 *
 * assert(!isGlob("foo/bar/../baz"));
 * assert(isGlob("foo/*ar/../baz"));
 * ```
 *
 * @param str String to test.
 * @returns `true` if the given string is a glob, otherwise `false`
 */
export declare function isGlob(str: string): boolean;
