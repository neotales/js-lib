/**
 * txiki.js FFI backend for Windows Credential Manager.
 *
 * Loads `advapi32.dll` through `tjs:ffi`. The specifier is imported through a
 * variable so bundlers and other runtimes never resolve it statically. The
 * library also loads lazily on the first backend call when {@link open} was
 * never used.
 *
 * @module
 * @internal
 */
import "./_dnt.polyfills.js";
import type { WinCredentials } from "./types.js";
/**
 * Eagerly opens `advapi32.dll` and `kernel32.dll` through `tjs:ffi`.
 *
 * Call this at startup to fail fast when a native library is unavailable;
 * otherwise the libraries load lazily on the first backend call. Repeated
 * calls are no-ops while the backend stays open.
 *
 * @throws {Error} If a library cannot be loaded.
 */
export declare const open: () => void;
/**
 * Reports whether the backend currently holds opened native libraries.
 *
 * @returns `true` after a successful {@link open} or lazy load and before {@link close}.
 */
export declare const isOpened: () => boolean;
/**
 * Unloads `advapi32.dll` and `kernel32.dll` so a later {@link open} starts from
 * a clean state. Safe to call when the backend was never opened.
 */
export declare const close: () => void;
/**
 * The txiki.js implementation of the {@link WinCredentials} contract, backed by
 * `advapi32.dll`. The libraries open lazily on the first call.
 */
export declare const backend: WinCredentials;
