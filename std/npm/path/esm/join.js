// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.js";
import { join as posixJoin } from "./posix/join.js";
import { join as windowsJoin } from "./windows/join.js";
/**
 * Joins a sequence of paths, then normalizes the resulting path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@neotales/path/join";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(join("C:\\foo", "bar", "baz\\quux", "garply", ".."), "C:\\foo\\bar\\baz\\quux");
 * } else {
 *   equal(join("/foo", "bar", "baz/quux", "garply", ".."), "/foo/bar/baz/quux");
 * }
 * ```
 *
 * @param paths Paths to be joined and normalized.
 * @returns The joined and normalized path.
 */
export function join(path, ...paths) {
    return isWindows ? windowsJoin(path, ...paths) : posixJoin(path, ...paths);
}
