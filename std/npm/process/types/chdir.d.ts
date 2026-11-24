import "./_dnt.polyfills.js";
/**
 * Error thrown when the there is an error changing the directory.
 */
export declare class ChangeDirectoryError extends Error {
    readonly cause?: unknown;
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
/**
 * Updates the current working directory of the process. In the browser
 * environment, this function is a no-op.
 *
 * @param directory The directory to change to.
 * @throws ChangeDirectoryError if the directory is not found or the runtime does not support
 * changing the directory.
 *
 * @example
 * ```ts
 * import { chdir } from "@neotales/process/chdir.ts";
 *
 * chdir("/path/to/directory");
 * console.log(`Changed directory to: /path/to/directory`);
 * ```
 */
export declare function chdir(directory: string): void;
