import type { SubstitutionOptions } from "@neotales/env/expand";
/**
 * Expands environment variable references within a source object's values.
 *
 * Supports bash-style variable expansion including:
 * - `${VAR}` - Simple variable expansion
 * - `${VAR:-default}` - Use default if VAR is unset
 * - `${VAR:=default}` - Assign default if VAR is unset
 * - `${VAR:?error}` - Throw error if VAR is unset
 *
 * Variables defined earlier in the source object are available for expansion
 * in later values.
 *
 * @param source - A record containing key-value pairs where values may contain variable references.
 * @param options - Optional substitution options to customize the expansion behavior.
 * @returns A new record with all variable references expanded.
 *
 * @example Expand variables
 * ```ts
 * import { expand } from "@neotales/dotenv";
 * import { set } from "@neotales/env";
 *
 * set("HOME", "/home/alice");
 *
 * const expanded = expand({
 *   BASE: "${HOME}/project",
 *   CONFIG: "${BASE}/config.json"
 * });
 * console.log(expanded.BASE); // "/home/alice/project"
 * console.log(expanded.CONFIG); // "/home/alice/project/config.json"
 * ```
 */
export declare function expand(source: Record<string, string>, options?: SubstitutionOptions): Record<string, string>;
