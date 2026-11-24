import { globals } from "./_globals.ts";

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
export function cwd(): string {
  if (globals.Deno) {
    return globals.Deno.cwd();
  }
  if (globals.process) {
    return globals.process.cwd();
  }
  if (globals.tjs) return globals.tjs.cwd;
  if (globals.os) {
    const [directory, error] = globals.os.getcwd();
    if (error !== 0) throw new Error(`host getcwd failed (${error})`);
    return directory;
  }
  if (globals.navigator && globals.window) {
    return globals.window.location.pathname;
  }
  throw new Error("cwd is not implemented");
}
