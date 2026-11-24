// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { encodeWhitespace } from "../_common/to_file_url.js";
import { isAbsolute } from "./is_absolute.js";
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
export function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError(`Path must be absolute: received "${path}"`);
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/^\/+/, "/").replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
