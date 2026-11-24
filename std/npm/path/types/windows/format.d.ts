import type { ParsedPath } from "../types.js";
/**
 * Generate a path from `ParsedPath` object.
 *
 * @example Usage
 * ```ts
 * import { format } from "@neotales/path/windows/format";
 * import { equal } from "node:assert/strict";
 *
 * const path = format({
 *   root: "C:\\",
 *   dir: "C:\\path\\dir",
 *   base: "file.txt",
 *   ext: ".txt",
 *   name: "file"
 * });
 * equal(path, "C:\\path\\dir\\file.txt");
 * ```
 *
 * @param pathObject The path object to format.
 * @returns The formatted path.
 */
export declare function format(pathObject: Partial<ParsedPath>): string;
