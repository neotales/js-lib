// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { isWindows } from "./_globals.ts";

/**
 * The character used to separate entries in the PATH environment variable.
 * On Windows, this is `;`. On all other platforms, this is `:`.
 *
 * @example
 * ```typescript
 * import { DELIMITER } from "@neotales/path/constants";
 *
 * process.env.PATH?.split(DELIMITER);
 * ```
 */
export const DELIMITER = isWindows ? (";" as const) : (":" as const);
/**
 * The character used to separate components of a file path.
 * On Windows, this is `\`. On all other platforms, this is `/`.
 *
 * @example
 * ```typescript
 * import { SEPARATOR } from "@neotales/path/constants";
 *
 * ["tmp", "file.txt"].join(SEPARATOR);
 * ```
 */
export const SEPARATOR = isWindows ? ("\\" as const) : ("/" as const);
/**
 * A regular expression that matches one or more path separators.
 *
 * @example
 * ```typescript
 * import { SEPARATOR_PATTERN } from "@neotales/path/constants";
 *
 * "tmp///file.txt".split(SEPARATOR_PATTERN); // ["tmp", "file.txt"]
 * ```
 */
export const SEPARATOR_PATTERN = isWindows ? /[\\/]+/ : /\/+/;
