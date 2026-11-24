// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { isWindows } from "./_globals.ts";
import { format as posixFormat } from "./posix/format.ts";
import { format as windowsFormat } from "./windows/format.ts";
import type { ParsedPath } from "./types.ts";

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
export function format(pathObject: Partial<ParsedPath>): string {
  return isWindows ? windowsFormat(pathObject) : posixFormat(pathObject);
}
