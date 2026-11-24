/**
 * Verifies whether provided path is absolute.
 *
 * @example Usage
 * ```ts
 * import { isAbsolute } from "@neotales/path/windows/is-absolute";
 * import { ok as assert } from "node:assert/strict";
 *
 * assert(isAbsolute("C:\\foo\\bar"));
 * assert(!isAbsolute("..\\baz"));
 * ```
 *
 * @param path The path to verify.
 * @returns `true` if the path is absolute, `false` otherwise.
 */
export declare function isAbsolute(path: string): boolean;
