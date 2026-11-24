// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.js";
import { fromFileUrl as posixFromFileUrl } from "./posix/from_file_url.js";
import { fromFileUrl as windowsFromFileUrl } from "./windows/from_file_url.js";
/**
 * Converts a file URL to a path string.
 *
 * @example Usage
 * ```ts
 * import { fromFileUrl } from "@neotales/path/from-file-url";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(fromFileUrl("file:///home/foo"), "\\home\\foo");
 *   equal(fromFileUrl("file:///C:/Users/foo"), "C:\\Users\\foo");
 *   equal(fromFileUrl("file://localhost/home/foo"), "\\home\\foo");
 * } else {
 *   equal(fromFileUrl("file:///home/foo"), "/home/foo");
 * }
 * ```
 *
 * @param url The file URL to convert to a path.
 * @returns The path string.
 */
export function fromFileUrl(url) {
    return isWindows ? windowsFromFileUrl(url) : posixFromFileUrl(url);
}
