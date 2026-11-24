/**
 * Registry key implementation and facade.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { Key, KeyInfo } from "./types.js";
export { RegistryError } from "./registry_error.js";
/**
 * Returns whether a Windows Registry backend is available in the current
 * runtime.
 *
 * @returns `true` when registry operations are supported on the current runtime.
 *
 * @example Usage
 * ```ts
 * import { isRegistryAvailable } from "@neotales/win-registry";
 *
 * if (isRegistryAvailable()) {
 *   console.log("Registry operations are supported.");
 * }
 * ```
 */
export declare function isRegistryAvailable(): boolean;
/**
 * A handle to an opened or created Windows Registry key with convenience
 * helpers for reading and writing values.
 *
 * Keys hold native Windows handles, so prefer `using` (explicit resource
 * management) to release them at the end of the lexical scope. Predefined root
 * keys such as `Registry.HKCU` do not need closing.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * using key = Registry.createKey("HKCU\\Software\\MyApp");
 *
 * key.setString("Theme", "dark");
 * key.setInt32("LaunchCount", 3);
 *
 * console.log(key.getString("Theme"));
 * ```
 */
export declare class RegistryKey implements Key {
    #private;
    /**
     * Implements explicit resource management so keys work with `using`.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software");
     * // key.close() is called automatically at the end of the scope.
     * ```
     */
    [Symbol.dispose]: () => void;
    /**
     * Creates a {@linkcode RegistryKey} from a native handle.
     *
     * @param handle The native registry key handle.
     * @param path The full registry path of the key.
     * @param created Whether the key was newly created rather than opened.
     */
    constructor(handle: bigint, path: string, created?: boolean);
    /**
     * The full registry path of this key.
     *
     * @returns The full registry path, for example `"HKCU\\Software\\MyApp"`.
     */
    get path(): string;
    /**
     * Whether this key was newly created rather than opened.
     *
     * @returns `true` when the key was created by {@linkcode RegistryKey.createKey}.
     */
    get created(): boolean;
    /**
     * Checks whether the underlying native handle is null.
     *
     * @returns `true` when the key does not reference a valid native handle.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software");
     * console.log(key.isNull());
     * ```
     */
    isNull(): boolean;
    /**
     * Returns the underlying native handle for use with lower-level APIs.
     *
     * @returns The native registry key handle.
     */
    unwrap(): bigint;
    /**
     * Closes the key and releases its native handle. Closing predefined root
     * keys is a no-op. Using a closed key throws {@linkcode RegistryError}.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * const key = Registry.openKey("HKCU\\Software");
     * try {
     *   console.log(key.getValueNames());
     * } finally {
     *   key.close();
     * }
     * ```
     */
    close(): void;
    /**
     * Opens a child key relative to this key.
     *
     * @param path The relative child key path.
     * @param access The requested access rights. Defaults to `Rights.READ`.
     * @returns The opened child key.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using software = Registry.openKey("HKCU\\Software");
     * using myApp = software.openKey("MyApp");
     *
     * console.log(myApp.getString("Theme"));
     * ```
     */
    openKey(path: string, access?: number): Key;
    /**
     * Creates a child key relative to this key, or opens it when it already
     * exists.
     *
     * @param path The relative child key path.
     * @param access The requested access rights. Defaults to `Rights.ALL_ACCESS`.
     * @returns The created or opened child key.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using software = Registry.openKey("HKCU\\Software", Rights.ALL_ACCESS);
     * using myApp = software.createKey("MyApp");
     *
     * console.log(myApp.created);
     * ```
     */
    createKey(path: string, access?: number): Key;
    /**
     * Deletes a child key of this key.
     *
     * @param name The name of the child key to delete.
     * @returns `true` on success, `false` when the deletion failed.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using software = Registry.openKey("HKCU\\Software");
     * console.log(software.deleteKey("MyApp"));
     * ```
     */
    deleteKey(name: string): boolean;
    /**
     * Deletes a value from this key.
     *
     * @param name The name of the value to delete.
     * @returns `true` on success, `false` when the deletion failed.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software\\MyApp");
     * console.log(key.deleteValue("Theme"));
     * ```
     */
    deleteValue(name: string): boolean;
    /**
     * Returns summary information about this key, such as subkey and value
     * counts and the last write time.
     *
     * @returns Key statistics as a {@linkcode KeyInfo} object.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software\\MyApp");
     * const info = key.stat();
     * console.log(info.subKeyCount, info.valueCount);
     * ```
     */
    stat(): KeyInfo;
    /**
     * Enumerates the names of all subkeys of this key.
     *
     * @param n Optional maximum number of names to return.
     * @returns An array of subkey names.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software");
     * console.log(key.getSubKeyNames());
     * ```
     */
    getSubKeyNames(n?: number): string[];
    /**
     * Enumerates the names of all values stored under this key.
     *
     * @param n Optional maximum number of names to return.
     * @returns An array of value names.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software\\MyApp");
     * console.log(key.getValueNames());
     * ```
     */
    getValueNames(n?: number): string[];
    /**
     * Reads a raw value together with its registry type.
     *
     * @param name The name of the value to read.
     * @param buffer Optional buffer to receive the data instead of allocating a
     * new one. Must be at least as large as the stored value.
     * @returns The raw value data and its {@linkcode Types} constant.
     * @throws {RegistryError} If the value does not exist.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software\\MyApp");
     * const { data, type } = key.getValue("LaunchCount");
     * console.log(type, data.byteLength);
     * ```
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
     * @throws {RegistryError} If the value is missing or not a string type.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion");
     * console.log(key.getString("ProductName"));
     * ```
     */
    getString(name: string): string;
    /**
     * Reads a `REG_MULTI_SZ` value as an array of strings.
     *
     * @param name The name of the value to read.
     * @returns The decoded string list.
     * @throws {RegistryError} If the value is missing or not `REG_MULTI_SZ`.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software\\MyApp");
     * console.log(key.getMultiString("RecentFiles"));
     * ```
     */
    getMultiString(name: string): string[];
    /**
     * Reads a `REG_DWORD` (32-bit) value as a number.
     *
     * A DWORD is an unsigned 32-bit integer stored in exactly four bytes. It maps
     * to JavaScript's `number` type via {@linkcode RegistryKey.setInt32}.
     *
     * @param name The name of the value to read.
     * @returns The 32-bit value.
     * @throws {RegistryError} If the value is missing or not a DWORD type.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software\\MyApp");
     * console.log(key.getInt32("LaunchCount"));
     * ```
     */
    getInt32(name: string): number;
    /**
     * Reads a `REG_QWORD` (64-bit) value as a bigint.
     *
     * A QWORD is an unsigned 64-bit integer stored in exactly eight bytes. It is
     * too large for `number`, so it maps to JavaScript's `bigint` type via
     * {@linkcode RegistryKey.setInt64}.
     *
     * @param name The name of the value to read.
     * @returns The 64-bit value.
     * @throws {RegistryError} If the value is missing or not `REG_QWORD`.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software\\MyApp");
     * console.log(key.getInt64("Timestamp"));
     * ```
     */
    getInt64(name: string): bigint;
    /**
     * Reads a `REG_BINARY` value as a byte array.
     *
     * @param name The name of the value to read.
     * @returns The raw bytes of the value.
     * @throws {RegistryError} If the value is missing or not `REG_BINARY`.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.openKey("HKCU\\Software\\MyApp");
     * console.log(key.getBinary("State"));
     * ```
     */
    getBinary(name: string): Uint8Array;
    /**
     * Writes raw value data with an explicit {@linkcode Types} constant. Prefer
     * the typed helpers such as {@linkcode RegistryKey.setString} and
     * {@linkcode RegistryKey.setInt32} when the type is known.
     *
     * @param name The name of the value to write.
     * @param data The encoded value data.
     * @param type The registry value type.
     *
     * @example Usage
     * ```ts
     * import { Registry, Types } from "@neotales/win-registry";
     *
     * using key = Registry.createKey("HKCU\\Software\\MyApp");
     * key.setValue("Flag", new Uint8Array([1, 0, 0, 0]), Types.DWORD);
     * ```
     */
    setValue(name: string, data: Uint8Array, type: number): void;
    /**
     * Writes a string as a `REG_SZ` value.
     *
     * @param name The name of the value to write.
     * @param value The string value.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.createKey("HKCU\\Software\\MyApp");
     * key.setString("Theme", "dark");
     * ```
     */
    setString(name: string, value: string): void;
    /**
     * Writes a string containing environment-variable references such as
     * `%USERPROFILE%` as a `REG_EXPAND_SZ` value.
     *
     * @param name The name of the value to write.
     * @param value The unexpanded string value.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.createKey("HKCU\\Software\\MyApp");
     * key.setExpandString("Logs", "%USERPROFILE%\\AppData\\Local\\MyApp\\logs");
     * ```
     */
    setExpandString(name: string, value: string): void;
    /**
     * Writes an array of strings as a `REG_MULTI_SZ` value.
     *
     * @param name The name of the value to write.
     * @param value The list of strings.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.createKey("HKCU\\Software\\MyApp");
     * key.setMultiString("RecentFiles", ["a.txt", "b.txt"]);
     * ```
     */
    setMultiString(name: string, value: string[]): void;
    /**
     * Writes raw bytes as a `REG_BINARY` value.
     *
     * @param name The name of the value to write.
     * @param data The bytes to write.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.createKey("HKCU\\Software\\MyApp");
     * key.setBinary("State", new Uint8Array([1, 2, 3, 4]));
     * ```
     */
    setBinary(name: string, data: Uint8Array): void;
    /**
     * Writes a 32-bit integer as a `REG_DWORD` value.
     *
     * A DWORD is an unsigned 32-bit integer stored in exactly four bytes and maps
     * to JavaScript's `number` type. Read it back with
     * {@linkcode RegistryKey.getInt32}.
     *
     * @param name The name of the value to write.
     * @param value The 32-bit integer value.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.createKey("HKCU\\Software\\MyApp");
     * key.setInt32("LaunchCount", 3); // REG_DWORD
     * ```
     */
    setInt32(name: string, value: number): void;
    /**
     * Writes a 64-bit integer as a `REG_QWORD` value.
     *
     * A QWORD is an unsigned 64-bit integer stored in exactly eight bytes. It
     * exceeds `Number.MAX_SAFE_INTEGER`, so it maps to JavaScript's `bigint`
     * type. Read it back with {@linkcode RegistryKey.getInt64}.
     *
     * @param name The name of the value to write.
     * @param value The 64-bit integer value.
     *
     * @example Usage
     * ```ts
     * import { Registry } from "@neotales/win-registry";
     *
     * using key = Registry.createKey("HKCU\\Software\\MyApp");
     * key.setInt64("Timestamp", 9007199254740993n); // REG_QWORD
     * ```
     */
    setInt64(name: string, value: bigint): void;
}
/**
 * Opens an existing registry key.
 *
 * @param path Registry path to open.
 * @param access Requested access rights. Defaults to `Rights.READ`.
 * @returns The opened registry key.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * using key = Registry.openKey("HKCU\\Software\\MyApp");
 * console.log(key.getString("Theme"));
 * ```
 */
