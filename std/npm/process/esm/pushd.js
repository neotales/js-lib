import "./_dnt.polyfills.js";
import { chdir } from "./chdir.js";
import { cwd } from "./cwd.js";
import { isBrowser } from "./_globals.js";
import { history } from "./history.js";
/**
 * Pushes the current working directory onto the directory
 * stack and changes the current working directory to the
 * specified directory.
 *
 * @param directory The directory to change to.
 * @throws ChangeDirectoryError if chdir is not implemented, if the directory is not found,
 * or if the runtime does not support changing the directory.
 *
 * @example
 * ```ts
 * import { pushd } from "@neotales/process/pushd.ts";
 *
 * pushd("/path/to/directory");
 * console.log(`Changed directory to: /path/to/directory`);
 * ```
 */
export function pushd(directory) {
    if (isBrowser)
        return;
    const previous = cwd();
    chdir(directory);
    history.push(previous);
}
