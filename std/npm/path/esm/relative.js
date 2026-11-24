// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.js";
import { relative as posixRelative } from "./posix/relative.js";
import { relative as windowsRelative } from "./windows/relative.js";
/**
 * Return the relative path from `from` to `to` based on current working
 * directory.
 *
 * @example Usage
 * ```ts
 * import { relative } from "@neotales/path/relative";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   const path = relative("C:\\foobar\\test\\aaa", "C:\\foobar\\impl\\bbb");
 *   equal(path, "..\\..\\impl\\bbb");
 * } else {
 *   const path = relative("/data/foobar/test/aaa", "/data/foobar/impl/bbb");
 *   equal(path, "../../impl/bbb");
 * }
 * ```
 *
 * @param from Path in current working directory.
 * @param to Path in current working directory.
 * @returns The relative path from `from` to `to`.
 */
export function relative(from, to) {
    return isWindows ? windowsRelative(from, to) : posixRelative(from, to);
}
