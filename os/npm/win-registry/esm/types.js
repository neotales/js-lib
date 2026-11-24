/**
 * Shared types, constants, and backend interface for the Windows Registry module.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { RegistryError } from "./registry_error.js";
/**
 * Windows Registry access-rights constants used when opening or creating keys.
 *
 * Combine rights with the bitwise OR operator when needed.
 *
 * @example Usage
 * ```ts
 * import { Registry, Rights } from "@neotales/win-registry";
 *
 * using key = Registry.openKey("HKCU\\Software", Rights.READ | Rights.QUERY_VALUE);
 * console.log(key.getSubKeyNames());
 * ```
 */
export const Rights = {
    /** All access rights combined (`KEY_ALL_ACCESS`). */
    ALL_ACCESS: 0xf003f,
    /** Permission to create a symbolic link (`KEY_CREATE_LINK`). */
    CREATE_LINK: 0x00020,
    /** Permission to create subkeys (`KEY_CREATE_SUB_KEY`). */
    CREATE_SUB_KEY: 0x00004,
    /** Permission to enumerate subkeys (`KEY_ENUMERATE_SUB_KEYS`). */
    ENUMERATE_SUB_KEYS: 0x00008,
    /** Permission to receive change notifications (`KEY_NOTIFY`). */
    NOTIFY: 0x00010,
    /** Permission to query values (`KEY_QUERY_VALUE`). */
    QUERY_VALUE: 0x00001,
    /** Read access combining query, enumerate, and notify rights (`KEY_READ`). */
    READ: 0x20019,
    /** Permission to set values (`KEY_SET_VALUE`). */
    SET_VALUE: 0x00002,
    /** Access through the 32-bit registry view (`KEY_WOW64_32KEY`). */
    WOW64_32KEY: 0x00200,
    /** Access through the 64-bit registry view (`KEY_WOW64_64KEY`). */
    WOW64_64KEY: 0x00100,
    /** Write access combining set-value and create-sub-key rights (`KEY_WRITE`). */
    WRITE: 0x20006,
};
/**
 * Alias of `Rights.READ` for callers that prefer an execute-style name.
 *
 * @example Usage
 * ```ts
 * import { EXECUTE, Registry } from "@neotales/win-registry";
 *
 * using key = Registry.openKey("HKCU\\Software", EXECUTE);
 * ```
 */
export const EXECUTE = Rights.READ;
/**
 * Windows Registry value-type constants used by `getValue()` and `setValue()`.
 *
 * Common JavaScript mappings:
 *
 * | Registry type            | Constant                  | JavaScript type |
 * | ------------------------ | ------------------------- | --------------- |
 * | `REG_SZ`                 | `Types.SZ`                | `string`        |
 * | `REG_EXPAND_SZ`          | `Types.EXPAND_SZ`         | `string`        |
 * | `REG_MULTI_SZ`           | `Types.MULTI_SZ`          | `string[]`      |
 * | `REG_BINARY`             | `Types.BINARY`            | `Uint8Array`    |
 * | `REG_DWORD` (32-bit)     | `Types.DWORD`             | `number`        |
 * | `REG_QWORD` (64-bit)     | `Types.QWORD`             | `bigint`        |
 *
 * @example Usage
 * ```ts
 * import { Registry, Types } from "@neotales/win-registry";
 *
 * using key = Registry.createKey("HKCU\\Software\\MyApp");
 * key.setValue("Flag", new Uint8Array([1, 0, 0, 0]), Types.DWORD);
 * ```
 */
