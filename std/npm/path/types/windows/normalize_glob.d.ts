import type { GlobOptions } from "../_common/glob_to_reg_exp.js";
export type { GlobOptions };
/**
 * Like normalize(), but doesn't collapse "**\/.." when `globstar` is true.
 *
 * @example Usage
 * ```ts
 * import { normalizeGlob } from "@neotales/path/windows/normalize-glob";
 * import { equal } from "node:assert/strict";
 *
 * const normalized = normalizeGlob("**\\foo\\..\\bar", { globstar: true });
 * equal(normalized, "**\\bar");
 * ```
 *
 * @param glob The glob pattern to normalize.
 * @param options The options for glob pattern.
 * @throws Error if the glob contains invalid characters.
 * @returns The normalized glob pattern.
 */
export declare function normalizeGlob(glob: string, options?: Pick<GlobOptions, "globstar">): string;
