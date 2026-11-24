/** Native Windows Credential Manager API. @module @neotales/win-cred/ffi */

import type { RawCredential, WinCredentials } from "./types.ts";
import { WINDOWS } from "./types.ts";

let unavailableReason =
  "Windows Credential API is only available on Windows for the Node.js, Deno, Bun, and txiki.js runtimes.";
const unavailableWinCred: WinCredentials = {
  write(): void {
    throw new Error(unavailableReason);
  },
  read(): RawCredential | null {
    throw new Error(unavailableReason);
  },
  delete(): boolean {
    throw new Error(unavailableReason);
  },
  enumerate(): RawCredential[] {
    throw new Error(unavailableReason);
  },
};

let WinCred = unavailableWinCred;
let available = false;
// #region win-cred-runtime-backend
// Guarded: the dynamic imports are not evaluated on a runtime that is not
// Windows, so no native module loads there. The JerryScript build removes this
// region because its IIFE bundle cannot parse top-level await.
if (WINDOWS) {
  try {
    if ("Deno" in globalThis)
      WinCred = (await import("./ffi_deno.ts")).backend;
    else if ("Bun" in globalThis)
      WinCred = (await import("./ffi_bun.ts")).backend;
    else if ("tjs" in globalThis) {
      const ffi = await import("./ffi_txiki.ts");
      // tjs:ffi opens libraries lazily. Probe the real load before claiming
      // availability, without touching a credential.
      ffi.open();
      WinCred = ffi.backend;
    } else if (typeof (globalThis as { process?: { getBuiltinModule?: unknown } }).process?.getBuiltinModule === "function")
      WinCred = (await import("./ffi_node.ts")).backend;
    else
      throw new Error("No Credential Manager FFI backend for this runtime.");
    available = true;
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }
}
// #endregion win-cred-runtime-backend

/**
 * Reports whether the native backend loaded successfully.
 * @returns `true` when {@link WinCred} operations are available.
 * @example
 * ```ts
 * import { isWinCredAvailable } from "@neotales/win-cred/ffi";
 *
 * console.log(isWinCredAvailable());
 * ```
 */
export function isWinCredAvailable(): boolean {
  return available;
}

/**
 * Returns the reason a Credential Manager backend could not load.
 *
 * The root API uses it so unsupported platforms throw the documented error
 * before encoding a target name. It never reads a credential.
 *
 * @returns An error carrying the load or platform reason.
 */
export function winCredUnavailableError(): Error {
  return new Error(unavailableReason);
}

/** Raw Windows Credential Manager operations that throw when unavailable. */
export { WinCred };
export {
  type Credential,
  CredEnumerateFlags,
  CredPersist,
  CredType,
  CredWriteFlags,
  type RawCredential,
  type WinCredentials as CredentialBackend,
} from "./types.ts";
