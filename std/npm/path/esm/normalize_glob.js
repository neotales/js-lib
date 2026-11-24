// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.js";
import { normalizeGlob as posixNormalizeGlob } from "./posix/normalize_glob.js";
import { normalizeGlob as windowsNormalizeGlob } from "./windows/normalize_glob.js";
/**
 * Normalizes a glob string.
 *
 * Behaves like
 * {@linkcode https://jsr.io/@neotales/path/doc/~/normalize | normalize()}, but
 * doesn't collapse "**\/.." when `globstar` is true.
 *
 * @example Usage
 * ```ts
 * import { normalizeGlob } from "@neotales/path/normalize-glob";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(normalizeGlob("foo\\bar\\..\\baz"), "foo\\baz");
 *   equal(normalizeGlob("foo\\**\\..\\bar\\..\\baz", { globstar: true }), "foo\\**\\..\\baz");
 * } else {
 *   equal(normalizeGlob("foo/bar/../baz"), "foo/baz");
 *   equal(normalizeGlob("foo/**\/../bar/../baz", { globstar: true }), "foo/**\/../baz");
 * }
 * ```
 *
 * @param glob Glob string to normalize.
 * @param options Glob options.
 * @returns The normalized glob string.
 */
export function normalizeGlob(glob, options = {}) {
    return isWindows ? windowsNormalizeGlob(glob, options) : posixNormalizeGlob(glob, options);
}
