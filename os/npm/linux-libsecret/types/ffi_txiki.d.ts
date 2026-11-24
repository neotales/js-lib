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
import type { LibsecretBindings } from "./types.js";
/**
 * Eagerly opens libsecret, GLib, GObject, and GIO when present.
 *
 * @throws {Error} If a required native library cannot be loaded.
 */
export declare const open: () => void;
/**
 * Reports whether the required native libraries are currently open.
 *
 * @returns `true` after a successful {@link open} or lazy load and before {@link close}.
 */
export declare const isOpened: () => boolean;
/**
 * Unloads the libraries so a later {@link open} starts from a clean state.
 */
export declare const close: () => void;
/**
 * The txiki.js implementation of the {@link LibsecretBindings} contract.
 */
export declare const backend: LibsecretBindings;
