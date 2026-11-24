/**
 * Windows Credential Manager secret storage.
 *
 * @example Usage
 * ```ts
 * import { getSecretString, saveSecret } from "@neotales/win-cred";
 *
 * saveSecret("myapp", "token", "secret");
 * console.log(getSecretString("myapp", "token"));
 * ```
 *
 * @module
 */

export {
  getSecret,
  getSecretString,
  isAvailable,
  listSecrets,
  removeSecret,
  saveSecret,
  type SecretRecord,
} from "./vault.ts";
