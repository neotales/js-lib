import "./_dnt.polyfills.js";
/**
 * Returns the host runtime executable path when exposed, or an empty string
 * when the host does not provide one or denies access. A script filename is
 * not used as a substitute for the executable path.
 *
 * @description
 * @returns The path to the runtime executable, or an empty string when unavailable.
 * @example
 *
 * ```ts
 * import { execPath } from "@neotales/process";
 *
 * console.log(execPath());
 * // Output: "/usr/local/bin/deno" or "/usr/local/bin/node" or "/home/user/.deno/bin/deno"
 * ```
 */
export declare function execPath(): string;