declare function openRegistryKey(path: string, access?: number): Key;
/**
 * Opens a child key relative to an existing key.
 *
 * @param key Parent key.
 * @param path Relative child path.
 * @param access Requested access rights. Defaults to `Rights.READ`.
 * @returns The opened registry key.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * using software = Registry.openKey("HKCU\\Software");
 * using myApp = Registry.openKey(software, "MyApp");
 * ```
 */
declare function openRegistryKey(key: Key, path: string, access?: number): Key;
/**
 * Creates a registry key if needed and opens it.
 *
 * @param path Registry path to create.
 * @param access Requested access rights. Defaults to `Rights.ALL_ACCESS`.
 * @returns The created or opened registry key.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * using key = Registry.createKey("HKCU\\Software\\MyApp");
 * key.setString("Theme", "dark");
 * ```
 */
declare function createRegistryKey(path: string, access?: number): Key;
/**
 * Creates a child registry key relative to an existing key.
 *
 * @param key Parent key.
 * @param path Relative child path.
 * @param access Requested access rights. Defaults to `Rights.ALL_ACCESS`.
 * @returns The created or opened registry key.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * using software = Registry.openKey("HKCU\\Software", Rights.ALL_ACCESS);
 * using myApp = Registry.createKey(software, "MyApp");
 * console.log(myApp.created);
 * ```
 */
