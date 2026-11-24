/**
 * Registry key implementation and facade.
 *
 * @module
 */

import type { Key, KeyInfo, RegistryBackend } from "./types.ts";
import { RegistryError } from "./registry_error.ts";
import {
  HKEY_CLASSES_ROOT,
  HKEY_CURRENT_CONFIG,
  HKEY_CURRENT_USER,
  HKEY_LOCAL_MACHINE,
  HKEY_PERFORMANCE_DATA,
  HKEY_USERS,
  multiStringToWide,
  parseRegistryPath,
  Rights,
  stringToWide,
  Types,
  wideToMultiString,
  wideToString,
} from "./types.ts";

export { RegistryError } from "./registry_error.ts";

let isSupported = false;

let driver: RegistryBackend = {
  openKey(_hkey: bigint, _subKey: string, _access: number): bigint {
    RegistryError.throwUnsupported();
  },
  createKey(
    _hkey: bigint,
    _subKey: string,
    _access: number,
  ): { handle: bigint; created: boolean } {
    RegistryError.throwUnsupported();
  },
  deleteKey(_hkey: bigint, _subKey: string): number {
    RegistryError.throwUnsupported();
  },
  deleteValue(_hkey: bigint, _value: string): number {
    RegistryError.throwUnsupported();
  },
  enumKeyNames(_hkey: bigint, _index: number, _bufSize: number): string | null {
    RegistryError.throwUnsupported();
  },
  enumValueNames(
    _hkey: bigint,
    _index: number,
    _bufSize: number,
  ): string | null {
    RegistryError.throwUnsupported();
  },
  queryValue(
    _hkey: bigint,
    _value: string,
  ): { data: Uint8Array; type: number } | null {
    RegistryError.throwUnsupported();
  },
  queryInfoKey(_hkey: bigint): {
    subKeyCount: number;
    maxSubKeyLength: number;
    valueCount: number;
    maxValueNameLength: number;
    maxValueLength: number;
    lastWriteTime: number;
  } {
    RegistryError.throwUnsupported();
  },
  closeKey(_hkey: bigint): void {
    RegistryError.throwUnsupported();
  },
  setValue(
    _hkey: bigint,
    _value: string,
    _type: number,
    _data: Uint8Array,
  ): void {
    RegistryError.throwUnsupported();
  },
};

/** Extra runtime globals used to detect the host JavaScript runtime. */
interface RuntimeGlobal {
  /** Defined when running under Deno or Ende. */
  Deno?: unknown;
  /** Defined when running under Bun. */
  Bun?: unknown;
  /** Defined when running under txiki.js. */
  tjs?: unknown;
  /** Node.js-compatible process global, present under Node, Bun, and Deno. */
  process?: { platform?: string };
  /** Navigator data used by txiki.js to report the host platform. */
  navigator?: { userAgentData?: { platform?: string } };
}

const globalRuntime = globalThis as typeof globalThis & RuntimeGlobal;

/**
 * Detects the current JavaScript runtime.
 *
 * @returns `"deno"`, `"bun"`, `"tjs"`, or `"node"` when the runtime is
 * recognized, otherwise `null`.
 */
function detectRuntime(): "deno" | "bun" | "tjs" | "node" | null {
  if (typeof globalRuntime.Deno !== "undefined") return "deno";
  if (typeof globalRuntime.Bun !== "undefined") return "bun";
  if (typeof globalRuntime.tjs !== "undefined") return "tjs";
  if (typeof globalRuntime.process !== "undefined") return "node";
  return null;
}

// #region win-registry-runtime-backend
const runtime = detectRuntime();

const isWindowsPlatform = (runtime === "deno" && Deno.build.os === "windows") ||
  (runtime === "tjs" &&
    globalRuntime.navigator?.userAgentData?.platform === "Windows") ||
  ((runtime === "bun" || runtime === "node") &&
    globalRuntime.process?.platform === "win32");

if (isWindowsPlatform) {
  try {
    const backend: { backend: RegistryBackend; open(): void } = runtime === "deno"
      ? await import("./ffi_deno.ts")
      : runtime === "bun"
      ? await import("./bun_ffi.ts")
      : runtime === "tjs"
      ? await import("./ffi_txiki.ts")
      : await import("./ffi_node.ts");
    // Backends load their native library lazily, so a successful module
    // import does not prove FFI works. Probe the backend module's exported
    // open() before replacing the default throwing driver. A failed probe
    // leaves the default backend and reports unavailable.
    backend.open();
    driver = backend.backend;
    isSupported = true;
  } catch {
    // The FFI backend requires native access and a loadable Windows library.
  }
}
// #endregion win-registry-runtime-backend

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
export function isRegistryAvailable(): boolean {
  return isSupported;
}

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
export class RegistryKey implements Key {
  #handle: bigint;
  #path: string;
  #created: boolean;
  #closed = false;

