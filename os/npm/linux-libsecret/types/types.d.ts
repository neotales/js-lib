/** Shared Linux keyring types. @module @neotales/linux-libsecret/ffi */
/**
 * Secret record returned by keyring listing operations.
 *
 * @example
 * ```ts
 * import type { SecretRecord } from "@neotales/linux-libsecret";
 *
 * const record: SecretRecord = { service: "service", account: "account", secret: new Uint8Array() };
 * ```
 */
export interface SecretRecord {
    /** Keyring service name. */
    service: string;
    /** Keyring account name. */
    account: string;
    /** Secret bytes copied from libsecret. */
    secret: Uint8Array;
}
/**
 * Runtime that owns a libsecret native reference.
 *
 * @example
 * ```ts
 * import type { LibsecretRuntime } from "@neotales/linux-libsecret/ffi";
 *
 * const runtime: LibsecretRuntime = "node";
 * ```
 */
export type LibsecretRuntime = "deno" | "bun" | "node" | "tjs" | "koffi";
/**
 * Opaque runtime-bound `SecretSchema` reference.
 *
 * Obtain schemas from `Libsecret.secretSchemaNew`. Direct construction is intended for
 * FFI adapter implementations that already own a native schema pointer.
 *
 * @example
 * ```ts
 * import { Libsecret } from "@neotales/linux-libsecret/ffi";
 *
 * const schema = Libsecret.secretSchemaNew(
 *   "org.example.Secret",
 *   0,
 *   "service",
 *   0,
 *   "account",
 *   0,
 *   null,
 * );
 * ```
 */
export declare class SecretSchemaHandle {
    #private;
    /** Runtime that owns this handle and its native pointer. */
    readonly runtime: LibsecretRuntime;
    /**
     * Creates a handle around a native schema pointer for an FFI adapter.
     *
     * @param runtime Runtime that owns `pointer`.
     * @param pointer Native `SecretSchema` pointer.
     * @example
     * ```ts
     * import { SecretSchemaHandle } from "@neotales/linux-libsecret/ffi";
     *
     * declare const nativeSchema: unknown;
     * const schema = new SecretSchemaHandle("node", nativeSchema);
     * ```
     */
    constructor(runtime: LibsecretRuntime, pointer: unknown);
    /**
     * Returns the native reference for the owning FFI implementation.
     *
     * @returns The runtime-specific native `SecretSchema` pointer.
     * @example
     * ```ts
     * import { Libsecret } from "@neotales/linux-libsecret/ffi";
     *
     * const schema = Libsecret.secretSchemaNew(
     *   "org.example.Secret",
     *   0,
     *   "service",
     *   0,
     *   "account",
     *   0,
     *   null,
     * );
     * if (schema !== null) {
     *   const nativeSchema = schema.valueOf();
     * }
     * ```
     */
    valueOf(): unknown;
}
/**
 * Opaque runtime-bound password returned by `secret_password_lookup_sync`.
 *
 * Release handles returned by libsecret with `Libsecret.secretPasswordFree`.
 * Direct construction is intended for FFI adapter implementations.
 */
