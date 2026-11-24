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
import "./_dnt.polyfills.js";
export { getSecret, getSecretString, isAvailable, listSecrets, removeSecret, saveSecret, } from "./vault.js";
