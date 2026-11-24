/**
 * Shared types, constants, and backend interface for the Windows Registry module.
 *
 * @module
 */

import { RegistryError } from "./registry_error.ts";

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
} as const;

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
export const EXECUTE: number = Rights.READ;

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
} as const;

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
   * Implements explicit resource management so keys work with `using`.
   */
  [Symbol.dispose](): void;
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
  getValue(
    name: string,
    buffer?: Uint8Array,
  ): { data: Uint8Array; type: number };
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
export function stringToWide(str: string): Uint8Array {
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
function decodeUtf16Le(buffer: Uint8Array): string {
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
        } else {
          chunk += "\uFFFD";
        }
      } else {
        // A high surrogate with no complete following code unit. An odd
        // trailing byte belongs to this malformed sequence, so consume it
        // and emit one replacement, matching TextDecoder.
        chunk += "\uFFFD";
        if (trailingOdd) {
          trailingOdd = false;
          i += 1;
        }
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      chunk += "\uFFFD";
    } else {
      chunk += String.fromCharCode(code);
    }

    if (chunk.length >= 1024) {
      out += chunk;
      chunk = "";
    }
  }

  if (trailingOdd) chunk += "\uFFFD";
  return stripBom(out + chunk);
}

/**
 * Removes one leading UTF-16LE byte-order mark.
 *
 * @param value The decoded string.
 * @returns The string without a leading BOM.
 */
function stripBom(value: string): string {
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
export function wideToString(buffer: Uint8Array, byteLength?: number): string {
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
export function wideToMultiString(
  buffer: Uint8Array,
  byteLength?: number,
): string[] {
  const result: string[] = [];
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
export function multiStringToWide(arr: string[]): Uint8Array {
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
export function parseRegistryPath(
  path: string,
): { hkey: bigint; subKey: string } {
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
  createKey(
    hkey: bigint,
    subKey: string,
    access: number,
  ): { handle: bigint; created: boolean };
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
  enumKeyNames(
    hkey: bigint,
    index: number,
    nameBufferSize: number,
  ): string | null;
  /**
   * Enumerates a value name by index.
   *
   * @param hkey The native key handle.
   * @param index The zero-based value index.
   * @param nameBufferSize The maximum value name length in characters.
   * @returns The value name, or `null` when no more items exist.
   */
  enumValueNames(
    hkey: bigint,
    index: number,
    nameBufferSize: number,
  ): string | null;
  /**
   * Reads a raw value and its type.
   *
   * @param hkey The native key handle.
   * @param valueName The value name to read.
   * @returns The value type and data, or `null` when the value is missing.
   */
  queryValue(
    hkey: bigint,
    valueName: string,
  ): { type: number; data: Uint8Array } | null;
  /**
   * Writes a raw value.
   *
   * @param hkey The native key handle.
   * @param valueName The value name to write.
   * @param type The registry value type.
   * @param data The encoded value data.
   */
  setValue(
    hkey: bigint,
    valueName: string,
    type: number,
    data: Uint8Array,
  ): void;
}
