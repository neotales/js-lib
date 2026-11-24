/**
 * Converts a path string to a file URL.
 *
 * @example Usage
 * ```ts
 * import { toFileUrl } from "@neotales/path/to-file-url";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(toFileUrl("\\home\\foo"), new URL("file:///home/foo"));
 *   equal(toFileUrl("C:\\Users\\foo"), new URL("file:///C:/Users/foo"));
 *   equal(toFileUrl("\\\\127.0.0.1\\home\\foo"), new URL("file://127.0.0.1/home/foo"));
 * } else {
 *   equal(toFileUrl("/home/foo"), new URL("file:///home/foo"));
 * }
 * ```
 *
 * @param path Path to convert to file URL.
 * @returns The file URL equivalent to the path.
 */
export declare function toFileUrl(path: string): URL;
