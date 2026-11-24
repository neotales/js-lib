// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "./_globals.ts";
import { dirname as posixDirname } from "./posix/dirname.ts";
import { dirname as windowsDirname } from "./windows/dirname.ts";

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
export function dirname(path: string | URL): string {
  return isWindows ? windowsDirname(path) : posixDirname(path);
}
