import { globals, isBrowser } from "./_globals.ts";

/**
 * Error thrown when the there is an error changing the directory.
 */
export class ChangeDirectoryError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ChangeDirectoryError";
    this.cause = options?.cause;
  }
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
export function chdir(directory: string): void {
  if (globals.Deno) {
    try {
      globals.Deno.chdir(directory);
      return;
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new ChangeDirectoryError(`Unexpected error ${e}`, { cause: e });
      }

      throw new ChangeDirectoryError(e.message, { cause: e });
    }
  }

  if (globals.process) {
    try {
      globals.process.chdir(directory);
      return;
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new ChangeDirectoryError(`Unexpected error ${e}`, { cause: e });
      }

      throw new ChangeDirectoryError(e.message, { cause: e });
    }
  }
  if (globals.tjs) {
    try {
      globals.tjs.chdir(directory);
      return;
    } catch (e) {
      throw new ChangeDirectoryError(e instanceof Error ? e.message : "directory change failed", { cause: e });
    }
  }
  if (globals.os) {
    try {
      const result = globals.os.chdir(directory);
      if (result !== 0) {
        throw new Error(`host chdir failed (${result})`);
      }
      return;
    } catch (e) {
      throw new ChangeDirectoryError(e instanceof Error ? e.message : "directory change failed", { cause: e });
    }
  }

  if (isBrowser) return;

  throw new ChangeDirectoryError("chdir is not implemented");
}
