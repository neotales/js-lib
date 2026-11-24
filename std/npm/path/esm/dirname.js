// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.js";
import { dirname as posixDirname } from "./posix/dirname.js";
import { dirname as windowsDirname } from "./windows/dirname.js";
/**
 * Return the directory path of a path.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@neotales/path/dirname";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(dirname("C:\\home\\user\\Documents\\image.png"), "C:\\home\\user\\Documents");
 * } else {
 *   equal(dirname("/home/user/Documents/image.png"), "/home/user/Documents");
 * }
 * ```
 *
 * @param path Path to extract the directory from.
 * @returns The directory path.
 */
export function dirname(path) {
    return isWindows ? windowsDirname(path) : posixDirname(path);
}
