/**
 * Return the last portion of a path.
 *
 * The trailing directory separators are ignored, and optional suffix is
 * removed.
 *
 * @example Usage
 * ```ts
 * import { basename } from "@neotales/path/basename";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(basename("C:\\user\\Documents\\image.png"), "image.png");
 * } else {
 *   equal(basename("/home/user/Documents/image.png"), "image.png");
 * }
 * ```
 *
 * @param path Path to extract the name from.
 * @param suffix Suffix to remove from extracted name.
 *
 * @returns The basename of the path.
 */
export declare function basename(path: string | URL, suffix?: string): string;
