/**
 * The character used to separate entries in the PATH environment variable.
 *
 * @example
 * ```typescript
 * import { DELIMITER } from "@neotales/path/posix/constants";
 *
 * "bin:/usr/bin".split(DELIMITER);
 * ```
 */
export declare const DELIMITER: ":";
/**
 * The character used to separate components of a file path.
 *
 * @example
 * ```typescript
 * import { SEPARATOR } from "@neotales/path/posix/constants";
 *
 * ["tmp", "file.txt"].join(SEPARATOR); // "tmp/file.txt"
 * ```
 */
export declare const SEPARATOR: "/";
/**
 * A regular expression that matches one or more path separators.
 *
 * @example
 * ```typescript
 * import { SEPARATOR_PATTERN } from "@neotales/path/posix/constants";
 *
 * "tmp///file.txt".split(SEPARATOR_PATTERN); // ["tmp", "file.txt"]
 * ```
 */
export declare const SEPARATOR_PATTERN: RegExp;
