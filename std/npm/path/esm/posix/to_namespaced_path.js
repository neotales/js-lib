// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * Converts a path to a namespaced path. This function returns the path as is on posix.
 *
 * @example Usage
 * ```ts
 * import { toNamespacedPath } from "@neotales/path/posix/to-namespaced-path";
 * import { equal } from "node:assert/strict";
 *
 * equal(toNamespacedPath("/home/foo"), "/home/foo");
 * ```
 *
 * @param path The path.
 * @returns The namespaced path.
 */
export function toNamespacedPath(path) {
    // Non-op on posix systems
    return path;
}