export declare class SecretPasswordHandle {
    #private;
    /** Runtime that owns this handle and its native pointer. */
    readonly runtime: LibsecretRuntime;
    /**
     * Creates a handle around a native password pointer for an FFI adapter.
     *
     * @param runtime Runtime that owns `pointer`.
     * @param pointer Native password pointer.
     * @param text Password text copied from the native pointer.
     * @example
     * ```ts
     * import { SecretPasswordHandle } from "@neotales/linux-libsecret/ffi";
     *
     * declare const nativePassword: unknown;
     * const password = new SecretPasswordHandle("node", nativePassword, "secret");
     * ```
     */
    constructor(runtime: LibsecretRuntime, pointer: unknown, text: string);
    /**
     * Returns the copied password text.
     *
     * Release this handle with `Libsecret.secretPasswordFree` after use.
     *
     * @returns The password text copied from libsecret.
     * @example
     * ```ts
     * import { Libsecret, LibsecretErrorHandle } from "@neotales/linux-libsecret/ffi";
     *
     * const schema = Libsecret.secretSchemaNew(
     *   "org.example.Secret",
     *   0,
     *   "service",
     *   0,
     *   "account",
     *   0,
     *   null,
     * );
     * if (schema === null) throw new Error("Could not create schema");
     * const errorOut = new LibsecretErrorHandle();
     * const password = Libsecret.secretPasswordLookupSync(
     *   schema,
     *   null,
     *   errorOut,
     *   "service",
     *   "example",
     *   "account",
     *   "alice",
     *   null,
     * );
     * if (errorOut.error() !== null) throw errorOut.error();
     * if (password !== null) {
     *   console.log(password.text());
     *   Libsecret.secretPasswordFree(password);
     * }
     * ```
     */
    text(): string;
    /**
     * Returns the native reference for the owning FFI implementation.
     *
     * @returns The runtime-specific native password pointer.
     * @example
     * ```ts
     * import { Libsecret, LibsecretErrorHandle } from "@neotales/linux-libsecret/ffi";
     *
     * const schema = Libsecret.secretSchemaNew(
     *   "org.example.Secret",
     *   0,
     *   "service",
     *   0,
     *   "account",
     *   0,
     *   null,
     * );
     * if (schema === null) throw new Error("Could not create schema");
     * const errorOut = new LibsecretErrorHandle();
     * const password = Libsecret.secretPasswordLookupSync(
     *   schema,
     *   null,
     *   errorOut,
     *   "service",
     *   "example",
     *   "account",
     *   "alice",
     *   null,
     * );
     * if (password !== null) {
     *   const nativePassword = password.valueOf();
     *   Libsecret.secretPasswordFree(password);
     * }
     * ```
     */
    valueOf(): unknown;
}
/**
 * Opaque runtime-bound `GCancellable` reference.
 *
 * When GIO is available, create it with `Gio.cancellableNew`, optionally cancel it with
 * `Gio.cancellableCancel`, and release it exactly once with
 * `Gio.cancellableRelease`. A released handle cannot be used again.
 */
export declare class GCancellableHandle {
    #private;
    /** Runtime that owns this handle and its native pointer. */
    readonly runtime: LibsecretRuntime;
    /**
     * Creates a handle around a native `GCancellable` pointer for an FFI adapter.
     *
     * @param runtime Runtime that owns `pointer`.
     * @param pointer Native `GCancellable` pointer.
     * @example
     * ```ts
     * import { GCancellableHandle } from "@neotales/linux-libsecret/ffi";
     *
     * declare const nativeCancellable: unknown;
     * const cancellable = new GCancellableHandle("node", nativeCancellable);
     * ```
     */
    constructor(runtime: LibsecretRuntime, pointer: unknown);
    /**
     * Returns the native reference for the owning FFI implementation.
     *
     * @returns The runtime-specific native `GCancellable` pointer.
     * @example
     * ```ts
     * import { Gio, isGioAvailable } from "@neotales/linux-libsecret/ffi";
     *
     * if (isGioAvailable()) {
     *   const cancellable = Gio.cancellableNew();
     *   const nativeCancellable = cancellable.valueOf();
     *   Gio.cancellableRelease(cancellable);
     * }
     * ```
     */
    valueOf(): unknown;
}
/**
 * Opaque output handle for a native `GError**` argument.
 *
 * Create a new handle for each libsecret operation that accepts `errorOut`.
 *
 * @example
 * ```ts
 * import { LibsecretErrorHandle } from "@neotales/linux-libsecret/ffi";
 *
 * const errorOut = new LibsecretErrorHandle();
 * ```
 */
