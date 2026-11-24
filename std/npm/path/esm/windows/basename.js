// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { assertArgs, lastPathSegment, stripSuffix } from "../_common/basename.js";
import { CHAR_COLON } from "../_common/constants.js";
import { isUrl } from "../_is_url.js";
import { stripTrailingSeparators } from "../_common/strip_trailing_separators.js";
import { isPathSeparator, isWindowsDeviceRoot } from "./_util.js";
import { fromFileUrl } from "./from_file_url.js";
/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@neotales/path/windows/basename";
 * import { equal as equals } from "node:assert/strict";
 *
 * equals(basename("C:\\user\\Documents\\"), "Documents");
 * equals(basename("C:\\user\\Documents\\image.png"), "image.png");
 * equals(basename("C:\\user\\Documents\\image.png", ".png"), "image");
 * equals(basename(new URL("file:///C:/user/Documents/image.png")), "image.png");
 * equals(basename(new URL("file:///C:/user/Documents/image.png"), ".png"), "image");
 * ```
 *
 * @param path The path to extract the name from.
 * @param suffix The suffix to remove from extracted name.
 * @returns The extracted name.
 */
export function basename(path, suffix = "") {
    if (isUrl(path)) {
        path = fromFileUrl(path);
    }
    assertArgs(path, suffix);
    // Check for a drive letter prefix so as not to mistake the following
    // path separator as an extra separator at the end of the path that can be
    // disregarded
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === CHAR_COLON)
                start = 2;
        }
    }
    const lastSegment = lastPathSegment(path, isPathSeparator, start);
    const strippedSegment = stripTrailingSeparators(lastSegment, isPathSeparator);
    return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
