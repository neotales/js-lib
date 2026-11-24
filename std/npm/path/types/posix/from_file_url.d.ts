/**
 * Converts a file URL to a path string.
 *
 * @example Usage
 * ```ts
 * import { fromFileUrl } from "@neotales/path/posix/from-file-url";
 * import { equal } from "node:assert/strict";
 *
 * equal(fromFileUrl(new URL("file:///home/foo")), "/home/foo");
 * ```
 *
 * @param url The file URL to convert.
 * @returns The path string.
 */
export declare function fromFileUrl(url: URL | string): string;
