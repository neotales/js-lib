/** Native Windows Credential Manager types and helpers. @module @neotales/win-cred/ffi */
/** Windows Credential Manager credential types. */
export var CredType;
(function (CredType) {
    /** Generic application credential. */
    CredType[CredType["GENERIC"] = 1] = "GENERIC";
    /** Domain password credential. */
    CredType[CredType["DOMAIN_PASSWORD"] = 2] = "DOMAIN_PASSWORD";
    /** Domain certificate credential. */
    CredType[CredType["DOMAIN_CERTIFICATE"] = 3] = "DOMAIN_CERTIFICATE";
    /** Domain credential visible to the user. */
    CredType[CredType["DOMAIN_VISIBLE_PASSWORD"] = 4] = "DOMAIN_VISIBLE_PASSWORD";
    /** Generic certificate credential. */
    CredType[CredType["GENERIC_CERTIFICATE"] = 5] = "GENERIC_CERTIFICATE";
    /** Extended domain credential. */
    CredType[CredType["DOMAIN_EXTENDED"] = 6] = "DOMAIN_EXTENDED";
    /** Highest defined standard credential type. */
    CredType[CredType["MAXIMUM"] = 7] = "MAXIMUM";
    /** Reserved range beginning after standard types. */
    CredType[CredType["MAXIMUM_EX"] = 1007] = "MAXIMUM_EX";
})(CredType || (CredType = {}));
/** Credential persistence scopes. */
export var CredPersist;
(function (CredPersist) {
    /** Retain the credential for the current logon session only. */
    CredPersist[CredPersist["SESSION"] = 1] = "SESSION";
    /** Retain the credential on the local computer. */
    CredPersist[CredPersist["LOCAL_MACHINE"] = 2] = "LOCAL_MACHINE";
    /** Retain the credential for the user across domain computers. */
    CredPersist[CredPersist["ENTERPRISE"] = 3] = "ENTERPRISE";
})(CredPersist || (CredPersist = {}));
/** Flags accepted by Credential Manager writes. */
export var CredWriteFlags;
(function (CredWriteFlags) {
    /** Write all supplied fields. */
    CredWriteFlags[CredWriteFlags["NONE"] = 0] = "NONE";
    /** Preserve the existing credential blob. */
    CredWriteFlags[CredWriteFlags["PRESERVE_CREDENTIAL_BLOB"] = 1] = "PRESERVE_CREDENTIAL_BLOB";
})(CredWriteFlags || (CredWriteFlags = {}));
/** Flags accepted by Credential Manager enumeration. */
export var CredEnumerateFlags;
(function (CredEnumerateFlags) {
    /** Interpret the filter as a target-name pattern. */
    CredEnumerateFlags[CredEnumerateFlags["NONE"] = 0] = "NONE";
    /** Enumerate every credential, ignoring the filter. */
    CredEnumerateFlags[CredEnumerateFlags["ALL_CREDENTIALS"] = 1] = "ALL_CREDENTIALS";
})(CredEnumerateFlags || (CredEnumerateFlags = {}));
/** Whether the current runtime is Windows. */
export const WINDOWS = (typeof globalThis.Deno !== "undefined" && Deno.build.os === "windows") ||
    (typeof globalThis.process !== "undefined" && process.platform === "win32") ||
    globalThis
        .navigator?.userAgentData?.platform === "Windows";
/**
 * Encodes a string as a null-terminated UTF-16LE buffer.
 * @param value String to encode.
 * @returns Null-terminated UTF-16LE bytes.
 * @example
 * ```ts
 * import { stringToWide } from "@neotales/win-cred/ffi";
 *
 * const buffer = stringToWide("credential");
 * ```
 */
export function stringToWide(value) {
    const buffer = new Uint8Array((value.length + 1) * 2);
    for (let index = 0; index < value.length; index++) {
        const code = value.charCodeAt(index);
        buffer[index * 2] = code & 0xff;
        buffer[index * 2 + 1] = code >> 8;
    }
    return buffer;
}
/**
 * Decodes UTF-16LE bytes through their first null terminator.
 * @param buffer UTF-16LE bytes.
 * @param byteLength Optional number of bytes to inspect.
 * @returns Decoded string.
 * @example
 * ```ts
 * import { stringToWide, wideToString } from "@neotales/win-cred/ffi";
 *
 * console.log(wideToString(stringToWide("credential")));
 * ```
 */
export function wideToString(buffer, byteLength = buffer.length) {
    let end = byteLength;
    for (let index = 0; index < byteLength - 1; index += 2) {
        if (buffer[index] === 0 && buffer[index + 1] === 0) {
            end = index;
            break;
        }
    }
    return new TextDecoder("utf-16le").decode(buffer.subarray(0, end));
}
