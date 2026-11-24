/**
 * macOS keychain vault helpers.
 *
 * @module @neotales/darwin-keychain
 */

import {
  DarwinKeychain,
  darwinKeychainUnavailableError,
  isDarwinKeychainAvailable,
} from "./ffi.ts";
import type { SecretRecord } from "./types.ts";


function validatePart(name: string, value: string): void {
  if (!value)
    throw new RangeError(`${name} must not be empty.`);
}

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
export function isAvailable(): boolean {
  return isDarwinKeychainAvailable();
}

function ensureAvailable(): void {
  if (!isDarwinKeychainAvailable()) throw darwinKeychainUnavailableError();
}

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
export function getSecret(service: string, account: string): Uint8Array | null {
  validatePart("service", service);
  validatePart("account", account);
  ensureAvailable();
  return DarwinKeychain.getSecretBytes(service, account);
}

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
export function getSecretString(service: string, account: string): string | null {
  const secret = getSecret(service, account);
  return secret === null ? null : new TextDecoder().decode(secret);
}

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
export function saveSecret(service: string, account: string, secret: string | Uint8Array): void {
  validatePart("service", service);
  validatePart("account", account);
  ensureAvailable();
  DarwinKeychain.saveSecretBytes(
    service,
    account,
    typeof secret === "string" ? new TextEncoder().encode(secret) : secret,
  );
}

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
export function removeSecret(service: string, account: string): boolean {
  validatePart("service", service);
  validatePart("account", account);
  ensureAvailable();
  return DarwinKeychain.removeSecret(service, account);
}

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
export function listSecrets(service: string): SecretRecord[] {
  validatePart("service", service);
  ensureAvailable();
  return DarwinKeychain.listSecrets(service);
}
