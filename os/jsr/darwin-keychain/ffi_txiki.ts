/**
 * txiki.js FFI backend for macOS Keychain.
 *
 * Loads Security.framework and CoreFoundation through `tjs:ffi`. The specifier
 * is imported through a variable so bundlers and other runtimes never resolve
 * it statically. The libraries also load lazily on the first backend call.
 *
 * @module
 * @internal
 */

import {
  createTxikiKeychainBackend,
  type TxikiFfiModule,
} from "./txiki_bindings.ts";
import type { DarwinKeychainBackend } from "./types.ts";

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
      typeof ffi.read?.ptr !== "function"
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

const keychain = createTxikiKeychainBackend(await loadTxikiFfi());

/**
 * Eagerly opens Security.framework and CoreFoundation through `tjs:ffi`.
 *
 * @throws {Error} If a framework cannot be loaded.
 */
export const open: () => void = keychain.open;

/**
 * Reports whether the backend currently holds opened frameworks.
 *
 * @returns `true` after a successful {@link open} or lazy load and before {@link close}.
 */
export const isOpened: () => boolean = keychain.isOpened;

/**
 * Unloads both frameworks so a later {@link open} starts from a clean state.
 */
export const close: () => void = keychain.close;

/**
 * The txiki.js implementation of the {@link DarwinKeychainBackend} contract,
 * backed by Security.framework. The frameworks open lazily on the first call.
 */
export const backend: DarwinKeychainBackend = keychain.backend;
