import "./_dnt.polyfills.js";
import { globals } from "./_globals.js";
/**
 * The parent process ID of the current process. Hosts without a parent process
 * identifier, including browsers and QuickJS-ng, report 0.
 */
export const ppid = globals.Deno?.ppid ?? globals.process?.ppid ?? globals.tjs?.ppid ?? 0;
