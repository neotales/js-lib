// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.js";
import { joinGlobs as posixJoinGlobs } from "./posix/join_globs.js";
import { joinGlobs as windowsJoinGlobs } from "./windows/join_globs.js";
/**
 * Joins a sequence of globs, then normalizes the resulting glob.
 *
 * Behaves like {@linkcode https://jsr.io/@neotales/path/doc/~/join | join()}, but
 * doesn't collapse `**\/..` when `globstar` is true.
 *
 * @example Usage
 * ```ts
 * import { joinGlobs } from "@neotales/path/join-globs";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(joinGlobs(["foo", "bar", "..", "baz"]), "foo\\baz");
 *   equal(joinGlobs(["foo", "**", "bar", "..", "baz"], { globstar: true }), "foo\\**\\baz");
 * } else {
 *   equal(joinGlobs(["foo", "bar", "..", "baz"]), "foo/baz");
 *   equal(joinGlobs(["foo", "**", "bar", "..", "baz"], { globstar: true }), "foo/**\/baz");
 * }
 * ```
 *
 * @param globs Globs to be joined and normalized.
 * @param options Glob options.
 * @returns The joined and normalized glob string.
 */
export function joinGlobs(globs, options = {}) {
    return isWindows ? windowsJoinGlobs(globs, options) : posixJoinGlobs(globs, options);
}
