// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { assertPath } from "../_common/assert_path.ts";
import { isPosixPathSeparator } from "./_util.ts";

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
export function isAbsolute(path: string): boolean {
  assertPath(path);
  return path.length > 0 && isPosixPathSeparator(path.charCodeAt(0));
}
