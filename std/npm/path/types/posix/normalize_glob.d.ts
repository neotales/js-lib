import type { GlobOptions } from "../_common/glob_to_reg_exp.js";
export type { GlobOptions };
/**
 * Like normalize(), but doesn't collapse "**\/.." when `globstar` is true.
 *
 * @example Usage
 * ```ts
 * import { normalizeGlob } from "@neotales/path/posix/normalize-glob";
 * import { equal } from "node:assert/strict";
 *
 * const path = normalizeGlob("foo/bar/../*", { globstar: true });
 * equal(path, "foo/*");
 * ```
 *
 * @param glob The glob to normalize.
 * @param options The options to use.
 * @throws Error if the glob contains invalid characters.
 * @returns The normalized path.
 */
export declare function normalizeGlob(glob: string, options?: Pick<GlobOptions, "globstar">): string;