  /**
   * Creates a {@linkcode RegistryKey} from a native handle.
   *
   * @param handle The native registry key handle.
   * @param path The full registry path of the key.
   * @param created Whether the key was newly created rather than opened.
   */
  constructor(handle: bigint, path: string, created = false) {
    this.#handle = handle;
    this.#path = path;
    this.#created = created;
  }

  /**
   * The full registry path of this key.
   *
   * @returns The full registry path, for example `"HKCU\\Software\\MyApp"`.
   */
  get path(): string {
    return this.#path;
  }

  /**
   * Whether this key was newly created rather than opened.
   *
   * @returns `true` when the key was created by {@linkcode RegistryKey.createKey}.
   */
  get created(): boolean {
    return this.#created;
  }

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
  isNull(): boolean {
    return !isSupported || this.#handle === 0n;
  }

  /**
   * Returns the underlying native handle for use with lower-level APIs.
   *
   * @returns The native registry key handle.
   */
  unwrap(): bigint {
    if (!isSupported) RegistryError.throwUnsupported();
    return this.#handle;
  }

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
  close(): void {
    if (!isSupported) RegistryError.throwUnsupported();
    if (!this.#closed && !this.#isPredefined()) {
      driver.closeKey(this.#handle);
      this.#closed = true;
    }
  }

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
  [Symbol.dispose](): void {
    this.close();
  }

  #isPredefined(): boolean {
    return (
      this.#handle === HKEY_CLASSES_ROOT ||
      this.#handle === HKEY_CURRENT_USER ||
      this.#handle === HKEY_LOCAL_MACHINE ||
      this.#handle === HKEY_USERS ||
      this.#handle === HKEY_PERFORMANCE_DATA ||
      this.#handle === HKEY_CURRENT_CONFIG
    );
  }

