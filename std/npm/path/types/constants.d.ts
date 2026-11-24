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
export declare const DELIMITER: ";" | ":";
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
export declare const SEPARATOR: "\\" | "/";
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
export declare const SEPARATOR_PATTERN: RegExp;
