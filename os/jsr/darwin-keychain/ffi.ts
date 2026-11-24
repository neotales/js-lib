/** Native macOS Keychain API. @module @neotales/darwin-keychain/ffi */

import type {
  DarwinKeychainBackend,
  GenericPassword,
  KeychainHandle,
  KeychainRuntime,
  SecretRecord,
} from "./types.ts";
import { DARWIN, KeychainHandle as KeychainHandleValue } from "./types.ts";

let unavailableReason = "macOS Keychain is only available through Deno FFI on macOS.";
const unavailableBackend: DarwinKeychainBackend = {
  getSecretBytes(): Uint8Array | null {
    return unavailable();
  },
  saveSecretBytes(): void {
    unavailable();
  },
  removeSecret(): boolean {
    return unavailable();
  },
  listSecrets(): SecretRecord[] {
    return unavailable();
  },
};

let backend = unavailableBackend;
let runtime: KeychainRuntime = "node";
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
  SecKeychainAddGenericPassword(
    service: string,
    account: string,
    secret: Uint8Array,
  ): KeychainHandle;
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
const unavailableKeychain: KeychainApi = {
  SecKeychainFindGenericPassword(): GenericPassword | null {
    return unavailable();
  },
  SecKeychainAddGenericPassword(): KeychainHandle {
    return unavailable();
  },
  SecKeychainItemModifyAttributesAndData(): void {
    unavailable();
  },
  SecKeychainItemDelete(): void {
    unavailable();
  },
  SecKeychainSearchCreateFromAttributes(): KeychainHandle {
    return unavailable();
  },
  SecKeychainSearchCopyNext(): KeychainHandle | null {
    return unavailable();
  },
  SecKeychainItemCopyAttributesAndData(): SecretRecord | null {
    return unavailable();
  },
  CFRelease(): void {
    unavailable();
  },
};
type ItemPointer = { service: string; account: string };
type SearchPointer = { records: SecretRecord[]; index: number };

function itemPointer(handle: KeychainHandle): ItemPointer {
  if (handle.runtime !== runtime)
    throw new TypeError("Keychain handle belongs to a different runtime.");
  const pointer = handle.valueOf();
  if (!pointer || typeof pointer !== "object" || !("service" in pointer) || !("account" in pointer))
    throw new TypeError("Invalid Keychain item handle.");
  return pointer as ItemPointer;
}

function searchPointer(handle: KeychainHandle): SearchPointer {
  if (handle.runtime !== runtime)
    throw new TypeError("Keychain handle belongs to a different runtime.");
  const pointer = handle.valueOf();
  if (!pointer || typeof pointer !== "object" || !("records" in pointer) || !("index" in pointer))
    throw new TypeError("Invalid Keychain search handle.");
  return pointer as SearchPointer;
}

const portableKeychain: KeychainApi = {
  SecKeychainFindGenericPassword(service, account): GenericPassword | null {
    const secret = backend.getSecretBytes(service, account);
    return secret === null
      ? null
      : { item: new KeychainHandleValue(runtime, { service, account }), secret };
  },
  SecKeychainAddGenericPassword(service, account, secret): KeychainHandle {
    backend.saveSecretBytes(service, account, secret);
    return new KeychainHandleValue(runtime, { service, account });
  },
  SecKeychainItemModifyAttributesAndData(item, secret): void {
    const pointer = itemPointer(item);
    backend.saveSecretBytes(pointer.service, pointer.account, secret);
  },
  SecKeychainItemDelete(item): void {
    const pointer = itemPointer(item);
    if (!backend.removeSecret(pointer.service, pointer.account))
      throw new Error("SecKeychainItemDelete could not find the item.");
  },
  SecKeychainSearchCreateFromAttributes(service): KeychainHandle {
    if (backend.listSecrets === undefined)
      throw new Error("Keychain enumeration is unavailable in this runtime.");
    return new KeychainHandleValue(runtime, { records: backend.listSecrets(service), index: 0 });
  },
  SecKeychainSearchCopyNext(search): KeychainHandle | null {
    const pointer = searchPointer(search);
    const record = pointer.records[pointer.index++];
    return record === undefined
      ? null
      : new KeychainHandleValue(runtime, { service: record.service, account: record.account });
  },
  SecKeychainItemCopyAttributesAndData(item, service): SecretRecord | null {
    const pointer = itemPointer(item);
    if (pointer.service !== service)
      throw new RangeError("Item handle does not belong to the requested service.");
    const secret = backend.getSecretBytes(service, pointer.account);
    return secret === null ? null : { service, account: pointer.account, secret };
  },
  CFRelease(handle): void {
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
export let Keychain: KeychainApi = unavailableKeychain;
let available = false;
// #region darwin-keychain-runtime-backend
// Guarded: the dynamic imports are not evaluated on a runtime that is not
// macOS, so no native module loads there. The JerryScript build removes this
// region because its IIFE bundle cannot parse top-level await.
if (DARWIN) {
  try {
    if ("Deno" in globalThis) {
      const ffi = await import("./ffi_deno.ts");
      backend = ffi.backend;
      Keychain = ffi.Keychain;
      runtime = "deno";
    } else if ("Bun" in globalThis) {
      backend = (await import("./ffi_bun.ts")).backend;
      Keychain = portableKeychain;
      runtime = "bun";
    } else if ("tjs" in globalThis) {
      const ffi = await import("./ffi_txiki.ts");
      // tjs:ffi opens frameworks lazily. Probe the real load before claiming
      // availability, without reading a keychain item.
      ffi.open();
      backend = ffi.backend;
      Keychain = portableKeychain;
      runtime = "tjs";
    } else if (typeof (globalThis as { process?: { getBuiltinModule?: unknown } }).process?.getBuiltinModule === "function") {
      backend = (await import("./ffi_node.ts")).backend;
      Keychain = portableKeychain;
      runtime = "node";
    } else {
      throw new Error("No Keychain FFI backend for this runtime.");
    }
    available = true;
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : String(error);
  }
}
// #endregion darwin-keychain-runtime-backend

function unavailable(): never {
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
export function isDarwinKeychainAvailable(): boolean {
  return available;
}

/**
 * Returns the reason the Keychain backend could not load.
 *
 * @returns An error carrying the load or platform reason.
 */
export function darwinKeychainUnavailableError(): Error {
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
export const DarwinKeychain: DarwinKeychainApi = {
  getSecretBytes(service: string, account: string): Uint8Array | null {
    return backend.getSecretBytes(service, account);
  },
  saveSecretBytes(service: string, account: string, secret: Uint8Array): void {
    backend.saveSecretBytes(service, account, secret);
  },
  removeSecret(service: string, account: string): boolean {
    return backend.removeSecret(service, account);
  },
  listSecrets(service: string): SecretRecord[] {
    if (backend.listSecrets === undefined)
      throw new Error("Keychain enumeration is unavailable in this runtime.");
    return backend.listSecrets(service);
  },
};

export {
  DARWIN,
  type DarwinKeychainBackend,
  type GenericPassword,
  KeychainHandle,
  type KeychainRuntime,
  type SecretRecord,
} from "./types.ts";
