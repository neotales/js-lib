/** Native macOS Keychain API. @module @neotales/darwin-keychain/ffi */
import "./_dnt.polyfills.js";
import type { GenericPassword, KeychainHandle, SecretRecord } from "./types.js";
interface DarwinKeychainApi {
    /**
     * Reads secret bytes from a generic-password item.
     * @param service Keychain service name.
     * @param account Keychain account name.
     * @returns Secret bytes, or `null` when absent.
     * @example
     * ```ts
     * import { DarwinKeychain } from "@neotales/darwin-keychain/ffi";
     *
     * const secret = DarwinKeychain.getSecretBytes("service", "account");
     * ```
     */
    getSecretBytes(service: string, account: string): Uint8Array | null;
    /**
     * Creates or replaces a generic-password item.
     * @param service Keychain service name.
     * @param account Keychain account name.
     * @param secret Secret bytes to store.
     * @returns Nothing.
     * @example
     * ```ts
     * import { DarwinKeychain } from "@neotales/darwin-keychain/ffi";
     *
     * DarwinKeychain.saveSecretBytes("service", "account", new Uint8Array([1]));
     * ```
     */
    saveSecretBytes(service: string, account: string, secret: Uint8Array): void;
    /**
     * Deletes a generic-password item.
     * @param service Keychain service name.
     * @param account Keychain account name.
     * @returns `true` when an item was deleted.
     * @example
     * ```ts
     * import { DarwinKeychain } from "@neotales/darwin-keychain/ffi";
     *
     * DarwinKeychain.removeSecret("service", "account");
     * ```
     */
    removeSecret(service: string, account: string): boolean;
    /**
     * Lists generic-password items for a service.
     * @param service Keychain service name.
     * @returns Matching records with copied secret bytes.
     * @example
     * ```ts
     * import { DarwinKeychain } from "@neotales/darwin-keychain/ffi";
     *
     * const records = DarwinKeychain.listSecrets("service");
     * ```
     */
    listSecrets(service: string): SecretRecord[];
}
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
 * Security.framework-style operations using opaque handles.
 *
 * @example
 * ```ts
 * import { Keychain } from "@neotales/darwin-keychain/ffi";
 *
 * const result = Keychain.SecKeychainFindGenericPassword("service", "account");
 * ```
 */
export declare let Keychain: KeychainApi;
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
export declare function isDarwinKeychainAvailable(): boolean;
/**
 * Returns the reason the Keychain backend could not load.
 *
 * @returns An error carrying the load or platform reason.
 */
export declare function darwinKeychainUnavailableError(): Error;
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
export declare const DarwinKeychain: DarwinKeychainApi;
export { DARWIN, type DarwinKeychainBackend, type GenericPassword, KeychainHandle, type KeychainRuntime, type SecretRecord, } from "./types.js";
