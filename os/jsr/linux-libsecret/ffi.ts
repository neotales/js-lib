/** Native Linux libsecret API. @module @neotales/linux-libsecret/ffi */

import type {
  GCancellableHandle,
  GioApi,
  LibsecretApi,
  LibsecretBindings,
  SecretPasswordHandle,
  SecretRecord,
  SecretSchemaHandle,
} from "./types.ts";
import { LINUX } from "./types.ts";

let unavailableReason = "Linux libsecret is only available on Linux.";

function unavailable(): never {
  throw new Error(unavailableReason);
}

const unavailableBindings: LibsecretBindings = {
  runtime: "node",
  secretSchemaNew(): SecretSchemaHandle | null {
    return unavailable();
  },
  secretPasswordLookupSync(): SecretPasswordHandle | null {
    return unavailable();
  },
  secretPasswordStoreSync(): boolean {
    return unavailable();
  },
  secretPasswordClearSync(): boolean {
    return unavailable();
  },
  secretPasswordFree(): void {
    unavailable();
  },
};

function gioUnavailable(): never {
  throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
}

const unavailableGio: GioApi = {
  cancellableNew(): GCancellableHandle {
    return gioUnavailable();
  },
  cancellableCancel(): void {
    gioUnavailable();
  },
  cancellableRelease(): void {
    gioUnavailable();
  },
};

let backend: LibsecretBindings = unavailableBindings;

/**
 * Typed camelCase wrappers for the native libsecret functions.
 *
 * Native `GError**` outputs are represented by caller-created `LibsecretErrorHandle`
 * values. C string arguments and returned password text are JavaScript strings.
 *
 * @example
 * ```ts
 * import { isLinuxKeyringAvailable, Libsecret } from "@neotales/linux-libsecret/ffi";
 *
 * if (isLinuxKeyringAvailable()) {
 *   const schema = Libsecret.secretSchemaNew(
 *     "org.example.Secret",
 *     0,
 *     "service",
 *     0,
 *     "account",
 *     0,
 *     null,
 *   );
 * }
 * ```
 */
export let Libsecret: LibsecretApi = unavailableBindings;

/**
 * Typed optional GIO wrappers for creating, cancelling, and releasing `GCancellable` values.
 * Methods throw when GIO is unavailable; use `isGioAvailable` before calling them.
 *
 * @example
 * ```ts
 * import { Gio, isGioAvailable } from "@neotales/linux-libsecret/ffi";
 *
 * if (isGioAvailable()) {
 *   const cancellable = Gio.cancellableNew();
 *   Gio.cancellableRelease(cancellable);
 * }
 * ```
 */
export let Gio: GioApi = unavailableGio;

/** Returns records through the optional runtime enumeration capability. @internal */
export function listSecretRecords(service: string): SecretRecord[] {
  if (backend.listSecretRecords === undefined)
    throw new Error("Linux keyring enumeration is unavailable in this runtime.");
  return backend.listSecretRecords(service);
}

let available = false;
let gioAvailable = false;

function hasNodeFfiHost(): boolean {
  // workerd exposes a `process` compatibility shim whose node:module export is
  // not a usable createRequire. It has no libsecret backend either.
  if (typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair === "function") {
    return false;
  }
  const process = (globalThis as {
    process?: { getBuiltinModule?: (name: string) => { createRequire?: unknown } | undefined };
  }).process;
  if (typeof process?.getBuiltinModule !== "function") return false;
  try {
    return typeof process.getBuiltinModule("node:module")?.createRequire === "function";
  } catch {
    return false;
  }
}
// #region linux-libsecret-runtime-backend
// Guarded: the dynamic imports are not evaluated on a runtime that is not
// Linux, so no native module loads there. The JerryScript build removes this
// region because its IIFE bundle cannot parse top-level await.
if (LINUX) {
  try {
    if ("Deno" in globalThis)
      backend = (await import("./ffi_deno.ts")).backend;
    else if ("Bun" in globalThis)
      backend = (await import("./ffi_bun.ts")).backend;
    else if ("tjs" in globalThis) {
      const ffi = await import("./ffi_txiki.ts");
      // tjs:ffi opens libraries lazily. Probe the real load before claiming
      // availability, without looking up a secret.
      ffi.open();
      backend = ffi.backend;
    } else if (hasNodeFfiHost())
      backend = (await import("./ffi_node.ts")).backend;
    else
      throw new Error("No libsecret FFI backend for this runtime.");
    Libsecret = backend;
    Gio = backend.gio ?? unavailableGio;
    available = true;
    gioAvailable = backend.gio !== undefined;
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }
}
// #endregion linux-libsecret-runtime-backend

/**
 * Reports whether the native Linux keyring backend loaded successfully.
 *
 * @returns `true` when libsecret can be used in the current runtime.
 * @example
 * ```ts
 * import { isLinuxKeyringAvailable } from "@neotales/linux-libsecret/ffi";
 *
 * if (isLinuxKeyringAvailable()) console.log("libsecret is available");
 * ```
 */
export function isLinuxKeyringAvailable(): boolean {
  return available;
}

/**
 * Returns the reason the libsecret backend could not load.
 *
 * @returns An error carrying the load or platform reason.
 */
export function linuxLibsecretUnavailableError(): Error {
  return new Error(unavailableReason);
}

/**
 * Reports whether optional GIO cancellation support loaded successfully.
 *
 * @returns `true` when `GCancellable` operations are available in the current runtime.
 * @example
 * ```ts
 * import { isGioAvailable } from "@neotales/linux-libsecret/ffi";
 *
 * if (isGioAvailable()) console.log("GIO cancellation is available");
 * ```
 */
export function isGioAvailable(): boolean {
  return gioAvailable;
}

export {
  GCancellableHandle,
  type GioApi,
  type LibsecretApi,
  type LibsecretBindings,
  LibsecretErrorHandle,
  type LibsecretRuntime,
  LINUX,
  SecretPasswordHandle,
  type SecretRecord,
  SecretSchemaHandle,
} from "./types.ts";
