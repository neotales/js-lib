/** Native macOS Keychain API. @module @neotales/darwin-keychain/ffi */
import "./_dnt.polyfills.js";
import { DARWIN, KeychainHandle as KeychainHandleValue } from "./types.js";
let unavailableReason = "macOS Keychain is only available through Deno FFI on macOS.";
const unavailableBackend = {
    getSecretBytes() {
        return unavailable();
    },
    saveSecretBytes() {
        unavailable();
    },
    removeSecret() {
        return unavailable();
    },
    listSecrets() {
        return unavailable();
    },
};
let backend = unavailableBackend;
let runtime = "node";
const unavailableKeychain = {
    SecKeychainFindGenericPassword() {
        return unavailable();
    },
    SecKeychainAddGenericPassword() {
        return unavailable();
    },
    SecKeychainItemModifyAttributesAndData() {
        unavailable();
    },
    SecKeychainItemDelete() {
        unavailable();
    },
    SecKeychainSearchCreateFromAttributes() {
        return unavailable();
    },
    SecKeychainSearchCopyNext() {
        return unavailable();
    },
    SecKeychainItemCopyAttributesAndData() {
        return unavailable();
    },
    CFRelease() {
        unavailable();
    },
};
function itemPointer(handle) {
    if (handle.runtime !== runtime)
        throw new TypeError("Keychain handle belongs to a different runtime.");
    const pointer = handle.valueOf();
    if (!pointer || typeof pointer !== "object" || !("service" in pointer) || !("account" in pointer))
        throw new TypeError("Invalid Keychain item handle.");
    return pointer;
}
function searchPointer(handle) {
    if (handle.runtime !== runtime)
        throw new TypeError("Keychain handle belongs to a different runtime.");
    const pointer = handle.valueOf();
    if (!pointer || typeof pointer !== "object" || !("records" in pointer) || !("index" in pointer))
        throw new TypeError("Invalid Keychain search handle.");
    return pointer;
}
const portableKeychain = {
    SecKeychainFindGenericPassword(service, account) {
        const secret = backend.getSecretBytes(service, account);
        return secret === null
            ? null
            : { item: new KeychainHandleValue(runtime, { service, account }), secret };
    },
    SecKeychainAddGenericPassword(service, account, secret) {
        backend.saveSecretBytes(service, account, secret);
        return new KeychainHandleValue(runtime, { service, account });
    },
    SecKeychainItemModifyAttributesAndData(item, secret) {
        const pointer = itemPointer(item);
        backend.saveSecretBytes(pointer.service, pointer.account, secret);
    },
    SecKeychainItemDelete(item) {
        const pointer = itemPointer(item);
        if (!backend.removeSecret(pointer.service, pointer.account))
            throw new Error("SecKeychainItemDelete could not find the item.");
    },
    SecKeychainSearchCreateFromAttributes(service) {
        if (backend.listSecrets === undefined)
            throw new Error("Keychain enumeration is unavailable in this runtime.");
        return new KeychainHandleValue(runtime, { records: backend.listSecrets(service), index: 0 });
    },
    SecKeychainSearchCopyNext(search) {
        const pointer = searchPointer(search);
        const record = pointer.records[pointer.index++];
        return record === undefined
            ? null
            : new KeychainHandleValue(runtime, { service: record.service, account: record.account });
    },
    SecKeychainItemCopyAttributesAndData(item, service) {
        const pointer = itemPointer(item);
        if (pointer.service !== service)
            throw new RangeError("Item handle does not belong to the requested service.");
        const secret = backend.getSecretBytes(service, pointer.account);
        return secret === null ? null : { service, account: pointer.account, secret };
    },
    CFRelease(handle) {
        if (handle.runtime !== runtime)
            throw new TypeError("Keychain handle belongs to a different runtime.");
    },
};
/**
 * Security.framework-style operations using opaque handles.
 *
 * @example
 * ```ts
 * import { Keychain } from "@neotales/darwin-keychain/ffi";
 *
 * const result = Keychain.SecKeychainFindGenericPassword("service", "account");
 * ```
 */
export let Keychain = unavailableKeychain;
let available = false;
// #region darwin-keychain-runtime-backend
// Guarded: the dynamic imports are not evaluated on a runtime that is not
// macOS, so no native module loads there. The JerryScript build removes this
// region because its IIFE bundle cannot parse top-level await.
if (DARWIN) {
    try {
        if ("Deno" in globalThis) {
            const ffi = await import("./ffi_deno.js");
            backend = ffi.backend;
            Keychain = ffi.Keychain;
            runtime = "deno";
        }
        else if ("Bun" in globalThis) {
            backend = (await import("./ffi_bun.js")).backend;
            Keychain = portableKeychain;
            runtime = "bun";
        }
        else if ("tjs" in globalThis) {
            const ffi = await import("./ffi_txiki.js");
            // tjs:ffi opens frameworks lazily. Probe the real load before claiming
            // availability, without reading a keychain item.
            ffi.open();
            backend = ffi.backend;
            Keychain = portableKeychain;
            runtime = "tjs";
        }
        else if (typeof globalThis.process?.getBuiltinModule === "function") {
            backend = (await import("./ffi_node.js")).backend;
            Keychain = portableKeychain;
            runtime = "node";
        }
        else {
            throw new Error("No Keychain FFI backend for this runtime.");
        }
        available = true;
    }
    catch (error) {
        unavailableReason = error instanceof Error ? error.message : String(error);
    }
}
// #endregion darwin-keychain-runtime-backend
function unavailable() {
    throw new Error(unavailableReason);
}
/**
 * Reports whether the native Keychain backend loaded successfully.
 *
 * @returns `true` when Security.framework operations are available.
 * @example
 * ```ts
 * import { isDarwinKeychainAvailable } from "@neotales/darwin-keychain/ffi";
 *
 * if (isDarwinKeychainAvailable()) console.log("Keychain is available");
 * ```
 */
export function isDarwinKeychainAvailable() {
    return available;
}
/**
 * Returns the reason the Keychain backend could not load.
 *
 * @returns An error carrying the load or platform reason.
 */
export function darwinKeychainUnavailableError() {
    return new Error(unavailableReason);
}
/**
 * Byte-oriented native generic-password operations.
 *
 * @example
 * ```ts
 * import { DarwinKeychain } from "@neotales/darwin-keychain/ffi";
 *
 * const secret = DarwinKeychain.getSecretBytes("service", "account");
 * ```
 */
export const DarwinKeychain = {
    getSecretBytes(service, account) {
        return backend.getSecretBytes(service, account);
    },
    saveSecretBytes(service, account, secret) {
        backend.saveSecretBytes(service, account, secret);
    },
    removeSecret(service, account) {
        return backend.removeSecret(service, account);
    },
    listSecrets(service) {
        if (backend.listSecrets === undefined)
            throw new Error("Keychain enumeration is unavailable in this runtime.");
        return backend.listSecrets(service);
    },
};
export { DARWIN, KeychainHandle, } from "./types.js";
