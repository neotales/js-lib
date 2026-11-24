/** Native Windows Credential Manager API. @module @neotales/win-cred/ffi */
import "./_dnt.polyfills.js";
import type { WinCredentials } from "./types.js";
declare let WinCred: WinCredentials;
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
export declare function isWinCredAvailable(): boolean;
/**
 * Returns the reason a Credential Manager backend could not load.
 *
 * The root API uses it so unsupported platforms throw the documented error
 * before encoding a target name. It never reads a credential.
 *
 * @returns An error carrying the load or platform reason.
 */
export declare function winCredUnavailableError(): Error;
/** Raw Windows Credential Manager operations that throw when unavailable. */
export { WinCred };
export { type Credential, CredEnumerateFlags, CredPersist, CredType, CredWriteFlags, type RawCredential, type WinCredentials as CredentialBackend, } from "./types.js";
