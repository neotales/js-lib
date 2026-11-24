// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.js";
import { basename as posixBasename } from "./posix/basename.js";
import { basename as windowsBasename } from "./windows/basename.js";
/**
 * Return the last portion of a path.
 *
 * The trailing directory separators are ignored, and optional suffix is
 * removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@neotales/path/basename";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(basename("C:\\user\\Documents\\image.png"), "image.png");
 * } else {
 *   equal(basename("/home/user/Documents/image.png"), "image.png");
 * }
 * ```
 *
 * @param path Path to extract the name from.
 * @param suffix Suffix to remove from extracted name.
 *
 * @returns The basename of the path.
 */
export function basename(path, suffix = "") {
    return isWindows ? windowsBasename(path, suffix) : posixBasename(path, suffix);
}