export const Types = {
    /** No defined value type (`REG_NONE`). */
    NONE: 0,
    /** Null-terminated UTF-16 string (`REG_SZ`). */
    SZ: 1,
    /** Null-terminated string with environment-variable references (`REG_EXPAND_SZ`). */
    EXPAND_SZ: 2,
    /** Raw bytes (`REG_BINARY`). */
    BINARY: 3,
    /** Unsigned 32-bit integer, little-endian (`REG_DWORD`). Maps to `number`. */
    DWORD: 4,
    /** Unsigned 32-bit integer, big-endian (`REG_DWORD_BIG_ENDIAN`). */
    DWORD_BIG_ENDIAN: 5,
    /** Symbolic link target (`REG_LINK`). */
    LINK: 6,
    /** List of null-terminated strings terminated by an extra null (`REG_MULTI_SZ`). */
    MULTI_SZ: 7,
    /** Device resource list (`REG_RESOURCE_LIST`). */
    RESOURCE_LIST: 8,
    /** Hardware resource descriptor (`REG_FULL_RESOURCE_DESCRIPTOR`). */
    FULL_RESOURCE_DESCRIPTOR: 9,
    /** Hardware resource requirements (`REG_RESOURCE_REQUIREMENTS_LIST`). */
    RESOURCE_REQUIREMENTS_LIST: 10,
    /** Unsigned 64-bit integer (`REG_QWORD`). Maps to `bigint`. */
    QWORD: 11,
};
/** Predefined `HKEY_CLASSES_ROOT` handle. */
export const HKEY_CLASSES_ROOT = 0x80000000n;
/** Predefined `HKEY_CURRENT_USER` handle. */
export const HKEY_CURRENT_USER = 0x80000001n;
/** Predefined `HKEY_LOCAL_MACHINE` handle. */
export const HKEY_LOCAL_MACHINE = 0x80000002n;
/** Predefined `HKEY_USERS` handle. */
export const HKEY_USERS = 0x80000003n;
/** Predefined `HKEY_PERFORMANCE_DATA` handle. */
export const HKEY_PERFORMANCE_DATA = 0x80000004n;
/** Predefined `HKEY_CURRENT_CONFIG` handle. */
export const HKEY_CURRENT_CONFIG = 0x80000005n;
/** Windows error code for a successful operation (`ERROR_SUCCESS`). */
export const ERROR_SUCCESS = 0;
/** Windows error code indicating the file or key was not found (`ERROR_FILE_NOT_FOUND`). */
export const ERROR_FILE_NOT_FOUND = 2;
/** Windows error code indicating access was denied (`ERROR_ACCESS_DENIED`). */
export const ERROR_ACCESS_DENIED = 5;
/** Windows error code indicating the buffer was too small (`ERROR_MORE_DATA`). */
export const ERROR_MORE_DATA = 234;
/** Windows error code indicating no more items are available (`ERROR_NO_MORE_ITEMS`). */
export const ERROR_NO_MORE_ITEMS = 259;
/**
 * Encodes a string as a null-terminated UTF-16LE buffer.
 *
 * @param str String to encode.
 * @returns A UTF-16LE buffer with a trailing null terminator.
 *
 * @example Usage
 * ```ts
 * import { stringToWide } from "@neotales/win-registry/types";
 *
 * const data = stringToWide("Theme");
 * console.log(data.byteLength); // 12
 * ```
 */
export function stringToWide(str) {
    const buf = new Uint8Array((str.length + 1) * 2);
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        buf[i * 2] = code & 0xff;
        buf[i * 2 + 1] = (code >> 8) & 0xff;
    }
    return buf;
}
/**
 * Decodes UTF-16LE bytes without relying on `TextDecoder`.
 *
 * txiki.js only exposes UTF-8 decoding. This handles code units, surrogate
 * pairs, lone surrogates, and an odd trailing byte with the same replacement
 * behaviour as the standard UTF-16LE decoder.
 *
 * @param buffer The UTF-16LE bytes.
 * @returns The decoded string.
 */
function decodeUtf16Le(buffer) {
    let out = "";
    let chunk = "";
    const len = buffer.length;
    let trailingOdd = len % 2 === 1;
    let i = 0;
    for (; i + 1 < len; i += 2) {
        const code = buffer[i] | (buffer[i + 1] << 8);
        if (code >= 0xd800 && code <= 0xdbff) {
            if (i + 3 < len) {
                const next = buffer[i + 2] | (buffer[i + 3] << 8);
                if (next >= 0xdc00 && next <= 0xdfff) {
                    chunk += String.fromCharCode(code, next);
                    i += 2;
                }
                else {
                    chunk += "\uFFFD";
                }
            }
            else {
                // A high surrogate with no complete following code unit. An odd
                // trailing byte belongs to this malformed sequence, so consume it
                // and emit one replacement, matching TextDecoder.
                chunk += "\uFFFD";
                if (trailingOdd) {
                    trailingOdd = false;
                    i += 1;
                }
            }
        }
        else if (code >= 0xdc00 && code <= 0xdfff) {
            chunk += "\uFFFD";
        }
        else {
            chunk += String.fromCharCode(code);
        }
        if (chunk.length >= 1024) {
            out += chunk;
            chunk = "";
        }
    }
    if (trailingOdd)
        chunk += "\uFFFD";
    return stripBom(out + chunk);
}
/**
 * Removes one leading UTF-16LE byte-order mark.
 *
 * @param value The decoded string.
 * @returns The string without a leading BOM.
 */
function stripBom(value) {
    return value.startsWith("\uFEFF") ? value.slice(1) : value;
}
/**
 * Decodes a UTF-16LE registry string buffer.
 *
 * @param buffer The UTF-16LE buffer.
 * @param byteLength Optional byte length to decode.
 * @returns The decoded string up to the first null terminator.
 *
 * @example Usage
 * ```ts
 * import { stringToWide, wideToString } from "@neotales/win-registry/types";
 *
 * const value = wideToString(stringToWide("Theme"));
 * console.log(value); // "Theme"
 * ```
 */
