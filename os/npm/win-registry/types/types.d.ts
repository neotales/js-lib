/**
 * Shared types, constants, and backend interface for the Windows Registry module.
 *
 * @module
 */
import "./_dnt.polyfills.js";
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
export declare const Rights: {
    /** All access rights combined (`KEY_ALL_ACCESS`). */
    readonly ALL_ACCESS: 983103;
    /** Permission to create a symbolic link (`KEY_CREATE_LINK`). */
    readonly CREATE_LINK: 32;
    /** Permission to create subkeys (`KEY_CREATE_SUB_KEY`). */
    readonly CREATE_SUB_KEY: 4;
    /** Permission to enumerate subkeys (`KEY_ENUMERATE_SUB_KEYS`). */
    readonly ENUMERATE_SUB_KEYS: 8;
    /** Permission to receive change notifications (`KEY_NOTIFY`). */
    readonly NOTIFY: 16;
    /** Permission to query values (`KEY_QUERY_VALUE`). */
    readonly QUERY_VALUE: 1;
    /** Read access combining query, enumerate, and notify rights (`KEY_READ`). */
    readonly READ: 131097;
    /** Permission to set values (`KEY_SET_VALUE`). */
    readonly SET_VALUE: 2;
    /** Access through the 32-bit registry view (`KEY_WOW64_32KEY`). */
    readonly WOW64_32KEY: 512;
    /** Access through the 64-bit registry view (`KEY_WOW64_64KEY`). */
    readonly WOW64_64KEY: 256;
    /** Write access combining set-value and create-sub-key rights (`KEY_WRITE`). */
    readonly WRITE: 131078;
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
export declare const EXECUTE: number;
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
export declare const Types: {
    /** No defined value type (`REG_NONE`). */
    readonly NONE: 0;
    /** Null-terminated UTF-16 string (`REG_SZ`). */
    readonly SZ: 1;
    /** Null-terminated string with environment-variable references (`REG_EXPAND_SZ`). */
    readonly EXPAND_SZ: 2;
    /** Raw bytes (`REG_BINARY`). */
    readonly BINARY: 3;
    /** Unsigned 32-bit integer, little-endian (`REG_DWORD`). Maps to `number`. */
    readonly DWORD: 4;
    /** Unsigned 32-bit integer, big-endian (`REG_DWORD_BIG_ENDIAN`). */
    readonly DWORD_BIG_ENDIAN: 5;
    /** Symbolic link target (`REG_LINK`). */
    readonly LINK: 6;
    /** List of null-terminated strings terminated by an extra null (`REG_MULTI_SZ`). */
    readonly MULTI_SZ: 7;
    /** Device resource list (`REG_RESOURCE_LIST`). */
    readonly RESOURCE_LIST: 8;
    /** Hardware resource descriptor (`REG_FULL_RESOURCE_DESCRIPTOR`). */
    readonly FULL_RESOURCE_DESCRIPTOR: 9;
    /** Hardware resource requirements (`REG_RESOURCE_REQUIREMENTS_LIST`). */
    readonly RESOURCE_REQUIREMENTS_LIST: 10;
    /** Unsigned 64-bit integer (`REG_QWORD`). Maps to `bigint`. */
    readonly QWORD: 11;
};
/**
 * Summary information about a registry key.
 *
 * @example Usage
 * ```ts
 * import { type KeyInfo, Registry } from "@neotales/win-registry";
 *
 * using key = Registry.openKey("HKCU\\Software");
 * const info: KeyInfo = key.stat();
 * console.log(info.subKeyCount, info.valueCount);
 * ```
 */
export interface KeyInfo {
    /** Number of direct subkeys. */
    subKeyCount: number;
    /** Length in characters of the longest subkey name. */
    maxSubKeyLength: number;
    /** Number of values stored under the key. */
    valueCount: number;
    /** Length in characters of the longest value name. */
    maxValueNameLength: number;
    /** Size in bytes of the largest stored value. */
    maxValueLength: number;
    /** Time of the last write to the key as a Windows file time, when available. */
    lastWriteTime?: number;
}
/**
 * Public registry key contract used by `Registry` and `RegistryKey`. Opened and created keys own a native handle.
 *
 * @example Usage
 * ```ts
 * import { type Key, Registry } from "@neotales/win-registry";
 *
 * using key: Key = Registry.createKey("HKCU\\Software\\Example");
 * key.setString("Theme", "dark");
 * console.log(key.getString("Theme"));
 * ```
 */
export interface Key {
    /**
     * Checks whether the underlying native handle is null.
     *
     * @returns `true` when the key does not reference a valid native handle.
     */
    isNull(): boolean;
    /**
     * Returns the underlying native handle.
     *
     * @returns The native registry key handle.
     */
    unwrap(): unknown;
    /** The full registry path of this key. */
    readonly path: string;
    /** Whether the key was newly created rather than opened. */
    readonly created: boolean;
    /**
     * Closes the key and releases its native handle.
     */
    close(): void;
    /**
     * Opens a child key relative to this key.
     *
     * @param path The relative child key path.
     * @param access The requested access rights. Defaults to `Rights.READ`.
     * @returns The opened child key.
     */
    openKey(path: string, access?: number): Key;
    /**
     * Creates a child key relative to this key, or opens it when it exists.
     *
     * @param path The relative child key path.
     * @param access The requested access rights. Defaults to `Rights.ALL_ACCESS`.
     * @returns The created or opened child key.
     */
    createKey(path: string, access?: number): Key;
    /**
     * Deletes a child key of this key.
     *
     * @param name The name of the child key to delete.
     * @returns `true` on success, `false` on failure.
     */
    deleteKey(name: string): boolean;
    /**
     * Deletes a value from this key.
     *
     * @param name The name of the value to delete.
     * @returns `true` on success, `false` on failure.
     */
    deleteValue(name: string): boolean;
    /**
     * Enumerates the names of all subkeys of this key.
     *
     * @param n Optional maximum number of names to return.
     * @returns An array of subkey names.
     */
    getSubKeyNames(n?: number): string[];
    /**
     * Enumerates the names of all values stored under this key.
     *
     * @param n Optional maximum number of names to return.
     * @returns An array of value names.
     */
    getValueNames(n?: number): string[];
    /**
     * Reads a raw value together with its registry type.
     *
     * @param name The name of the value to read.
     * @param buffer Optional buffer to receive the data instead of allocating.
     * @returns The raw data and its {@linkcode Types} constant.
     */
    getValue(name: string, buffer?: Uint8Array): {
        data: Uint8Array;
        type: number;
    };
    /**
     * Reads a `REG_SZ` or `REG_EXPAND_SZ` value as a string.
     *
     * @param name The name of the value to read.
     * @returns The decoded string value.
     */
    getString(name: string): string;
    /**
     * Reads a `REG_MULTI_SZ` value as an array of strings.
     *
     * @param name The name of the value to read.
     * @returns The decoded string list.
     */
    getMultiString(name: string): string[];
    /**
     * Reads a `REG_DWORD` (32-bit) value as a number.
     *
     * @param name The name of the value to read.
     * @returns The 32-bit value.
     */
    getInt32(name: string): number;
    /**
     * Reads a `REG_QWORD` (64-bit) value as a bigint.
     *
     * @param name The name of the value to read.
     * @returns The 64-bit value.
     */
    getInt64(name: string): bigint;
    /**
     * Reads a `REG_BINARY` value as a byte array.
     *
     * @param name The name of the value to read.
     * @returns The raw bytes of the value.
     */
    getBinary(name: string): Uint8Array;
    /**
     * Writes raw value data with an explicit {@linkcode Types} constant.
     *
     * @param name The name of the value to write.
     * @param data The encoded value data.
     * @param type The registry value type.
     */
    setValue(name: string, data: Uint8Array, type: number): void;
    /**
     * Writes an array of strings as a `REG_MULTI_SZ` value.
     *
     * @param name The name of the value to write.
     * @param value The list of strings.
     */
    setMultiString(name: string, value: string[]): void;
    /**
     * Writes raw bytes as a `REG_BINARY` value.
     *
     * @param name The name of the value to write.
     * @param data The bytes to write.
     */
    setBinary(name: string, data: Uint8Array): void;
    /**
     * Writes a string as a `REG_SZ` value.
     *
     * @param name The name of the value to write.
     * @param value The string value.
     */
    setString(name: string, value: string): void;
    /**
     * Writes an expandable string such as `%USERPROFILE%` as a `REG_EXPAND_SZ`
     * value.
     *
     * @param name The name of the value to write.
     * @param value The unexpanded string value.
     */
    setExpandString(name: string, value: string): void;
    /**
     * Writes a 32-bit integer as a `REG_DWORD` value.
     *
     * @param name The name of the value to write.
     * @param value The 32-bit integer value.
     */
    setInt32(name: string, value: number): void;
    /**
     * Writes a 64-bit integer as a `REG_QWORD` value.
     *
     * @param name The name of the value to write.
     * @param value The 64-bit integer value.
     */
    setInt64(name: string, value: bigint): void;
    /**
     * Returns summary information about this key.
     *
     * @returns Key statistics as a {@linkcode KeyInfo} object.
     */
    stat(): KeyInfo;
}
/** Predefined `HKEY_CLASSES_ROOT` handle. */
export declare const HKEY_CLASSES_ROOT = 2147483648n;
/** Predefined `HKEY_CURRENT_USER` handle. */
export declare const HKEY_CURRENT_USER = 2147483649n;
/** Predefined `HKEY_LOCAL_MACHINE` handle. */
export declare const HKEY_LOCAL_MACHINE = 2147483650n;
/** Predefined `HKEY_USERS` handle. */
export declare const HKEY_USERS = 2147483651n;
/** Predefined `HKEY_PERFORMANCE_DATA` handle. */
export declare const HKEY_PERFORMANCE_DATA = 2147483652n;
/** Predefined `HKEY_CURRENT_CONFIG` handle. */
export declare const HKEY_CURRENT_CONFIG = 2147483653n;
/** Windows error code for a successful operation (`ERROR_SUCCESS`). */
export declare const ERROR_SUCCESS = 0;
/** Windows error code indicating the file or key was not found (`ERROR_FILE_NOT_FOUND`). */
export declare const ERROR_FILE_NOT_FOUND = 2;
/** Windows error code indicating access was denied (`ERROR_ACCESS_DENIED`). */
export declare const ERROR_ACCESS_DENIED = 5;
/** Windows error code indicating the buffer was too small (`ERROR_MORE_DATA`). */
export declare const ERROR_MORE_DATA = 234;
/** Windows error code indicating no more items are available (`ERROR_NO_MORE_ITEMS`). */
export declare const ERROR_NO_MORE_ITEMS = 259;
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
export declare function stringToWide(str: string): Uint8Array;
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
export declare function wideToString(buffer: Uint8Array, byteLength?: number): string;
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
export declare function wideToMultiString(buffer: Uint8Array, byteLength?: number): string[];
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
export declare function multiStringToWide(arr: string[]): Uint8Array;
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
export declare function parseRegistryPath(path: string): {
    hkey: bigint;
    subKey: string;
};
/**
 * Advanced backend contract implemented by runtime-specific FFI layers. Most applications should use `Registry`.
 *
 * @example Usage
 * ```ts
 * import { isRegistryAvailable, type RegistryBackend } from "@neotales/win-registry";
 *
 * const supported = isRegistryAvailable();
 * console.log(supported);
 * ```
 */
export interface RegistryBackend {
    /**
     * Opens a subkey of a predefined root handle.
     *
     * @param hkey The predefined root handle.
     * @param subKey The relative subkey path.
     * @param access The requested access rights.
     * @returns The native handle of the opened key.
     */
    openKey(hkey: bigint, subKey: string, access: number): bigint;
    /**
     * Creates a subkey of a predefined root handle, or opens it when it exists.
     *
     * @param hkey The predefined root handle.
     * @param subKey The relative subkey path.
     * @param access The requested access rights.
     * @returns The native handle and whether the key was newly created.
     */
    createKey(hkey: bigint, subKey: string, access: number): {
        handle: bigint;
        created: boolean;
    };
    /**
     * Closes an opened key handle.
     *
     * @param hkey The native handle to close.
     */
    closeKey(hkey: bigint): void;
    /**
     * Deletes a subkey.
     *
     * @param hkey The parent handle.
     * @param subKey The relative subkey path.
     * @returns A Windows status code where `0` means success.
     */
    deleteKey(hkey: bigint, subKey: string): number;
    /**
     * Deletes a value.
     *
     * @param hkey The parent handle.
     * @param valueName The value name to delete.
     * @returns A Windows status code where `0` means success.
     */
    deleteValue(hkey: bigint, valueName: string): number;
    /**
     * Queries summary information about a key.
     *
     * @param hkey The native key handle.
     * @returns Counts and size limits for the key's subkeys and values.
     */
    queryInfoKey(hkey: bigint): {
        /** Number of direct subkeys. */
        subKeyCount: number;
        /** Length in characters of the longest subkey name. */
        maxSubKeyLength: number;
        /** Number of stored values. */
        valueCount: number;
        /** Length in characters of the longest value name. */
        maxValueNameLength: number;
        /** Size in bytes of the largest stored value. */
        maxValueLength: number;
        /** Last write time as a Windows file time. */
        lastWriteTime: number;
    };
    /**
     * Enumerates a subkey name by index.
     *
     * @param hkey The native key handle.
     * @param index The zero-based subkey index.
     * @param nameBufferSize The maximum subkey name length in characters.
     * @returns The subkey name, or `null` when no more items exist.
     */
    enumKeyNames(hkey: bigint, index: number, nameBufferSize: number): string | null;
    /**
     * Enumerates a value name by index.
     *
     * @param hkey The native key handle.
     * @param index The zero-based value index.
     * @param nameBufferSize The maximum value name length in characters.
     * @returns The value name, or `null` when no more items exist.
     */
    enumValueNames(hkey: bigint, index: number, nameBufferSize: number): string | null;
    /**
     * Reads a raw value and its type.
     *
     * @param hkey The native key handle.
     * @param valueName The value name to read.
     * @returns The value type and data, or `null` when the value is missing.
     */
    queryValue(hkey: bigint, valueName: string): {
        type: number;
        data: Uint8Array;
    } | null;
    /**
     * Writes a raw value.
     *
     * @param hkey The native key handle.
     * @param valueName The value name to write.
     * @param type The registry value type.
     * @param data The encoded value data.
     */
    setValue(hkey: bigint, valueName: string, type: number, data: Uint8Array): void;
}
