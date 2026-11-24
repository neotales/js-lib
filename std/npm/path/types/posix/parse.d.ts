import type { ParsedPath } from "../types.js";
export type { ParsedPath } from "../types.js";
/**
 * Return a `ParsedPath` object of the `path`.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@neotales/path/posix/parse";
 * import { equal } from "node:assert/strict";
 *
 * const path = parse("/home/user/file.txt");
 * equal(path, {
 *   root: "/",
 *   dir: "/home/user",
 *   base: "file.txt",
 *   ext: ".txt",
 *   name: "file"
 * });
 * ```
 *
 * @param path The path to parse.
 * @returns The parsed path object.
 */
export declare function parse(path: string): ParsedPath;
