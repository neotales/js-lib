/**
 * Joins a sequence of paths, then normalizes the resulting path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@neotales/path/join";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(join("C:\\foo", "bar", "baz\\quux", "garply", ".."), "C:\\foo\\bar\\baz\\quux");
 * } else {
 *   equal(join("/foo", "bar", "baz/quux", "garply", ".."), "/foo/bar/baz/quux");
 * }
 * ```
 *
 * @param paths Paths to be joined and normalized.
 * @returns The joined and normalized path.
 */
export declare function join(path: string | URL, ...paths: string[]): string;
