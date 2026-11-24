/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 *
 * @example Usage
 * ```ts
 * import { normalize } from "@neotales/path/windows/normalize";
 * import { equal } from "node:assert/strict";
 *
 * const normalized = normalize("C:\\foo\\..\\bar");
 * equal(normalized, "C:\\bar");
 * ```
 *
 * @param path The path to normalize
 * @returns The normalized path
 */
export declare function normalize(path: string | URL): string;
