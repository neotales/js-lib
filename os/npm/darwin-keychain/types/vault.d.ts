/**
 * macOS keychain vault helpers.
 *
 * @module @neotales/darwin-keychain
 */
import type { SecretRecord } from "./types.js";
/**
 * Returns whether a macOS keychain backend is available in the current runtime.
 *
 * @returns `true` when generic password operations are supported.
 * @example
 * ```ts
 * import { isAvailable } from "@neotales/darwin-keychain";
 *
 * if (isAvailable())
 *   console.log("Keychain is available");
 * ```
 */
export declare function isAvailable(): boolean;
/**
 * Reads a stored secret as raw bytes.
 *
 * @param service Keychain service name.
 * @param account Keychain account name.
 * @returns The stored secret bytes, or `null` when missing.
 * @example
 * ```ts
 * import { getSecret } from "@neotales/darwin-keychain";
 *
 * const secret = getSecret("service", "account");
 * ```
 */
export declare function getSecret(service: string, account: string): Uint8Array | null;
/**
 * Reads and decodes a stored secret.
 *
 * @param service Keychain service name.
 * @param account Keychain account name.
 * @returns The decoded secret string, or `null` when missing.
 * @example
 * ```ts
 * import { getSecretString } from "@neotales/darwin-keychain";
 *
 * const secret = getSecretString("service", "account");
 * ```
 */
export declare function getSecretString(service: string, account: string): string | null;
/**
 * Stores or updates a generic password record.
 *
 * @param service Keychain service name.
 * @param account Keychain account name.
 * @param secret Secret string or bytes.
 * @returns Nothing.
 * @example
 * ```ts
 * import { saveSecret } from "@neotales/darwin-keychain";
 *
 * saveSecret("service", "account", "secret");
 * ```
 */
export declare function saveSecret(service: string, account: string, secret: string | Uint8Array): void;
/**
 * Deletes a generic password record.
 *
 * @param service Keychain service name.
 * @param account Keychain account name.
 * @returns `true` when a record was deleted.
 * @example
 * ```ts
 * import { removeSecret } from "@neotales/darwin-keychain";
 *
 * removeSecret("service", "account");
 * ```
 */
export declare function removeSecret(service: string, account: string): boolean;
/**
 * Lists records for a service when the backend supports enumeration.
 *
 * @param service Keychain service name.
 * @returns Decoded records for the given service.
 * @example
 * ```ts
 * import { listSecrets } from "@neotales/darwin-keychain";
 *
 * const records = listSecrets("service");
 * ```
 */
export declare function listSecrets(service: string): SecretRecord[];
