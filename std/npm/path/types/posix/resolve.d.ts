/**
 * Resolves path segments into a `path`.
 *
 * @example Usage
 * ```ts
 * import { resolve } from "@neotales/path/posix/resolve";
 * import { equal } from "node:assert/strict";
 *
 * const path = resolve("/foo", "bar", "baz/asdf", "quux", "..");
 * equal(path, "/foo/bar/baz/asdf");
 * ```
 *
 * @param pathSegments The path segments to resolve.
 * @returns The resolved path.
 */
export declare function resolve(...pathSegments: string[]): string;
