import "./_dnt.polyfills.js";
import { globals } from "./_globals.js";
/**
 * Calls the host's process-exit API. Hosts without one throw rather than
 * attempting to close a browser window or pretending to exit. A host shim
 * (for example a worker runtime) controls what its `exit` function means and
 * may not terminate an operating-system process.
 *
 * @param code The exit code. If not provided, the process will exit with a
 * status code of 0.
 * @example
 * ```ts
 * import { exit } from "@neotales/process/exit.ts";
 *
 * exit(0); // Exits the process with a status code of 0
 *
 * exit(1); // Exits the process with a status code of 1
 * ```
 */
export function exit(code) {
    if (globals.Deno) {
        return globals.Deno.exit(code);
    }
    if (globals.process) {
        return globals.process.exit(code);
    }
    if (globals.tjs)
        return globals.tjs.exit(code);
    if (globals.std)
        return globals.std.exit(code);
    throw new Error("exit is not implemented by this host");
}
