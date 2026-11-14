/**
 * Detects whether the current process is running with elevated privileges.
 *
 * @module @neotales/is-elevated
 */
import "./_dnt.polyfills.js";
let elevated;
function evalUnixElevation(cache = true) {
    if (cache && elevated !== undefined)
        return elevated;
    let uid = null;
    if ("process" in globalThis && process.geteuid)
        uid = process.geteuid();
    if (uid === null && "process" in globalThis && process.getuid)
        uid = process.getuid();
    // Ende has no process. Deno is a permanent alias there, so this is the Ende path too.
    const globals = globalThis;
    if (uid === null && globals.Deno?.euid)
        uid = globals.Deno.euid();
    if (uid === null && globals.Deno?.uid)
        uid = globals.Deno.uid();
    elevated = uid === 0;
    return elevated;
}
function unsupportedNodeFfi() {
    throw new Error("Unable to determine Windows process elevation because neither node:ffi nor koffi is available. Run Node.js >= 26 with --experimental-ffi, or install koffi. See https://github.com/neotales/js-lib/blob/dev/os/jsr/is-elevated/README.md#nodejs-ffi");
}
function unsupportedRuntimeFfi() {
    throw new Error(`Unable to determine Windows process elevation because the runtime FFI backend is unavailable.${"Deno" in globalThis ? " Run Deno with --allow-ffi." : ""} See https://github.com/neotales/js-lib/blob/dev/os/jsr/is-elevated/README.md#runtime-support`);
}
function windows() {
    if ("process" in globalThis && process.platform === "win32")
        return true;
    const nav = globalThis;
    return nav.navigator?.userAgentData?.platform === "Windows";
}
let impl = evalUnixElevation;
let isSupported = "process" in globalThis || "Deno" in globalThis || "Bun" in globalThis || "tjs" in globalThis;
if (isSupported && windows()) {
    let isNode = false;
    try {
        if ("Deno" in globalThis) {
            impl = (await import("./ffi_deno.js")).evalIsProcessElevated;
        }
        else if ("Bun" in globalThis) {
            impl = (await import("./ffi_bun.js")).evalIsProcessElevated;
        }
        else if ("tjs" in globalThis) {
            impl = (await import("./ffi_txiki.js")).evalIsProcessElevated;
        }
        else {
            isNode = true;
            try {
                impl = (await import("./ffi_node.js")).evalIsProcessElevated;
            }
            catch {
                impl = (await import("./ffi_koffi.js")).evalIsProcessElevated;
            }
        }
        // Loading a backend alone does not prove FFI permissions and native
        // libraries are usable, so evaluate once before advertising support.
        impl();
        isSupported = true;
    }
    catch (error) {
        const debug = "process" in globalThis && process.env.DEBUG === "true";
        if (debug)
            console.debug(error);
        isSupported = false;
        impl = isNode ? unsupportedNodeFfi : unsupportedRuntimeFfi;
    }
}
/**
 * Returns whether elevation detection is available in the current runtime.
 *
 * @returns `true` when {@linkcode isElevated} can evaluate the current process.
 */
export function isElevatedAvailable() {
    return isSupported;
}
/**
 * Reports whether the current process is running with elevated privileges.
 *
 * @param cache - Whether to reuse the result from the first evaluation.
 * @returns Whether the process has elevated privileges.
 * @throws {Error} On Windows when the runtime has no usable FFI backend.
 * @example
 * import { isElevated } from "jsr:@neotales/is-elevated";
 *
 * if (isElevated()) {
 *   console.log("The process is elevated.");
 * }
 */
export function isElevated(cache = true) {
    if (!isSupported) {
        if (impl !== evalUnixElevation)
            impl();
        unsupportedRuntimeFfi();
    }
    return impl(cache);
}
