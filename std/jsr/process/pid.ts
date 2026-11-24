import { globals } from "./_globals.ts";

let id: number = 0;

if (globals.Deno) {
  id = globals.Deno.pid;
} else if (globals.process) {
  id = globals.process.pid;
} else if (globals.tjs) {
  id = globals.tjs.pid;
} else if (globals.os) {
  id = globals.os.getpid();
}

/**
 * The current process ID. The process ID is a unique identifier for the
 * current process. In a browser environment, the process ID is always 0.
 *
 * @example
 * ```typescript
 * import { pid } from "@neotales/process/pid";
 *
 * console.log(`Running as process ID: ${pid}`);
 *
 * // Use for unique identifiers
 * const logPrefix = `[PID:${pid}]`;
 * console.log(`${logPrefix} Application started`);
 * ```
 */
export const pid: number = id;
