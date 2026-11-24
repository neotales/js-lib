import "./_dnt.polyfills.js";
import { history } from "./history.js";
import { chdir } from "./chdir.js";
import { isBrowser } from "./_globals.js";
/**
 * Pops the last directory from the directory stack and
 * changes the current working directory to that directory.
 * Browser environments leave the directory stack unchanged.
 *
 * @returns The last directory in the stack.
 * @throws Error if pop is not implemented.
 *
 * @example
 * ```ts
 * import { popd } from "@neotales/process/popd.ts";
 *
 * const previousDir = popd();
 * console.log(`Changed directory to: ${previousDir}`);
 * ```
 */
export function popd() {
    if (isBrowser || history.length === 0)
        return undefined;
    const index = history.length - 1;
    const directory = history[index];
    chdir(directory);
    // Keep the initial directory as the stack's restoration point.
    if (index > 0)
        history.pop();
    return directory;
}
