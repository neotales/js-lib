// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.js";
import { format as posixFormat } from "./posix/format.js";
import { format as windowsFormat } from "./windows/format.js";
/**
 * Generate a path from a {@linkcode ParsedPath} object. It does the
 * opposite of {@linkcode https://jsr.io/@neotales/path/doc/~/parse | parse()}.
 *
 * @example Usage
 * ```ts
 * import { format } from "@neotales/path/format";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(format({ dir: "C:\\path\\to", base: "script.ts" }), "C:\\path\\to\\script.ts");
 * } else {
 *   equal(format({ dir: "/path/to/dir", base: "script.ts" }), "/path/to/dir/script.ts");
 * }
 * ```
 *
 * @param pathObject Object with path components.
 * @returns The formatted path.
 */
export function format(pathObject) {
    return isWindows ? windowsFormat(pathObject) : posixFormat(pathObject);
}
