/**
 * Deno FFI backend for Windows Registry operations.
 *
 * Loads `advapi32.dll` through Deno FFI, which requires the `--allow-ffi`
 * permission flag. Because opening the library is a side effectful operation,
 * the backend exposes an explicit lifecycle: {@linkcode open} eagerly opens
 * `advapi32.dll`, {@linkcode close} unloads it again, and {@linkcode isOpened}
 * reports the current state. The library also loads lazily on the first
 * backend call when {@linkcode open} was never used.
 *
 * @module
 * @internal
 */
import "./_dnt.polyfills.js";
import type { RegistryBackend } from "./types.js";
/**
 * Eagerly opens `advapi32.dll` through Deno FFI.
 *
 * Call this at startup to fail fast when the `--allow-ffi` permission is
 * missing; otherwise the library loads lazily on the first backend call.
 * Repeated calls are no-ops while the backend stays open.
 *
 * @throws {Error} If the library cannot be loaded.
 *
 * @example Usage
 * ```ts
 * import { open } from "@neotales/win-registry/ffi-deno";
 *
 * open();
 * console.log("advapi32.dll is ready");
 * ```
 */
export declare function open(): void;
/**
 * Reports whether the backend currently holds an opened native library.
 *
 * @returns `true` after a successful {@linkcode open} or lazy load and before
 * {@linkcode close}.
 *
 * @example Usage
 * ```ts
 * import { isOpened } from "@neotales/win-registry/ffi-deno";
 *
 * console.log(isOpened());
 * ```
 */
export declare function isOpened(): boolean;
/**
 * Unloads `advapi32.dll` so a later {@linkcode open} starts from a clean
 * state. Safe to call when the backend was never opened. Open registry keys
 * must be closed before calling this.
 *
 * @example Usage
 * ```ts
 * import { close } from "@neotales/win-registry/ffi-deno";
 *
 * close();
 * ```
 */
export declare function close(): void;
/**
 * The Deno FFI implementation of the {@linkcode RegistryBackend} contract,
 * backed by `advapi32.dll`. The library opens lazily on the first call; use
 * {@linkcode open}, {@linkcode isOpened}, and {@linkcode close} for explicit
 * control over the native library lifetime.
 *
 * @example Usage
 * ```ts
 * import { backend, close, open } from "@neotales/win-registry/ffi-deno";
 * import { HKEY_CURRENT_USER } from "@neotales/win-registry/types";
 *
 * open();
 * try {
 *   const handle = backend.openKey(HKEY_CURRENT_USER, "Software", 0x20019);
 *   console.log(handle);
 *   backend.closeKey(handle);
 * } finally {
 *   close();
 * }
 * ```
 */
export declare const backend: RegistryBackend;
