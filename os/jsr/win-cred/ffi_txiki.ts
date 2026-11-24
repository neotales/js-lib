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

import { createTxikiBackend, type TxikiFfiModule } from "./txiki_bindings.ts";
import type { WinCredentials } from "./types.ts";

/**
 * Imports `tjs:ffi` through a variable specifier so the module is never
 * statically resolved by runtimes that lack txiki.js support.
 *
 * @returns The subset of the `tjs:ffi` API used by this backend.
 * @throws {Error} If `tjs:ffi` cannot be loaded or does not expose the expected API.
 */
async function loadTxikiFfi(): Promise<TxikiFfiModule> {
  const specifier = "tjs:ffi";
  try {
    const ffi = await import(/* @vite-ignore */ specifier);
    if (
      typeof ffi.dlopen !== "function" ||
      typeof ffi.createPointer !== "function" ||
      typeof ffi.bufferToPointer !== "function" ||
      typeof ffi.read?.u32 !== "function"
    ) {
      throw new TypeError("module does not expose dlopen/createPointer/bufferToPointer/read");
    }
    return ffi as TxikiFfiModule;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load "${specifier}", which is only available inside the txiki.js runtime: ${reason}`,
      { cause: error },
    );
  }
}

const registry = createTxikiBackend(await loadTxikiFfi());

/**
 * Eagerly opens `advapi32.dll` and `kernel32.dll` through `tjs:ffi`.
 *
 * Call this at startup to fail fast when a native library is unavailable;
 * otherwise the libraries load lazily on the first backend call. Repeated
 * calls are no-ops while the backend stays open.
 *
 * @throws {Error} If a library cannot be loaded.
 */
export const open: () => void = registry.open;

/**
 * Reports whether the backend currently holds opened native libraries.
 *
 * @returns `true` after a successful {@link open} or lazy load and before {@link close}.
 */
export const isOpened: () => boolean = registry.isOpened;

/**
 * Unloads `advapi32.dll` and `kernel32.dll` so a later {@link open} starts from
 * a clean state. Safe to call when the backend was never opened.
 */
export const close: () => void = registry.close;

/**
 * The txiki.js implementation of the {@link WinCredentials} contract, backed by
 * `advapi32.dll`. The libraries open lazily on the first call.
 */
export const backend: WinCredentials = registry.backend;
