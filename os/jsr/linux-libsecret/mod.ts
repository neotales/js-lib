/**
 * Linux libsecret helpers for generic secret records.
 *
 * @example Usage
 * ```ts
 * import { getSecretString, isAvailable, saveSecret } from "@neotales/linux-libsecret";
 *
 * if (isAvailable()) {
 *   saveSecret("my-service", "my-account", "my-secret");
 *   console.log(getSecretString("my-service", "my-account"));
 * }
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
} from "./vault.ts";
export type { SecretRecord } from "./types.ts";
