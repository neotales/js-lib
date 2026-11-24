import type { GlobOptions } from "../_common/glob_to_reg_exp.js";
export type { GlobOptions };
/**
 * Like join(), but doesn't collapse "**\/.." when `globstar` is true.
 *
 * @example Usage
 * ```ts
 * import { joinGlobs } from "@neotales/path/posix/join-globs";
 * import { equal } from "node:assert/strict";
 *
 * const path = joinGlobs(["foo", "bar", "**"], { globstar: true });
 * equal(path, "foo/bar/**");
 * ```
 *
 * @param globs The globs to join.
 * @param options The options to use.
 * @returns The joined path.
 */
export declare function joinGlobs(globs: string[], options?: Pick<GlobOptions, "globstar">): string;
