/**
 * Deno Security.framework FFI backend.
 *
 * @module @neotales/darwin-keychain
 */
import "./_dnt.polyfills.js";
import { type DarwinKeychainBackend, type GenericPassword, KeychainHandle, type SecretRecord } from "./types.js";
export declare const backend: DarwinKeychainBackend;
type KeychainApi = {
    /**
     * Finds a native generic-password item.
     *
     * @param service Service name.
     * @param account Account name.
     * @returns An owned item and copied secret, or `null`.
     * @example
     * ```ts
     * import { Keychain } from "@neotales/darwin-keychain/ffi";
     * const result = Keychain.SecKeychainFindGenericPassword("service", "account");
     * ```
     */
    SecKeychainFindGenericPassword(service: string, account: string): GenericPassword | null;
    /**
     * Adds a native generic-password item.
     *
     * @param service Service name.
     * @param account Account name.
     * @param secret Secret bytes.
     * @returns An owned item handle.
     * @example
     * ```ts
     * import { Keychain } from "@neotales/darwin-keychain/ffi";
     *
     * const item = Keychain.SecKeychainAddGenericPassword("service", "account", new Uint8Array());
     * ```
     */
    SecKeychainAddGenericPassword(service: string, account: string, secret: Uint8Array): KeychainHandle;
    /**
     * Replaces item data.
     *
     * @param item Owned item handle.
     * @param secret Replacement bytes.
     * @returns Nothing.
     * @example
     * ```ts
     * import { Keychain } from "@neotales/darwin-keychain/ffi";
     *
     * Keychain.SecKeychainItemModifyAttributesAndData(item, new Uint8Array());
     * ```
     */
    SecKeychainItemModifyAttributesAndData(item: KeychainHandle, secret: Uint8Array): void;
    /**
     * Deletes an item.
     *
     * @param item Owned item handle.
     * @returns Nothing.
     * @example
     * ```ts
     * import { Keychain } from "@neotales/darwin-keychain/ffi";
     *
     * Keychain.SecKeychainItemDelete(item);
     * ```
     */
    SecKeychainItemDelete(item: KeychainHandle): void;
    /**
     * Creates a generic-password search.
     *
     * @param service Service name.
     * @returns An owned search handle.
     * @example
     * ```ts
     * import { Keychain } from "@neotales/darwin-keychain/ffi";
     *
     * const search = Keychain.SecKeychainSearchCreateFromAttributes("service");
     * ```
     */
    SecKeychainSearchCreateFromAttributes(service: string): KeychainHandle;
    /**
     * Advances a search.
     *
     * @param search Owned search handle.
     * @returns The next owned item, or `null`.
     * @example
     * ```ts
     * import { Keychain } from "@neotales/darwin-keychain/ffi";
     *
     * const item = Keychain.SecKeychainSearchCopyNext(search);
     * ```
     */
    SecKeychainSearchCopyNext(search: KeychainHandle): KeychainHandle | null;
    /**
     * Copies an item's account and secret.
     *
     * @param item Owned item handle.
     * @param service Service name.
     * @returns A copied record, or `null`.
     * @example
     * ```ts
     * import { Keychain } from "@neotales/darwin-keychain/ffi";
     *
     * const record = Keychain.SecKeychainItemCopyAttributesAndData(item, "service");
     * ```
     */
    SecKeychainItemCopyAttributesAndData(item: KeychainHandle, service: string): SecretRecord | null;
    /**
     * Releases an owned Security.framework reference.
     *
     * @param handle Owned item or search handle.
     * @returns Nothing.
     * @example
     * ```ts
     * import { Keychain } from "@neotales/darwin-keychain/ffi";
     *
     * Keychain.CFRelease(handle);
     * ```
     */
    CFRelease(handle: KeychainHandle): void;
};
/**
 * Direct Security.framework operations using opaque {@link KeychainHandle}
 * references. Call {@link Keychain.CFRelease} exactly once for every item or
 * search handle returned by this object.
 */
export declare const Keychain: KeychainApi;
export {};
