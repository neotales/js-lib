/**
 * Shared keychain types.
 *
 * @module @neotales/darwin-keychain/ffi
 */

/**
 * Secret record returned by keychain listing operations.
 *
 * @example
 * ```ts
 * import type { SecretRecord } from "@neotales/darwin-keychain";
 *
 * const record: SecretRecord = { service: "service", account: "account", secret: new Uint8Array() };
 * ```
 */
export interface SecretRecord {
  /** Keychain service name. */
  service: string;
  /** Keychain account name. */
  account: string;
  /** Opaque secret bytes. */
  secret: Uint8Array;
}

/**
 * Runtime that owns a native Keychain reference.
 *
 * @example
 * ```ts
 * import type { KeychainRuntime } from "@neotales/darwin-keychain/ffi";
 *
 * const runtime: KeychainRuntime = "deno";
 * ```
 */
export type KeychainRuntime = "deno" | "node" | "bun" | "tjs" | "koffi";

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
  #pointer: unknown;

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
  constructor(
    readonly runtime: KeychainRuntime,
    pointer: unknown,
  ) {
    this.#pointer = pointer;
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
  valueOf(): unknown {
    return this.#pointer;
  }
}

/**
 * Generic-password lookup result with an owned item reference.
 *
 * @example
 * ```ts
 * import type { GenericPassword } from "@neotales/darwin-keychain/ffi";
 *
 * const password: GenericPassword | null = null;
 * ```
 */
export interface GenericPassword {
  /** Item reference; release it with `Keychain.CFRelease`. */
  item: KeychainHandle;
  /** Copied generic-password bytes. */
  secret: Uint8Array;
}

/**
 * Runtime-specific generic-password backend contract.
 *
 * @example
 * ```ts
 * import type { DarwinKeychainBackend } from "@neotales/darwin-keychain/ffi";
 *
 * const backend: DarwinKeychainBackend | undefined = undefined;
 * ```
 */
export interface DarwinKeychainBackend {
  /**
   * Reads a generic-password secret as bytes.
   *
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
   * Creates or updates a generic-password secret.
   *
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
   * Removes a generic-password secret.
   *
   * @param service Keychain service name.
   * @param account Keychain account name.
   * @returns `true` when an item was removed.
   * @example
   * ```ts
   * import { DarwinKeychain } from "@neotales/darwin-keychain/ffi";
   *
   * DarwinKeychain.removeSecret("service", "account");
   * ```
   */
  removeSecret(service: string, account: string): boolean;
  /**
   * Lists generic-password secrets for a service.
   *
   * @param service Keychain service name.
   * @returns Matching secret records.
   * @example
   * ```ts
   * import { DarwinKeychain } from "@neotales/darwin-keychain/ffi";
   *
   * const records = DarwinKeychain.listSecrets("service");
   * ```
   */
  listSecrets?: (service: string) => SecretRecord[];
}

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
export const DARWIN: boolean = (typeof globalThis.process !== "undefined" &&
  globalThis.process.platform === "darwin") ||
  (typeof globalThis.Deno !== "undefined" && globalThis.Deno.build.os === "darwin") ||
  (globalThis as { navigator?: { platform?: string; userAgentData?: { platform?: string } } })
      .navigator?.platform === "MacIntel" ||
  (globalThis as { navigator?: { userAgentData?: { platform?: string } } })
      .navigator?.userAgentData?.platform === "macOS";
