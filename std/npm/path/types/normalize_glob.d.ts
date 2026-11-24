import type { GlobOptions } from "./_common/glob_to_reg_exp.js";
export type { GlobOptions };
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
export declare function normalizeGlob(glob: string, options?: GlobOptions): string;
