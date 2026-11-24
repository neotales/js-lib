/**
 * Converts a path string to a file URL.
 *
 * @example Usage
 * ```ts
 * import { toFileUrl } from "@neotales/path/posix/to-file-url";
 * import { equal } from "node:assert/strict";
 *
 * equal(toFileUrl("/home/foo"), new URL("file:///home/foo"));
 * equal(toFileUrl("/home/foo bar"), new URL("file:///home/foo%20bar"));
 * ```
 *
 * @param path The path to convert.
 * @throws TypeError if the path is not absolute.
 * @returns The file URL.
 */
export declare function toFileUrl(path: string): URL;