  #ensureOpen(): void {
    if (this.#closed) {
      throw new RegistryError("Registry key has been closed.");
    }
  }

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
  openKey(path: string, access: number = Rights.READ): Key {
    this.#ensureOpen();
    const handle = driver.openKey(this.#handle, path, access);
    return new RegistryKey(
      handle,
      this.#path ? `${this.#path}\\${path}` : path,
    );
  }

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
  createKey(path: string, access: number = Rights.ALL_ACCESS): Key {
    this.#ensureOpen();
    const result = driver.createKey(this.#handle, path, access);
    return new RegistryKey(
      result.handle,
      this.#path ? `${this.#path}\\${path}` : path,
      result.created,
    );
  }

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
  deleteKey(name: string): boolean {
    this.#ensureOpen();
    return driver.deleteKey(this.#handle, name) === 0;
  }

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
  deleteValue(name: string): boolean {
    this.#ensureOpen();
    return driver.deleteValue(this.#handle, name) === 0;
  }

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
  stat(): KeyInfo {
    this.#ensureOpen();
    const info = driver.queryInfoKey(this.#handle);
    return {
      subKeyCount: info.subKeyCount,
      maxSubKeyLength: info.maxSubKeyLength,
      valueCount: info.valueCount,
      maxValueNameLength: info.maxValueNameLength,
      maxValueLength: info.maxValueLength,
      lastWriteTime: info.lastWriteTime || undefined,
    };
  }

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
  getSubKeyNames(n?: number): string[] {
    this.#ensureOpen();
    const info = driver.queryInfoKey(this.#handle);
    const names: string[] = [];
    const limit = n ?? info.subKeyCount;
    const bufSize = info.maxSubKeyLength;

    for (let i = 0; i < limit; i++) {
      const name = driver.enumKeyNames(this.#handle, i, bufSize);
      if (name === null) break;
      names.push(name);
    }

    return names;
  }

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
  getValueNames(n?: number): string[] {
    this.#ensureOpen();
    const info = driver.queryInfoKey(this.#handle);
    const names: string[] = [];
    const limit = n ?? info.valueCount;
    const bufSize = info.maxValueNameLength;

    for (let i = 0; i < limit; i++) {
      const name = driver.enumValueNames(this.#handle, i, bufSize);
      if (name === null) break;
      names.push(name);
    }

    return names;
  }

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
  getValue(
    name: string,
    buffer?: Uint8Array,
  ): { data: Uint8Array; type: number } {
    this.#ensureOpen();
    const result = driver.queryValue(this.#handle, name);
    if (!result) {
      throw new RegistryError(
        `Registry value "${name}" not found under "${this.#path}".`,
      );
    }

    if (buffer && buffer.length >= result.data.length) {
      buffer.set(result.data);
      return {
        data: buffer.subarray(0, result.data.length),
        type: result.type,
      };
    }

    return result;
  }

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
  getString(name: string): string {
    const { data, type } = this.getValue(name);
    if (type !== Types.SZ && type !== Types.EXPAND_SZ) {
      throw new RegistryError(
        `Expected SZ or EXPAND_SZ but got type ${type} for "${name}".`,
      );
    }
    return wideToString(data);
  }

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
  getMultiString(name: string): string[] {
    const { data, type } = this.getValue(name);
    if (type !== Types.MULTI_SZ) {
      throw new RegistryError(
        `Expected MULTI_SZ but got type ${type} for "${name}".`,
      );
    }
    return wideToMultiString(data);
  }

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
  getInt32(name: string): number {
    const { data, type } = this.getValue(name);
    if (type !== Types.DWORD && type !== Types.DWORD_BIG_ENDIAN) {
      throw new RegistryError(
        `Expected DWORD but got type ${type} for "${name}".`,
      );
    }
    if (type === Types.DWORD_BIG_ENDIAN) {
      return (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
    }
    return data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);
  }

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
  getInt64(name: string): bigint {
    const { data, type } = this.getValue(name);
    if (type !== Types.QWORD) {
      throw new RegistryError(
        `Expected QWORD but got type ${type} for "${name}".`,
      );
    }
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return view.getBigInt64(0, true);
  }

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
  getBinary(name: string): Uint8Array {
    const { data, type } = this.getValue(name);
    if (type !== Types.BINARY) {
      throw new RegistryError(
        `Expected BINARY but got type ${type} for "${name}".`,
      );
    }
    return data;
  }

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
  setValue(name: string, data: Uint8Array, type: number): void {
    this.#ensureOpen();
    driver.setValue(this.#handle, name, type, data);
  }

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
  setString(name: string, value: string): void {
    this.setValue(name, stringToWide(value), Types.SZ);
  }

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
  setExpandString(name: string, value: string): void {
    this.setValue(name, stringToWide(value), Types.EXPAND_SZ);
  }

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
  setMultiString(name: string, value: string[]): void {
    this.setValue(name, multiStringToWide(value), Types.MULTI_SZ);
  }

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
  setBinary(name: string, data: Uint8Array): void {
    this.setValue(name, data, Types.BINARY);
  }

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
  setInt32(name: string, value: number): void {
    const buf = new Uint8Array(4);
    buf[0] = value & 0xff;
    buf[1] = (value >> 8) & 0xff;
    buf[2] = (value >> 16) & 0xff;
    buf[3] = (value >> 24) & 0xff;
    this.setValue(name, buf, Types.DWORD);
  }

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
  setInt64(name: string, value: bigint): void {
    const buf = new Uint8Array(8);
    const view = new DataView(buf.buffer);
    view.setBigInt64(0, value, true);
    this.setValue(name, buf, Types.QWORD);
  }
}

function predefinedKey(hkey: bigint, name: string): Key {
  return new RegistryKey(hkey, name);
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
function openRegistryKey(path: string, access?: number): Key;
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
function openRegistryKey(key: Key, path: string, access?: number): Key;
function openRegistryKey(
  arg1: Key | string,
  arg2?: string | number,
  arg3?: number,
): Key {
  if (typeof arg1 === "string") {
    const { hkey, subKey } = parseRegistryPath(arg1);
    const access = (arg2 as number | undefined) ?? Rights.READ;
    return new RegistryKey(driver.openKey(hkey, subKey, access), arg1);
  }

  return arg1.openKey(arg2 as string, arg3 ?? Rights.READ);
}

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
function createRegistryKey(path: string, access?: number): Key;
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
function createRegistryKey(key: Key, path: string, access?: number): Key;
function createRegistryKey(
  arg1: Key | string,
  arg2?: string | number,
  arg3?: number,
): Key {
  if (typeof arg1 === "string") {
    const { hkey, subKey } = parseRegistryPath(arg1);
    const access = (arg2 as number | undefined) ?? Rights.ALL_ACCESS;
    const result = driver.createKey(hkey, subKey, access);
    return new RegistryKey(result.handle, arg1, result.created);
  }

  return arg1.createKey(arg2 as string, arg3 ?? Rights.ALL_ACCESS);
}

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
function deleteRegistryKey(path: string): void;
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
function deleteRegistryKey(key: Key, path: string): void;
function deleteRegistryKey(arg1: Key | string, arg2?: string): void {
  if (typeof arg1 === "string") {
    const { hkey, subKey } = parseRegistryPath(arg1);
    const status = Number(driver.deleteKey(hkey, subKey));
    if (status !== 0) {
      throw new RegistryError(
        `Failed to delete registry key "${arg1}" with error code ${status}`,
      );
    }
    return;
  }

  const parent = arg1;
  const path = arg2 as string;
  if (!parent.deleteKey(path)) {
    throw new RegistryError(`Failed to delete registry key "${path}"`);
  }
}

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
export const Registry: RegistryApi = {
  /** Returns the predefined `HKEY_CLASSES_ROOT` key.
   *
   * @returns A handle to `HKEY_CLASSES_ROOT`.
   *
   * @example Usage
   * ```ts
   * import { Registry } from "@neotales/win-registry";
   *
   * console.log(Registry.HKCR.path);
   * ```
   */
  get HKCR(): Key {
    return predefinedKey(HKEY_CLASSES_ROOT, "HKEY_CLASSES_ROOT");
  },
  /** Returns the predefined `HKEY_CURRENT_USER` key, the settings for the current user.
   *
   * @returns A handle to `HKEY_CURRENT_USER`.
   *
   * @example Usage
   * ```ts
   * import { Registry } from "@neotales/win-registry";
   *
   * using myApp = Registry.HKCU.openKey("Software\\MyApp", Rights.ALL_ACCESS);
   * myApp.setString("Theme", "dark");
   * ```
   */
  get HKCU(): Key {
    return predefinedKey(HKEY_CURRENT_USER, "HKEY_CURRENT_USER");
  },
  /** Returns the predefined `HKEY_LOCAL_MACHINE` key, the machine-wide settings.
   *
   * @returns A handle to `HKEY_LOCAL_MACHINE`.
   *
   * @example Usage
   * ```ts
   * import { Registry } from "@neotales/win-registry";
   *
   * using cv = Registry.HKLM.openKey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion");
   * console.log(cv.getString("ProductName"));
   * ```
   */
  get HKLM(): Key {
    return predefinedKey(HKEY_LOCAL_MACHINE, "HKEY_LOCAL_MACHINE");
  },
  /** Returns the predefined `HKEY_USERS` key, which contains all loaded user hives.
   *
   * @returns A handle to `HKEY_USERS`.
   *
   * @example Usage
   * ```ts
   * import { Registry } from "@neotales/win-registry";
   *
   * console.log(Registry.HKU.path);
   * ```
   */
  get HKU(): Key {
    return predefinedKey(HKEY_USERS, "HKEY_USERS");
  },
  /** Returns the predefined `HKEY_PERFORMANCE_DATA` key.
   *
   * @returns A handle to `HKEY_PERFORMANCE_DATA`.
   *
   * @example Usage
   * ```ts
   * import { Registry } from "@neotales/win-registry";
   *
   * console.log(Registry.HKPD.path);
   * ```
   */
  get HKPD(): Key {
    return predefinedKey(HKEY_PERFORMANCE_DATA, "HKEY_PERFORMANCE_DATA");
  },
  /** Returns the predefined `HKEY_CURRENT_CONFIG` key.
   *
   * @returns A handle to `HKEY_CURRENT_CONFIG`.
   *
   * @example Usage
   * ```ts
   * import { Registry } from "@neotales/win-registry";
   *
   * console.log(Registry.HKCC.path);
   * ```
   */
  get HKCC(): Key {
    return predefinedKey(HKEY_CURRENT_CONFIG, "HKEY_CURRENT_CONFIG");
  },
  openKey: openRegistryKey,
  createKey: createRegistryKey,
  deleteKey: deleteRegistryKey,
} as const;
