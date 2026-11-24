/** Linux libsecret vault helpers. @module @neotales/linux-libsecret */
import type { SecretRecord } from "./types.js";
/**
 * Returns whether libsecret is available in the current runtime.
 *
 * @returns `true` when Linux keyring operations are supported.
 * @example
 * ```ts
 * import { isAvailable } from "@neotales/linux-libsecret";
 *
 * if (isAvailable()) console.log("Linux keyring is available");
 * ```
 */
export declare function isAvailable(): boolean;
/**
 * Reads a stored secret as raw bytes.
 *
 * @param service Keyring service name.
 * @param account Keyring account name.
 * @returns Stored secret bytes, or `null` when missing.
 * @example
 * ```ts
 * import { getSecret } from "@neotales/linux-libsecret";
 *
 * const secret = getSecret("service", "account");
 * ```
 */
export declare function getSecret(service: string, account: string): Uint8Array | null;
/**
 * Reads and decodes a stored secret.
 *
 * @param service Keyring service name.
 * @param account Keyring account name.
 * @returns Decoded secret text, or `null` when missing.
 * @example
 * ```ts
 * import { getSecretString } from "@neotales/linux-libsecret";
 *
 * const secret = getSecretString("service", "account");
 * ```
 */
export declare function getSecretString(service: string, account: string): string | null;
/**
 * Stores or updates a generic libsecret record.
 *
 * @param service Keyring service name.
 * @param account Keyring account name.
 * @param secret Secret text or bytes.
 * @returns Nothing.
 * @example
 * ```ts
 * import { saveSecret } from "@neotales/linux-libsecret";
 *
 * saveSecret("service", "account", "secret");
 * ```
 */
export declare function saveSecret(service: string, account: string, secret: string | Uint8Array): void;
/**
 * Deletes a generic libsecret record.
 *
 * @param service Keyring service name.
 * @param account Keyring account name.
 * @returns `true` when a record was deleted.
 * @example
 * ```ts
 * import { removeSecret } from "@neotales/linux-libsecret";
 *
 * removeSecret("service", "account");
 * ```
 */
export declare function removeSecret(service: string, account: string): boolean;
/**
 * Lists records for a keyring service.
 *
 * @param service Keyring service name.
 * @returns Matching records with copied secret bytes.
 * @example
 * ```ts
 * import { listSecrets } from "@neotales/linux-libsecret";
 *
 * const records = listSecrets("service");
 * ```
 */
export declare function listSecrets(service: string): SecretRecord[];
