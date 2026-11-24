/**
 * Verifies whether provided path is absolute.
 *
 * @example Usage
 * ```ts
 * import { isAbsolute } from "@neotales/path/posix/is-absolute";
 * import { ok as assert } from "node:assert/strict";
 *
 * assert(isAbsolute("/home/user/Documents/"));
 * assert(!isAbsolute("home/user/Documents/"));
 * ```
 *
 * @param path The path to verify.
 * @returns Whether the path is absolute.
 */
export declare function isAbsolute(path: string): boolean;
