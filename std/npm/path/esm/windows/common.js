// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { common as _common } from "../_common/common.js";
import { SEPARATOR } from "./constants.js";
/**
 * Determines the common path from a set of paths for Windows systems.
 *
 * @example Usage
 * ```ts
 * import { common } from "@neotales/path/windows/common";
 * import { equal } from "node:assert/strict";
 *
 * const path = common([
 *   "C:\\foo\\bar",
 *   "C:\\foo\\baz",
 * ]);
 * equal(path, "C:\\foo\\");
 * ```
 *
 * @param paths The paths to compare.
 * @returns The common path.
 */
export function common(paths) {
    return _common(paths, SEPARATOR);
}
