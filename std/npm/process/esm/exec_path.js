import "./_dnt.polyfills.js";
import { globals } from "./_globals.js";
let ep = undefined;
/**
 * Returns the host runtime executable path when exposed, or an empty string
 * when the host does not provide one or denies access. A script filename is
 * not used as a substitute for the executable path.
 *
 * @description
 * @returns The path to the runtime executable, or an empty string when unavailable.
 * @example
 *
 * ```ts
 * import { execPath } from "@neotales/process";
 *
 * console.log(execPath());
 * // Output: "/usr/local/bin/deno" or "/usr/local/bin/node" or "/home/user/.deno/bin/deno"
 * ```
 */
export function execPath() {
    if (typeof ep === "string") {
        return (ep ??= "");
    }
    if (globals.Deno) {
        try {
            ep = globals.Deno.execPath();
            return (ep ??= "");
        }
        catch {
            // The runtime could not provide an executable path.
            ep = "";
            return ep;
        }
    }
    else if (globals.process) {
        return globals.process.execPath;
    }
    else if (globals.tjs) {
        return globals.tjs.exePath;
    }
    else if (globals.os) {
        return globals.os.exePath();
    }
    else if (typeof globals.argv0 === "string") {
        return globals.argv0;
    }
    else {
        return "";
    }
}
