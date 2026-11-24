import { chdir } from "./chdir.ts";
import { cwd } from "./cwd.ts";
import { isBrowser } from "./_globals.ts";
import { history } from "./history.ts";

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
export function pushd(directory: string): void {
  if (isBrowser) return;
  const previous = cwd();
  chdir(directory);
  history.push(previous);
}