export declare class LibsecretErrorHandle {
    /**
     * Returns the error written by the most recent native call, if any.
     *
     * @returns The captured libsecret error, or `null` when the call did not report one.
     * @example
     * ```ts
     * import { LibsecretErrorHandle } from "@neotales/linux-libsecret/ffi";
     *
     * const errorOut = new LibsecretErrorHandle();
     * const error = errorOut.error();
     * if (error !== null) throw error;
     * ```
     */
    error(): Error | null;
}
/** @internal */
export declare function prepareLibsecretError(handle: LibsecretErrorHandle, runtime: LibsecretRuntime): void;
/** @internal */
export declare function setLibsecretError(handle: LibsecretErrorHandle, error: Error): void;
/** @internal */
export declare function prepareGCancellable(handle: GCancellableHandle, runtime: LibsecretRuntime): void;
/** @internal */
export declare function releaseGCancellable(handle: GCancellableHandle, runtime: LibsecretRuntime): void;
/** Typed camelCase wrappers for native libsecret functions. */
export interface LibsecretApi {
    /**
     * Creates a libsecret schema.
     *
     * @param name Schema name.
     * @param flags Native schema flags.
     * @param attributeName1 First attribute name.
     * @param attributeType1 First attribute type.
     * @param attributeName2 Second attribute name.
     * @param attributeType2 Second attribute type.
     * @param terminator Required native varargs terminator.
     * @returns An opaque schema handle, or `null` when creation fails.
     * @example
     * ```ts
     * import { Libsecret } from "@neotales/linux-libsecret/ffi";
     *
     * const schema = Libsecret.secretSchemaNew(
     *   "org.example.Secret",
     *   0,
     *   "service",
     *   0,
     *   "account",
     *   0,
     *   null,
     * );
     * ```
     */
    secretSchemaNew(name: string, flags: number, attributeName1: string, attributeType1: number, attributeName2: string, attributeType2: number, terminator: null): SecretSchemaHandle | null;
    /**
     * Looks up a password using a schema and attributes.
     *
     * @param schema Schema returned by `secretSchemaNew`.
     * @param cancellable A `GCancellableHandle` from `Gio`, or `null`.
     * @param errorOut Receives a native `GError**` result for this call.
     * @param attributeName1 First attribute name.
     * @param attributeValue1 First attribute value.
     * @param attributeName2 Second attribute name.
     * @param attributeValue2 Second attribute value.
     * @param terminator Required native varargs terminator.
     * @returns An owned password handle, or `null` when no password was found or an error occurred.
     * @example
     * ```ts
     * import { Libsecret, LibsecretErrorHandle } from "@neotales/linux-libsecret/ffi";
     *
     * const schema = Libsecret.secretSchemaNew(
     *   "org.example.Secret",
     *   0,
     *   "service",
     *   0,
     *   "account",
     *   0,
     *   null,
     * );
     * if (schema === null) throw new Error("Could not create schema");
     * const errorOut = new LibsecretErrorHandle();
     * const password = Libsecret.secretPasswordLookupSync(
     *   schema,
     *   null,
     *   errorOut,
     *   "service",
     *   "example",
     *   "account",
     *   "alice",
     *   null,
     * );
     * const error = errorOut.error();
     * if (error !== null) throw error;
     * ```
     */
    secretPasswordLookupSync(schema: SecretSchemaHandle, cancellable: GCancellableHandle | null, errorOut: LibsecretErrorHandle, attributeName1: string, attributeValue1: string, attributeName2: string, attributeValue2: string, terminator: null): SecretPasswordHandle | null;
    /**
     * Stores a password using a schema and attributes.
     *
     * @param schema Schema returned by `secretSchemaNew`.
     * @param collection Native collection name.
     * @param label Display label for the stored password.
     * @param password Password text to store.
     * @param cancellable A `GCancellableHandle` from `Gio`, or `null`.
     * @param errorOut Receives a native `GError**` result for this call.
     * @param attributeName1 First attribute name.
     * @param attributeValue1 First attribute value.
     * @param attributeName2 Second attribute name.
     * @param attributeValue2 Second attribute value.
     * @param terminator Required native varargs terminator.
     * @returns `true` when the password was stored; inspect `errorOut` when `false`.
     * @example
     * ```ts
     * import { Libsecret, LibsecretErrorHandle } from "@neotales/linux-libsecret/ffi";
     *
     * const schema = Libsecret.secretSchemaNew(
     *   "org.example.Secret",
     *   0,
     *   "service",
     *   0,
     *   "account",
     *   0,
     *   null,
     * );
     * if (schema === null) throw new Error("Could not create schema");
     * const errorOut = new LibsecretErrorHandle();
     * const stored = Libsecret.secretPasswordStoreSync(
     *   schema,
     *   "default",
     *   "Example credential",
     *   "secret",
     *   null,
     *   errorOut,
     *   "service",
     *   "example",
     *   "account",
     *   "alice",
     *   null,
     * );
     * const error = errorOut.error();
     * if (error !== null) throw error;
     * ```
     */
    secretPasswordStoreSync(schema: SecretSchemaHandle, collection: string, label: string, password: string, cancellable: GCancellableHandle | null, errorOut: LibsecretErrorHandle, attributeName1: string, attributeValue1: string, attributeName2: string, attributeValue2: string, terminator: null): boolean;
    /**
     * Clears passwords matching a schema and attributes.
     *
     * @param schema Schema returned by `secretSchemaNew`.
     * @param cancellable A `GCancellableHandle` from `Gio`, or `null`.
     * @param errorOut Receives a native `GError**` result for this call.
     * @param attributeName1 First attribute name.
     * @param attributeValue1 First attribute value.
     * @param attributeName2 Second attribute name.
     * @param attributeValue2 Second attribute value.
     * @param terminator Required native varargs terminator.
     * @returns `true` when matching passwords were cleared; inspect `errorOut` when `false`.
     * @example
     * ```ts
     * import { Libsecret, LibsecretErrorHandle } from "@neotales/linux-libsecret/ffi";
     *
     * const schema = Libsecret.secretSchemaNew(
     *   "org.example.Secret",
     *   0,
     *   "service",
     *   0,
     *   "account",
     *   0,
     *   null,
     * );
     * if (schema === null) throw new Error("Could not create schema");
     * const errorOut = new LibsecretErrorHandle();
     * const cleared = Libsecret.secretPasswordClearSync(
     *   schema,
     *   null,
     *   errorOut,
     *   "service",
     *   "example",
     *   "account",
     *   "alice",
     *   null,
     * );
     * const error = errorOut.error();
     * if (error !== null) throw error;
     * ```
     */
    secretPasswordClearSync(schema: SecretSchemaHandle, cancellable: GCancellableHandle | null, errorOut: LibsecretErrorHandle, attributeName1: string, attributeValue1: string, attributeName2: string, attributeValue2: string, terminator: null): boolean;
    /**
     * Releases a password handle returned by `secretPasswordLookupSync`.
     *
     * @param password Owned password handle to release.
     * @returns Nothing.
     * @example
     * ```ts
     * import { Libsecret, LibsecretErrorHandle } from "@neotales/linux-libsecret/ffi";
     *
     * const schema = Libsecret.secretSchemaNew(
     *   "org.example.Secret",
     *   0,
     *   "service",
     *   0,
     *   "account",
     *   0,
     *   null,
     * );
     * if (schema === null) throw new Error("Could not create schema");
     * const errorOut = new LibsecretErrorHandle();
     * const password = Libsecret.secretPasswordLookupSync(
     *   schema,
     *   null,
     *   errorOut,
     *   "service",
     *   "example",
     *   "account",
     *   "alice",
     *   null,
     * );
     * if (password !== null) Libsecret.secretPasswordFree(password);
     * ```
     */
    secretPasswordFree(password: SecretPasswordHandle): void;
}
/**
 * Typed wrappers for the optional GIO `GCancellable` lifecycle.
 *
 * These methods throw when `libgio-2.0.so.0` is unavailable.
 */
