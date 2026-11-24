/**
 * Return the extension of the `path` with leading period.
 *
 * @example Usage
 * ```ts
 * import { extname } from "@neotales/path/windows/extname";
 * import { equal as equals } from "node:assert/strict";
 *
 * equals(extname("file.ts"), ".ts");
 * equals(extname(new URL("file:///C:/foo/bar/baz.ext")), ".ext");
 * ```
 *
 * @param path The path to get the extension from.
 * @returns The extension of the `path`.
 */
export declare function extname(path: string | URL): string;