export function wideToString(buffer, byteLength) {
    const len = Math.min(byteLength ?? buffer.length, buffer.length);
    let end = len;
    for (let i = 0; i < len - 1; i += 2) {
        if (buffer[i] === 0 && buffer[i + 1] === 0) {
            end = i;
            break;
        }
    }
    return decodeUtf16Le(buffer.subarray(0, end));
}
/**
 * Decodes a UTF-16LE `REG_MULTI_SZ` buffer.
 *
 * @param buffer The UTF-16LE buffer.
 * @param byteLength Optional byte length to decode.
 * @returns The decoded string list.
 *
 * @example Usage
 * ```ts
 * import { multiStringToWide, wideToMultiString } from "@neotales/win-registry/types";
 *
 * const values = wideToMultiString(multiStringToWide(["one", "two"]));
 * console.log(values); // ["one", "two"]
 * ```
 */
export function wideToMultiString(buffer, byteLength) {
    const result = [];
    const len = Math.min(byteLength ?? buffer.length, buffer.length);
    let start = 0;
    let terminated = false;
    for (let i = 0; i < len - 1; i += 2) {
        if (buffer[i] === 0 && buffer[i + 1] === 0) {
            if (i === start) {
                terminated = true;
                break;
            }
            result.push(decodeUtf16Le(buffer.subarray(start, i)));
            start = i + 2;
        }
    }
    // Windows data is not guaranteed to include the final empty terminator.
    // Keep the trailing entry, including an odd trailing byte.
    if (!terminated && start < len) {
        result.push(decodeUtf16Le(buffer.subarray(start, len)));
    }
    return result;
}
/**
 * Encodes an array of strings as a null-terminated UTF-16LE `REG_MULTI_SZ`
 * buffer.
 *
 * @param arr Strings to encode.
 * @returns The encoded multi-string buffer.
 *
 * @example Usage
 * ```ts
 * import { multiStringToWide } from "@neotales/win-registry/types";
 *
 * const data = multiStringToWide(["one", "two"]);
 * console.log(data.byteLength);
 * ```
 */
export function multiStringToWide(arr) {
    if (arr.length === 0) {
        return new Uint8Array([0, 0, 0, 0]);
    }
    let totalChars = 0;
    for (const s of arr) {
        totalChars += s.length + 1;
    }
    totalChars += 1;
    const buf = new Uint8Array(totalChars * 2);
    let offset = 0;
    for (const s of arr) {
        for (let i = 0; i < s.length; i++) {
            const code = s.charCodeAt(i);
            buf[offset] = code & 0xff;
            buf[offset + 1] = (code >> 8) & 0xff;
            offset += 2;
        }
        buf[offset] = 0;
        buf[offset + 1] = 0;
        offset += 2;
    }
    buf[offset] = 0;
    buf[offset + 1] = 0;
    return buf;
}
/**
 * Parses a registry path into a predefined root handle and subkey path.
 *
 * @example Usage
 * ```ts
 * import { parseRegistryPath } from "@neotales/win-registry/types";
 *
 * const parsed = parseRegistryPath("HKCU\\Software\\MyApp");
 * ```
 *
 * @param path Registry path beginning with a known root such as `HKCU` or `HKEY_LOCAL_MACHINE`.
 * @returns The parsed root handle and subkey.
 * @throws Error If the registry root is unknown.
 */
export function parseRegistryPath(path) {
    const sep = path.indexOf("\\");
    const root = sep === -1 ? path : path.slice(0, sep);
    const subKey = sep === -1 ? "" : path.slice(sep + 1);
    switch (root.toUpperCase()) {
        case "HKEY_CLASSES_ROOT":
        case "HKCR":
            return { hkey: HKEY_CLASSES_ROOT, subKey };
        case "HKEY_CURRENT_USER":
        case "HKCU":
            return { hkey: HKEY_CURRENT_USER, subKey };
        case "HKEY_LOCAL_MACHINE":
        case "HKLM":
            return { hkey: HKEY_LOCAL_MACHINE, subKey };
        case "HKEY_USERS":
        case "HKU":
            return { hkey: HKEY_USERS, subKey };
        case "HKEY_PERFORMANCE_DATA":
        case "HKPD":
            return { hkey: HKEY_PERFORMANCE_DATA, subKey };
        case "HKEY_CURRENT_CONFIG":
        case "HKCC":
            return { hkey: HKEY_CURRENT_CONFIG, subKey };
        default:
            throw new RegistryError(`Unknown registry root key: ${root}`);
    }
}
