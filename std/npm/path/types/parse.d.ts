import type { ParsedPath } from "./types.js";
export type { ParsedPath } from "./types.js";
/**
 * Return an object containing the parsed components of the path.
 *
 * Use {@linkcode https://jsr.io/@neotales/path/doc/~/format | format()} to reverse
 * the result.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@neotales/path/parse";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   const parsedPathObj = parse("C:\\path\\to\\script.ts");
 *   equal(parsedPathObj.root, "C:\\");
 *   equal(parsedPathObj.dir, "C:\\path\\to");
 *   equal(parsedPathObj.base, "script.ts");
 *   equal(parsedPathObj.ext, ".ts");
 *   equal(parsedPathObj.name, "script");
 * } else {
 *   const parsedPathObj = parse("/path/to/dir/script.ts");
 *   parsedPathObj.root; // "/"
 *   parsedPathObj.dir; // "/path/to/dir"
 *   parsedPathObj.base; // "script.ts"
 *   parsedPathObj.ext; // ".ts"
 *   parsedPathObj.name; // "script"
 * }
 * ```
 *
 * @param path Path to process
 * @returns An object with the parsed path components.
 */
export declare function parse(path: string): ParsedPath;
