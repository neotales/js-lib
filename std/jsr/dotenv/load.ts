/**
 * The `load` module provides functionality to load environment variables from a source object
 * into the runtime environment, with options for variable expansion and existing variable handling.
 *
 * @module
 */

import { expand } from "./expand.ts";
import { has, set } from "@neotales/env";

/**
 * Options for loading environment variables.
 */
export interface LoadOptions {
  /**
   * If `true`, existing environment variables will not be overwritten.
   * @default false
   */
  skipExisting?: boolean;

  /**
   * If `true`, variable expansion (e.g., `${VAR}`) will be skipped.
   * @default false
   */
  skipExpansion?: boolean;
}

/**
 * Loads environment variables from a source object into the runtime environment.
 *
 * By default, variables are expanded before being set (e.g., `${HOME}` is replaced
 * with the actual home directory value). Use the `skipExpansion` option to disable this.
 *
 * @param source - A record containing key-value pairs of environment variables.
 * @param options - Optional settings for loading.
 *
 * @example Load environment variables
 * ```ts
 * import { parse, load } from "@neotales/dotenv";
 *
 * const env = parse('API_KEY="secret"');
 * load(env);
 * // API_KEY is now set in the environment
 * ```
 *
 * @example Load without overwriting existing variables
 * ```ts
 * import { load } from "@neotales/dotenv";
 *
 * load({ NODE_ENV: "production" }, { skipExisting: true });
 * // Only sets NODE_ENV if it wasn't already set
 * ```
 */
export function load(source: Record<string, string>, options?: LoadOptions): void {
  if (!options?.skipExpansion) {
    source = expand(source);
  }

  for (const key in source) {
    if (options?.skipExisting && has(key)) {
      continue;
    }

    set(key, source[key]);
  }
}
