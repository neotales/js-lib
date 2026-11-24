// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "./_globals.ts";
import { toNamespacedPath as posixToNamespacedPath } from "./posix/to_namespaced_path.ts";
import { toNamespacedPath as windowsToNamespacedPath } from "./windows/to_namespaced_path.ts";

/**
 * Resolves path to a namespace path.  This is a no-op on
 * non-windows systems.
 *
 * @example Usage
 * ```ts
 * import { toNamespacedPath } from "@neotales/path/to-namespaced-path";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(toNamespacedPath("C:\\foo\\bar"), "\\\\?\\C:\\foo\\bar");
 * } else {
 *   equal(toNamespacedPath("/foo/bar"), "/foo/bar");
 * }
 * ```
 *
 * @param path Path to resolve to namespace.
 * @returns The resolved namespace path.
 */
export function toNamespacedPath(path: string): string {
  return isWindows ? windowsToNamespacedPath(path) : posixToNamespacedPath(path);
}
