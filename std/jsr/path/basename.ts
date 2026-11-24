// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "./_globals.ts";
import { basename as posixBasename } from "./posix/basename.ts";
import { basename as windowsBasename } from "./windows/basename.ts";

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
export function basename(path: string | URL, suffix = ""): string {
  return isWindows ? windowsBasename(path, suffix) : posixBasename(path, suffix);
}
