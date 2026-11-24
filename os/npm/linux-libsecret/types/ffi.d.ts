/** Native Linux libsecret API. @module @neotales/linux-libsecret/ffi */
import "./_dnt.polyfills.js";
import type { GioApi, LibsecretApi, SecretRecord } from "./types.js";
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
export declare let Libsecret: LibsecretApi;
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
export declare let Gio: GioApi;
/** Returns records through the optional runtime enumeration capability. @internal */
export declare function listSecretRecords(service: string): SecretRecord[];
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
export declare function isLinuxKeyringAvailable(): boolean;
/**
 * Returns the reason the libsecret backend could not load.
 *
 * @returns An error carrying the load or platform reason.
 */
export declare function linuxLibsecretUnavailableError(): Error;
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
export declare function isGioAvailable(): boolean;
export { GCancellableHandle, type GioApi, type LibsecretApi, type LibsecretBindings, LibsecretErrorHandle, type LibsecretRuntime, LINUX, SecretPasswordHandle, type SecretRecord, SecretSchemaHandle, } from "./types.js";
