import { globals } from "./_globals.ts";

/**
 * The parent process ID of the current process. Hosts without a parent process
 * identifier, including browsers and QuickJS-ng, report 0.
 */
export const ppid: number = globals.Deno?.ppid ?? globals.process?.ppid ?? globals.tjs?.ppid ?? 0;
