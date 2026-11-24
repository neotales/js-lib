/**
 * Verifies whether provided path is absolute.
 *
 * @example Usage
 * ```ts
 * import { isAbsolute } from "@neotales/path/is-absolute";
 * import { ok as assert } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   assert(isAbsolute("C:\\home\\foo"));
 *   assert(!isAbsolute("home\\foo"));
 * } else {
 *   assert(isAbsolute("/home/foo"));
 *   assert(!isAbsolute("home/foo"));
 * }
 * ```
 *
 * @param path Path to be verified as absolute.
 * @returns `true` if path is absolute, `false` otherwise
 */
export declare function isAbsolute(path: string): boolean;
