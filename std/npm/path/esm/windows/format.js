// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertArg, formatPath } from "../_common/format.js";
/**
 * Generate a path from `ParsedPath` object.
 *
 * @example Usage
 * ```ts
 * import { format } from "@neotales/path/windows/format";
 * import { equal } from "node:assert/strict";
 *
 * const path = format({
 *   root: "C:\\",
 *   dir: "C:\\path\\dir",
 *   base: "file.txt",
 *   ext: ".txt",
 *   name: "file"
 * });
 * equal(path, "C:\\path\\dir\\file.txt");
 * ```
 *
 * @param pathObject The path object to format.
 * @returns The formatted path.
 */
export function format(pathObject) {
    assertArg(pathObject);
    return formatPath("\\", pathObject);
}
