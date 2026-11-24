/**
 * txiki.js FFI backend for Linux libsecret.
 *
 * Loads libsecret, GLib, and GObject through `tjs:ffi`, with GIO loaded when
 * available. The specifier is imported through a variable so bundlers and
 * other runtimes never resolve it statically.
 *
 * @module
 * @internal
 */
import "./_dnt.polyfills.js";
import { createTxikiBackend } from "./txiki_bindings.js";
/**
 * Imports `tjs:ffi` through a variable specifier so the module is never
 * statically resolved by runtimes that lack txiki.js support.
 *
 * @returns The subset of the `tjs:ffi` API used by this backend.
 * @throws {Error} If `tjs:ffi` cannot be loaded or does not expose the expected API.
 */
async function loadTxikiFfi() {
    const specifier = "tjs:ffi";
    try {
        const ffi = await import(/* @vite-ignore */ specifier);
        if (typeof ffi.dlopen !== "function" ||
            typeof ffi.createPointer !== "function" ||
            typeof ffi.bufferToPointer !== "function" ||
            typeof ffi.read?.ptr !== "function" ||
            typeof ffi.types?.pointer?.size !== "number" ||
            typeof ffi.types?.size?.size !== "number") {
            throw new TypeError("module does not expose dlopen/createPointer/bufferToPointer/read");
        }
        return ffi;
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load "${specifier}", which is only available inside the txiki.js runtime: ${reason}`, { cause: error });
    }
}
const libsecret = createTxikiBackend(await loadTxikiFfi());
/**
 * Eagerly opens libsecret, GLib, GObject, and GIO when present.
 *
 * @throws {Error} If a required native library cannot be loaded.
 */
export const open = libsecret.open;
/**
 * Reports whether the required native libraries are currently open.
 *
 * @returns `true` after a successful {@link open} or lazy load and before {@link close}.
 */
export const isOpened = libsecret.isOpened;
/**
 * Unloads the libraries so a later {@link open} starts from a clean state.
 */
export const close = libsecret.close;
/**
 * The txiki.js implementation of the {@link LibsecretBindings} contract.
 */
export const backend = libsecret.backend;