export interface GioApi {
    /**
     * Creates an owned `GCancellable` handle.
     *
     * Release the returned handle exactly once with `cancellableRelease`.
     *
     * @returns An opaque runtime-bound cancellable handle.
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
    cancellableNew(): GCancellableHandle;
    /**
     * Cancels operations using this handle. Cancellation is permanent for the handle.
     *
     * @param cancellable A handle returned by `cancellableNew` in this runtime.
     * @returns Nothing.
     * @example
     * ```ts
     * import { Gio, isGioAvailable } from "@neotales/linux-libsecret/ffi";
     *
     * if (isGioAvailable()) {
     *   const cancellable = Gio.cancellableNew();
     *   Gio.cancellableCancel(cancellable);
     *   Gio.cancellableRelease(cancellable);
     * }
     * ```
     */
    cancellableCancel(cancellable: GCancellableHandle): void;
    /**
     * Releases an owned cancellable handle with `g_object_unref`.
     *
     * Do not pass the handle to another native call after release.
     *
     * @param cancellable A handle returned by `cancellableNew` in this runtime.
     * @returns Nothing.
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
    cancellableRelease(cancellable: GCancellableHandle): void;
}
/** Typed runtime implementation of the public libsecret API. @internal */
export interface LibsecretBindings extends LibsecretApi {
    readonly runtime: LibsecretRuntime;
    /** GIO cancellable support when `libgio-2.0.so.0` was loaded. */
    readonly gio?: GioApi;
    /** Additional runtime-only capability used to preserve root `listSecrets`. */
    listSecretRecords?: (service: string) => SecretRecord[];
}
/**
 * Whether the current runtime is Linux.
 *
 * @returns `true` when the runtime is executing on Linux.
 * @example
 * ```ts
 * import { LINUX } from "@neotales/linux-libsecret/ffi";
 *
 * if (LINUX) console.log("Linux runtime");
 * ```
 */
export declare const LINUX: boolean;
