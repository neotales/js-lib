/** Shared Linux keyring types. @module @neotales/linux-libsecret/ffi */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SecretSchemaHandle_pointer, _SecretPasswordHandle_pointer, _SecretPasswordHandle_text, _GCancellableHandle_pointer;
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
export class SecretSchemaHandle {
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
    constructor(runtime, pointer) {
        _SecretSchemaHandle_pointer.set(this, void 0);
        /** Runtime that owns this handle and its native pointer. */
        Object.defineProperty(this, "runtime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.runtime = runtime;
        __classPrivateFieldSet(this, _SecretSchemaHandle_pointer, pointer, "f");
    }
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
    valueOf() {
        return __classPrivateFieldGet(this, _SecretSchemaHandle_pointer, "f");
    }
}
_SecretSchemaHandle_pointer = new WeakMap();
/**
 * Opaque runtime-bound password returned by `secret_password_lookup_sync`.
 *
 * Release handles returned by libsecret with `Libsecret.secretPasswordFree`.
 * Direct construction is intended for FFI adapter implementations.
 */
export class SecretPasswordHandle {
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
    constructor(runtime, pointer, text) {
        _SecretPasswordHandle_pointer.set(this, void 0);
        _SecretPasswordHandle_text.set(this, void 0);
        /** Runtime that owns this handle and its native pointer. */
        Object.defineProperty(this, "runtime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.runtime = runtime;
        __classPrivateFieldSet(this, _SecretPasswordHandle_pointer, pointer, "f");
        __classPrivateFieldSet(this, _SecretPasswordHandle_text, text, "f");
    }
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
    text() {
        return __classPrivateFieldGet(this, _SecretPasswordHandle_text, "f");
    }
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
    valueOf() {
        return __classPrivateFieldGet(this, _SecretPasswordHandle_pointer, "f");
    }
}
_SecretPasswordHandle_pointer = new WeakMap(), _SecretPasswordHandle_text = new WeakMap();
/**
 * Opaque runtime-bound `GCancellable` reference.
 *
 * When GIO is available, create it with `Gio.cancellableNew`, optionally cancel it with
 * `Gio.cancellableCancel`, and release it exactly once with
 * `Gio.cancellableRelease`. A released handle cannot be used again.
 */
export class GCancellableHandle {
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
    constructor(runtime, pointer) {
        _GCancellableHandle_pointer.set(this, void 0);
        /** Runtime that owns this handle and its native pointer. */
        Object.defineProperty(this, "runtime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.runtime = runtime;
        __classPrivateFieldSet(this, _GCancellableHandle_pointer, pointer, "f");
    }
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
    valueOf() {
        return __classPrivateFieldGet(this, _GCancellableHandle_pointer, "f");
    }
}
_GCancellableHandle_pointer = new WeakMap();
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
export class LibsecretErrorHandle {
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
    error() {
        return errors.get(this) ?? null;
    }
}
const errorRuntimes = new WeakMap();
const errors = new WeakMap();
const releasedCancellables = new WeakSet();
/** @internal */
export function prepareLibsecretError(handle, runtime) {
    if (!(handle instanceof LibsecretErrorHandle))
        throw new TypeError("Expected a LibsecretErrorHandle.");
    const owner = errorRuntimes.get(handle);
    if (owner !== undefined && owner !== runtime)
        throw new TypeError("Libsecret error handle belongs to a different runtime.");
    errorRuntimes.set(handle, runtime);
    errors.delete(handle);
}
/** @internal */
export function setLibsecretError(handle, error) {
    errors.set(handle, error);
}
/** @internal */
export function prepareGCancellable(handle, runtime) {
    if (!(handle instanceof GCancellableHandle))
        throw new TypeError("Expected a GCancellableHandle.");
    if (handle.runtime !== runtime)
        throw new TypeError("GCancellable handle belongs to a different runtime.");
    if (releasedCancellables.has(handle))
        throw new TypeError("GCancellable handle has been released.");
}
/** @internal */
export function releaseGCancellable(handle, runtime) {
    prepareGCancellable(handle, runtime);
    releasedCancellables.add(handle);
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
export const LINUX = (typeof globalThis.process !== "undefined" &&
    globalThis.process.platform === "linux") ||
    (typeof globalThis.Deno !== "undefined" && globalThis.Deno.build.os === "linux") ||
    globalThis
        .navigator?.platform?.startsWith("Linux") === true ||
    globalThis
        .navigator?.userAgentData?.platform === "Linux";
