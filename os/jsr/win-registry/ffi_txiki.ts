/**
 * txiki.js FFI backend for Windows Registry operations.
 *
 * Loads `advapi32.dll` through `tjs:ffi`. The specifier is imported through a
 * variable so bundlers and other runtimes never resolve it statically. The
 * backend exposes an explicit lifecycle: {@linkcode open} eagerly opens
 * `advapi32.dll`, {@linkcode close} unloads it, and {@linkcode isOpened}
 * reports the current state. The library also loads lazily on the first
 * backend call when {@linkcode open} was never used.
 *
 * @module
 * @internal
 */

import { createTxikiBackend, type TxikiFfiModule } from "./txiki_bindings.ts";
import type { PointerWidth } from "./hkey.ts";
import { RegistryError } from "./registry_error.ts";

/**
 * Imports `tjs:ffi` through a variable specifier so the module is never
 * statically resolved by runtimes that lack txiki.js support.
 *
 * @returns The subset of the `tjs:ffi` API used by this backend.
 * @throws {RegistryError} If `tjs:ffi` cannot be loaded or does not expose the
 * expected API, e.g. outside txiki.js.
 */
async function loadTxikiFfi(): Promise<TxikiFfiModule> {
  const specifier = "tjs:ffi";
  try {
    const ffi = await import(/* @vite-ignore */ specifier);

    if (typeof ffi.dlopen !== "function" || typeof ffi.createPointer !== "function") {
      throw new TypeError("module does not expose dlopen/createPointer");
    }

    return ffi as TxikiFfiModule;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new RegistryError(
      `Failed to load "${specifier}", which is only available inside the txiki.js runtime: ${reason}`,
      { cause: error },
    );
  }
}

const ffi: TxikiFfiModule = await loadTxikiFfi();
const registry: ReturnType<typeof createTxikiBackend> = createTxikiBackend(
  ffi,
  await detectPointerWidth(),
);

/**
 * Reads the txiki.js host bitness without assuming 64-bit.
 *
 * `navigator.userAgentData.platform` is not enough for pointer width, so the
 * high-entropy `bitness` hint is used when the runtime exposes it. A missing
 * or failing hint falls back to 64-bit, the width of the supported Windows
 * txiki.js builds.
 *
 * @returns The host pointer width.
 */
async function detectPointerWidth(): Promise<PointerWidth> {
  type UserAgentData = {
    bitness?: string;
    getHighEntropyValues?: (
      hints: string[],
    ) => Promise<{ bitness?: string }>;
  };
  const nav = (globalThis as {
    navigator?: { userAgentData?: UserAgentData };
  }).navigator;
  try {
    const direct = nav?.userAgentData?.bitness;
    if (direct === "32" || direct === "64") return Number(direct) as PointerWidth;
    const values = await nav?.userAgentData?.getHighEntropyValues?.(["bitness"]);
    return values?.bitness === "32" ? 32 : 64;
  } catch {
    return 64;
  }
}

/**
 * Eagerly opens `advapi32.dll` through `tjs:ffi`.
 *
 * Call this at startup to fail fast when the native library is unavailable;
 * otherwise the library loads lazily on the first backend call. Repeated
 * calls are no-ops while the backend stays open.
 *
 * @throws {Error} If the library cannot be loaded.
 *
 * @example Usage
 * ```ts
 * import { open } from "@neotales/win-registry/ffi-txiki";
 *
 * open();
 * console.log("advapi32.dll is ready");
 * ```
 */
export const open: () => void = registry.open;

/**
 * Reports whether the backend currently holds an opened native library.
 *
 * @returns `true` after a successful {@linkcode open} or lazy load and before
 * {@linkcode close}.
 *
 * @example Usage
 * ```ts
 * import { isOpened } from "@neotales/win-registry/ffi-txiki";
 *
 * console.log(isOpened());
 * ```
 */
export const isOpened: () => boolean = registry.isOpened;

/**
 * Unloads `advapi32.dll` so a later {@linkcode open} starts from a clean state.
 * Safe to call when the backend was never opened. Open registry keys must be
 * closed before calling this.
 *
 * @example Usage
 * ```ts
 * import { close } from "@neotales/win-registry/ffi-txiki";
 *
 * close();
 * ```
 */
export const close: () => void = registry.close;

/**
 * The txiki.js implementation of the {@linkcode RegistryBackend} contract,
 * backed by `advapi32.dll`. The library opens lazily on the first call; use
 * {@linkcode open}, {@linkcode isOpened}, and {@linkcode close} for explicit
 * control over the native library lifetime.
 *
 * @example Usage
 * ```ts
 * import { backend, close, open } from "@neotales/win-registry/ffi-txiki";
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
export const backend = registry.backend;
