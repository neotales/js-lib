import "./_dnt.polyfills.js";
/**
 * Gets the current working directory of the process.
 * In the browser environment, this function returns the
 * current URL path.
 *
 * @returns The current working directory.
 * @throws Error if cwd is not implemented or if the runtime does not support
 * getting the current working directory.
 *
 * @example
 * ```ts
 * import { cwd } from "@neotales/process/cwd.ts";
 *
 * const currentDir = cwd();
 * console.log(`Current working directory: ${currentDir}`);
 * ```
 */
export declare function cwd(): string;
