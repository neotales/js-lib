import type { GlobOptions } from "../_common/glob_to_reg_exp.js";
export type { GlobOptions };
/**
 * Like join(), but doesn't collapse "**\/.." when `globstar` is true.
 *
 * @example Usage
 *
 * ```ts
 * import { joinGlobs } from "@neotales/path/windows/join-globs";
 * import { equal } from "node:assert/strict";
 *
 * const joined = joinGlobs(["foo", "**", "bar"], { globstar: true });
 * equal(joined, "foo\\**\\bar");
 * ```
 *
 * @param globs The globs to join.
 * @param options The options for glob pattern.
 * @returns The joined glob pattern.
 */
export declare function joinGlobs(globs: string[], options?: Pick<GlobOptions, "globstar">): string;
