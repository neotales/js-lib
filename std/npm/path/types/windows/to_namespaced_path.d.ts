/**
 * Resolves path to a namespace path
 *
 * @example Usage
 * ```ts
 * import { toNamespacedPath } from "@neotales/path/windows/to-namespaced-path";
 * import { equal } from "node:assert/strict";
 *
 * const namespaced = toNamespacedPath("C:\\foo\\bar");
 * equal(namespaced, "\\\\?\\C:\\foo\\bar");
 * ```
 *
 * @param path The path to resolve to namespaced path
 * @returns The resolved namespaced path
 */
export declare function toNamespacedPath(path: string): string;
