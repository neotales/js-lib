/**
 * macOS keychain helpers for generic passwords.
 *
 * @example Usage
 * ```ts
 * import { getSecretString, isAvailable, saveSecret } from "@neotales/darwin-keychain";
 *
 * if (isAvailable()) {
 *   saveSecret("my-service", "my-account", "my-secret");
 *   console.log(getSecretString("my-service", "my-account"));
 * }
 * ```
 *
 * @module
 */
import "./_dnt.polyfills.js";
export { getSecret, getSecretString, isAvailable, listSecrets, removeSecret, saveSecret, } from "./vault.js";
export type { SecretRecord } from "./types.js";
