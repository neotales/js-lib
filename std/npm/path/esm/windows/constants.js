// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
/**
 * The character used to separate entries in the PATH environment variable.
 *
 * @example
 * ```typescript
 * import { DELIMITER } from "@neotales/path/windows/constants";
 *
 * "C:\\bin;C:\\Windows".split(DELIMITER);
 * ```
 */
export const DELIMITER = ";";
/**
 * The character used to separate components of a file path.
 *
 * @example
 * ```typescript
 * import { SEPARATOR } from "@neotales/path/windows/constants";
 *
 * ["tmp", "file.txt"].join(SEPARATOR); // "tmp\\file.txt"
 * ```
 */
export const SEPARATOR = "\\";
/**
 * A regular expression that matches one or more path separators.
 *
 * @example
 * ```typescript
 * import { SEPARATOR_PATTERN } from "@neotales/path/windows/constants";
 *
 * "tmp\\\\file.txt".split(SEPARATOR_PATTERN); // ["tmp", "file.txt"]
 * ```
 */
export const SEPARATOR_PATTERN = /[\\/]+/;
