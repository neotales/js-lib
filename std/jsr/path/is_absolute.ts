// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "./_globals.ts";
import { isAbsolute as posixIsAbsolute } from "./posix/is_absolute.ts";
import { isAbsolute as windowsIsAbsolute } from "./windows/is_absolute.ts";

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
export function isAbsolute(path: string): boolean {
  return isWindows ? windowsIsAbsolute(path) : posixIsAbsolute(path);
}
