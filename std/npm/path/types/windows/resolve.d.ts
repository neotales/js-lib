/**
 * Resolves path segments into a `path`.
 *
 * @example Usage
 * ```ts
 * import { resolve } from "@neotales/path/windows/resolve";
 * import { equal } from "node:assert/strict";
 *
 * const resolved = resolve("C:\\foo\\bar", "..\\baz");
 * equal(resolved, "C:\\foo\\baz");
 * ```
 *
 * @param pathSegments The path segments to process to path
 * @returns The resolved path
 */
export declare function resolve(...pathSegments: string[]): string;
