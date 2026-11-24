/** Linux libsecret vault helpers. @module @neotales/linux-libsecret */
import { isLinuxKeyringAvailable, Libsecret, LibsecretErrorHandle, linuxLibsecretUnavailableError, listSecretRecords, } from "./ffi.js";
import { assertText, decodeSecretText, decodeUtf8 } from "./encoding.js";
let schema = null;
function validatePart(name, value) {
    if (!value)
        throw new RangeError(`${name} must not be empty.`);
    assertText(name, value);
}
function getSchema() {
    if (schema !== null)
        return schema;
    const terminator = null;
    const value = Libsecret.secretSchemaNew("org.freedesktop.Secret.Generic", 0, "service", 0, "account", 0, terminator);
    if (value === null)
        throw new Error("Failed to create libsecret schema.");
    schema = value;
    return value;
}
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
export function isAvailable() {
    return isLinuxKeyringAvailable();
}
function ensureAvailable() {
    if (!isLinuxKeyringAvailable())
        throw linuxLibsecretUnavailableError();
}
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
export function getSecret(service, account) {
    validatePart("service", service);
    validatePart("account", account);
    ensureAvailable();
    const cancellable = null;
    const terminator = null;
    const errorOut = new LibsecretErrorHandle();
    const password = Libsecret.secretPasswordLookupSync(getSchema(), cancellable, errorOut, "service", service, "account", account, terminator);
    const error = errorOut.error();
    if (error !== null)
        throw error;
    if (password === null)
        return null;
    try {
        return new TextEncoder().encode(password.text());
    }
    finally {
        Libsecret.secretPasswordFree(password);
    }
}
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
export function getSecretString(service, account) {
    const secret = getSecret(service, account);
    return secret === null ? null : decodeUtf8(secret, "secret");
}
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
export function saveSecret(service, account, secret) {
    validatePart("service", service);
    validatePart("account", account);
    let password;
    if (typeof secret === "string") {
        assertText("secret", secret);
        password = secret;
    }
    else {
        password = decodeSecretText(secret);
    }
    ensureAvailable();
    const cancellable = null;
    const terminator = null;
    const errorOut = new LibsecretErrorHandle();
    const stored = Libsecret.secretPasswordStoreSync(getSchema(), "default", `${service}/${account}`, password, cancellable, errorOut, "service", service, "account", account, terminator);
    const error = errorOut.error();
    if (error !== null)
        throw error;
    if (!stored)
        throw new Error("Failed to store secret.");
}
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
export function removeSecret(service, account) {
    validatePart("service", service);
    validatePart("account", account);
    ensureAvailable();
    const cancellable = null;
    const terminator = null;
    const errorOut = new LibsecretErrorHandle();
    const cleared = Libsecret.secretPasswordClearSync(getSchema(), cancellable, errorOut, "service", service, "account", account, terminator);
    const error = errorOut.error();
    if (error !== null)
        throw error;
    return cleared;
}
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
export function listSecrets(service) {
    validatePart("service", service);
    ensureAvailable();
    return listSecretRecords(service);
}
