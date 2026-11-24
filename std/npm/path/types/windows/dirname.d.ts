/**
 * Return the directory path of a `path`.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@neotales/path/windows/dirname";
 * import { equal as equals } from "node:assert/strict";
 *
 * equals(dirname("C:\\foo\\bar\\baz.ext"), "C:\\foo\\bar");
 * equals(dirname(new URL("file:///C:/foo/bar/baz.ext")), "C:\\foo\\bar");
 * ```
 *
 * @param path The path to get the directory from.
 * @returns The directory path.
 */
export declare function dirname(path: string | URL): string;
