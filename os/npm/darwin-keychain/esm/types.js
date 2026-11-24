/**
 * Shared keychain types.
 *
 * @module @neotales/darwin-keychain/ffi
 */
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
var _KeychainHandle_pointer;
/**
 * Opaque Security.framework reference.
 *
 * The pointer remains private so it cannot accidentally be passed to a
 * different runtime's FFI implementation. {@link valueOf} returns it only for
 * native FFI operations in the owning runtime.
 *
 * @example
 * ```ts
 * import { KeychainHandle } from "@neotales/darwin-keychain/ffi";
 *
 * const handle = new KeychainHandle("deno", 0n);
 * ```
 */
export class KeychainHandle {
    /**
     * Creates a handle for a runtime-owned native reference.
     *
     * @param runtime Runtime that created the reference.
     * @param pointer Private native reference.
     * @example
     * ```ts
     * import { KeychainHandle } from "@neotales/darwin-keychain/ffi";
     *
     * const handle = new KeychainHandle("deno", 0n);
     * ```
     */
    constructor(runtime, pointer) {
        Object.defineProperty(this, "runtime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: runtime
        });
        _KeychainHandle_pointer.set(this, void 0);
        __classPrivateFieldSet(this, _KeychainHandle_pointer, pointer, "f");
    }
    /**
     * Returns the private runtime-owned reference for FFI use.
     *
     * @returns The underlying reference.
     * @example
     * ```ts
     * import { KeychainHandle } from "@neotales/darwin-keychain/ffi";
     *
     * const pointer = new KeychainHandle("deno", 0n).valueOf();
     * ```
     */
    valueOf() {
        return __classPrivateFieldGet(this, _KeychainHandle_pointer, "f");
    }
}
_KeychainHandle_pointer = new WeakMap();
/**
 * Whether the current runtime is macOS.
 *
 * @returns `true` when the runtime is executing on macOS.
 * @example
 * ```ts
 * import { DARWIN } from "@neotales/darwin-keychain/ffi";
 *
 * if (DARWIN) console.log("macOS runtime");
 * ```
 */
export const DARWIN = (typeof globalThis.process !== "undefined" &&
    globalThis.process.platform === "darwin") ||
    (typeof globalThis.Deno !== "undefined" && globalThis.Deno.build.os === "darwin") ||
    globalThis
        .navigator?.platform === "MacIntel" ||
    globalThis
        .navigator?.userAgentData?.platform === "macOS";
