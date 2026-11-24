import type { SecretRecord } from "./types.js";
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
export declare function isAvailable(): boolean;
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
export declare function getSecret(service: string, account: string): Uint8Array | null;
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
export declare function getSecretString(service: string, account: string): string | null;
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
export declare function saveSecret(service: string, account: string, secret: string | Uint8Array): void;
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
export declare function listSecrets(service: string): SecretRecord[];
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
export declare function removeSecret(service: string, account: string): boolean;
export type { SecretRecord } from "./types.js";
