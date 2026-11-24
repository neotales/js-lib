import type { RawCredential, SecretRecord, WinCredentials } from "./types.ts";
import { CredEnumerateFlags, CredPersist, CredType, CredWriteFlags } from "./types.ts";
import {
  isWinCredAvailable,
  WinCred as nativeWinCred,
  winCredUnavailableError,
} from "./ffi.ts";

const targetPrefix = "neotales:win-cred:v1:";

function ensureAvailable(): void {
  if (!isWinCredAvailable()) throw winCredUnavailableError();
}

function validatePart(name: string, value: string): void {
  if (!value)
    throw new RangeError(`${name} must not be empty.`);
}

function encodePart(value: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(value))
    binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodePart(value: string): string | null {
  try {
    const binary = atob(
      value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "="),
    );
    return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch {
    return null;
  }
}

function targetName(service: string, account: string): string {
  validatePart("service", service);
  validatePart("account", account);
  return `${targetPrefix}${encodePart(service)}:${encodePart(account)}`;
}

function recordFromCredential(credential: RawCredential): SecretRecord | null {
  if (!credential.targetName.startsWith(targetPrefix))
    return null;
  const [servicePart, accountPart, extra] = credential.targetName.slice(targetPrefix.length).split(
    ":",
  );
  if (!servicePart || !accountPart || extra !== undefined)
    return null;
  const service = decodePart(servicePart);
  const account = decodePart(accountPart);
  return service === null || account === null
    ? null
    : { service, account, secret: credential.credentialBlob };
}

/**
 * Reports whether a Credential Manager backend is available.
 * @returns `true` when secret operations can run.
 * @example
 * ```ts
 * import { isAvailable } from "@neotales/win-cred";
 *
 * console.log(isAvailable());
 * ```
 */
export function isAvailable(): boolean {
  return isWinCredAvailable();
}

/**
 * Reads an opaque secret as bytes.
 * @param service Service namespace.
 * @param account Account identifier.
 * @returns Secret bytes, or `null` when missing.
 * @throws {RangeError} If service or account is empty.
 * @throws {Error} If Windows FFI is unavailable.
 * @example
 * ```ts
 * import { getSecret } from "@neotales/win-cred";
 *
 * const secret = getSecret("service", "account");
 * ```
 */
export function getSecret(service: string, account: string): Uint8Array | null {
  validatePart("service", service);
  validatePart("account", account);
  ensureAvailable();
  return nativeWinCred.read(targetName(service, account), CredType.GENERIC)?.credentialBlob ?? null;
}

/**
 * Reads a UTF-8 secret string.
 * @param service Service namespace.
 * @param account Account identifier.
 * @returns Decoded secret, or `null` when missing.
 * @throws {RangeError} If service or account is empty.
 * @throws {Error} If Windows FFI is unavailable.
 * @example
 * ```ts
 * import { getSecretString } from "@neotales/win-cred";
 *
 * const secret = getSecretString("service", "account");
 * ```
 */
export function getSecretString(service: string, account: string): string | null {
  const secret = getSecret(service, account);
  return secret === null ? null : new TextDecoder().decode(secret);
}

/**
 * Saves a UTF-8 string or opaque byte secret.
 * @param service Service namespace.
 * @param account Account identifier.
 * @param secret UTF-8 string or bytes to persist.
 * @returns Nothing.
 * @throws {RangeError} If service or account is empty.
 * @throws {Error} If Windows rejects the write or FFI is unavailable.
 * @example
 * ```ts
 * import { saveSecret } from "@neotales/win-cred";
 *
 * saveSecret("service", "account", "secret");
 * ```
 */
export function saveSecret(service: string, account: string, secret: string | Uint8Array): void {
  validatePart("service", service);
  validatePart("account", account);
  ensureAvailable();
  const credentialBlob = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  nativeWinCred.write({
    flags: 0,
    type: CredType.GENERIC,
    targetName: targetName(service, account),
    comment: "",
    lastWritten: 0n,
    credentialBlobSize: credentialBlob.length,
    credentialBlob,
    persist: CredPersist.LOCAL_MACHINE,
    attributeCount: 0,
    targetAlias: "",
    userName: account,
  }, CredWriteFlags.NONE);
}

/**
 * Lists secrets belonging to a service.
 * @param service Service namespace.
 * @returns Service records with opaque secret bytes.
 * @throws {RangeError} If service is empty.
 * @throws {Error} If Windows FFI is unavailable.
 * @example
 * ```ts
 * import { listSecrets } from "@neotales/win-cred";
 *
 * const secrets = listSecrets("service");
 * ```
 */
export function listSecrets(service: string): SecretRecord[] {
  validatePart("service", service);
  ensureAvailable();
  return nativeWinCred.enumerate(`${targetPrefix}${encodePart(service)}:*`, CredEnumerateFlags.NONE).map(
    recordFromCredential,
  ).filter((record): record is SecretRecord => record !== null);
}

/**
 * Removes a secret.
 * @param service Service namespace.
 * @param account Account identifier.
 * @returns Whether a stored secret was removed.
 * @throws {RangeError} If service or account is empty.
 * @throws {Error} If Windows FFI is unavailable.
 * @example
 * ```ts
 * import { removeSecret } from "@neotales/win-cred";
 *
 * removeSecret("service", "account");
 * ```
 */
export function removeSecret(service: string, account: string): boolean {
  validatePart("service", service);
  validatePart("account", account);
  ensureAvailable();
  return nativeWinCred.delete(targetName(service, account), CredType.GENERIC);
}

export type { SecretRecord } from "./types.ts";