declare function createRegistryKey(key: Key, path: string, access?: number): Key;
/**
 * Deletes a registry key.
 *
 * @param path Registry path to delete.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * Registry.deleteKey("HKCU\\Software\\MyApp");
 * ```
 */
declare function deleteRegistryKey(path: string): void;
/**
 * Deletes a child key relative to an existing key.
 *
 * @param key Parent key.
 * @param path Relative child path.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * using software = Registry.openKey("HKCU\\Software");
 * Registry.deleteKey(software, "MyApp");
 * ```
 */
declare function deleteRegistryKey(key: Key, path: string): void;
type RegistryApi = {
    readonly HKCR: Key;
    readonly HKCU: Key;
    readonly HKLM: Key;
    readonly HKU: Key;
    readonly HKPD: Key;
    readonly HKCC: Key;
    openKey: typeof openRegistryKey;
    createKey: typeof createRegistryKey;
    deleteKey: typeof deleteRegistryKey;
};
/**
 * Windows Registry API facade.
 *
 * Exposes the predefined root keys (`HKCR`, `HKCU`, `HKLM`, `HKU`, `HKPD`,
 * `HKCC`) plus the `openKey`, `createKey`, and `deleteKey` operations. Root key
 * properties return fresh handles each time and never need closing.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * using key = Registry.openKey("HKCU\\Software");
 * console.log(key.getSubKeyNames());
 * ```
 */
export declare const Registry: RegistryApi;
