/**
 * Node.js FFI backend for Windows Registry operations.
 *
 * Loads `advapi32.dll` through `node:ffi`, which is experimental in current
 * Node.js releases. The specifier is required dynamically through a variable
 * so that bundlers and other runtimes never resolve `node:ffi` statically.
 * Because opening the library is a side effectful operation, the backend
 * exposes an explicit lifecycle: {@linkcode open} eagerly loads `node:ffi` and
 * opens `advapi32.dll`, {@linkcode close} unloads it again, and
 * {@linkcode isOpened} reports the current state. The library also loads
 * lazily on the first backend call when {@linkcode open} was never used.
 *
 * @module
 * @internal
 */

import type { RegistryBackend } from "./types.ts";
import { RegistryError } from "./registry_error.ts";
import { readU32, readU64, writeU32 } from "./binary.ts";
import { hkeyToNative, pointerWidth } from "./hkey.ts";
import { readRegistryValue } from "./query_value.ts";
import {
  ERROR_NO_MORE_ITEMS,
  ERROR_SUCCESS,
  stringToWide,
  wideToString,
} from "./types.ts";
import { createRequire } from "node:module";

/** Minimal shape of the `node:ffi` module surface used by this backend. */
interface NodeFfiModule {
  /** Opens a native library and resolves the requested symbols. */
  dlopen(
    name: string,
    symbols: Record<string, { arguments: string[]; return: string }>,
  ): {
    functions: Record<string, (...args: unknown[]) => unknown>;
    close?: () => void;
  };
}

/** An opened native library plus an optional unload hook. */
interface NodeFfiLibrary {
  /** The resolved FFI entry points, keyed by symbol name. */
  functions: Record<string, (...args: unknown[]) => unknown>;
  /** Unloads the library, when supported by the runtime. */
  close?: () => void;
}

/**
 * Imports `node:ffi` through a variable specifier via `createRequire` so the
 * module is never statically resolved by runtimes or tools that lack support
 * for it. Verifies that the module actually loaded and exposes the expected
 * API surface, since `node:ffi` is experimental and may be missing or flagged
 * off in some builds.
 *
 * @returns The subset of the `node:ffi` API used by this backend.
 * @throws {Error} If `node:ffi` cannot be loaded or does not expose
 * `dlopen`, e.g. unsupported Node.js versions where the feature is disabled,
 * or non-Windows platforms without the builtin module.
 */
function loadNodeFfi(): NodeFfiModule {
  const specifier = "node:ffi";
  const require = createRequire(import.meta.url);
  try {
    const ffi = require(specifier) as Partial<NodeFfiModule> | undefined | null;

    if (!ffi || typeof ffi.dlopen !== "function") {
      throw new TypeError("module does not expose dlopen");
    }

    return ffi as NodeFfiModule;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new RegistryError(
      `Failed to load "${specifier}", which is experimental and may be unavailable in this Node.js build: ${reason}. Run Node >= 26 with --experimental-ffi. This source has no koffi fallback.`,
      { cause: error },
    );
  }
}

let ffiModule: NodeFfiModule | null = null;
let library: NodeFfiLibrary | null = null;

/**
 * Loads `node:ffi` and opens `advapi32.dll` exactly once, reusing the opened
 * library on subsequent calls.
 *
 * @returns The opened native library.
 * @throws {Error} If `node:ffi` cannot be loaded or `advapi32.dll` cannot be
 * opened.
 */
function ensureLoaded(): NodeFfiLibrary {
  if (library) {
    return library;
  }

  if (!ffiModule) {
    ffiModule = loadNodeFfi();
  }

  library = ffiModule.dlopen("advapi32.dll", SYMBOLS);

  return library;
}

/**
 * The `advapi32.dll` symbol table requested from `node:ffi`.
 */
const SYMBOLS = {
  RegOpenKeyExW: {
    arguments: ["pointer", "pointer", "u32", "u32", "pointer"],
    return: "i32",
  },
  RegCreateKeyExW: {
    arguments: [
      "pointer",
      "pointer",
      "u32",
      "pointer",
      "u32",
      "u32",
      "pointer",
      "pointer",
      "pointer",
    ],
    return: "i32",
  },
  RegCloseKey: { arguments: ["pointer"], return: "i32" },
  RegDeleteKeyW: { arguments: ["pointer", "pointer"], return: "i32" },
  RegDeleteValueW: { arguments: ["pointer", "pointer"], return: "i32" },
  RegQueryInfoKeyW: {
    arguments: [
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
    ],
    return: "i32",
  },
  RegEnumKeyExW: {
    arguments: [
      "pointer",
      "u32",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
    ],
    return: "i32",
  },
  RegEnumValueW: {
    arguments: [
      "pointer",
      "u32",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
    ],
    return: "i32",
  },
  RegQueryValueExW: {
    arguments: [
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
    ],
    return: "i32",
  },
  RegSetValueExW: {
    arguments: ["pointer", "pointer", "u32", "u32", "pointer", "u32"],
    return: "i32",
  },
};

/**
 * Returns the resolved FFI entry points, loading `node:ffi` and opening
 * `advapi32.dll` if {@linkcode open} has not been called yet.
 *
 * @returns The resolved symbol functions.
 * @throws {Error} If the library cannot be loaded.
 */
function fns(): Record<string, (...args: unknown[]) => unknown> {
  return ensureLoaded().functions;
}

/**
 * Eagerly loads `node:ffi` and opens `advapi32.dll`.
 *
 * Call this at startup to fail fast when the experimental `node:ffi` builtin
 * is unavailable; otherwise the library loads lazily on the first backend
 * call. Repeated calls are no-ops while the backend stays open.
 *
 * @throws {Error} If `node:ffi` cannot be loaded or `advapi32.dll` cannot be
 * opened.
 *
 * @example Usage
 * ```ts
 * import { open } from "@neotales/win-registry/ffi-node";
 *
 * open();
 * console.log("advapi32.dll is ready");
 * ```
 */
export function open(): void {
  ensureLoaded();
}

/**
 * Reports whether the backend currently holds an opened native library.
 *
 * @returns `true` after a successful {@linkcode open} or lazy load and before
 * {@linkcode close}.
 *
 * @example Usage
 * ```ts
 * import { isOpened } from "@neotales/win-registry/ffi-node";
 *
 * console.log(isOpened());
 * ```
 */
export function isOpened(): boolean {
  return library !== null;
}

/**
 * Unloads `advapi32.dll` and releases the loaded `node:ffi` module so a later
 * {@linkcode open} starts from a clean state. Safe to call when the backend
 * was never opened. Open registry keys must be closed before calling this.
 *
 * @example Usage
 * ```ts
 * import { close } from "@neotales/win-registry/ffi-node";
 *
 * close();
 * ```
 */
export function close(): void {
  if (!library) {
    return;
  }

  try {
    library.close?.();
  } finally {
    library = null;
    ffiModule = null;
  }
}

/**
 * Coerces a raw FFI call result into a Windows status code number.
 *
 * @param status The raw call result.
 * @returns The numeric status code.
 */
function toStatus(status: unknown): number {
  return Number(status);
}

/**
 * Converts a registry key handle into a pointer-width value for `node:ffi`.
 *
 * Predefined roots are sign-extended for the host pointer width; opened
 * handles pass through unchanged.
 *
 * @param hkey The native registry key handle.
 * @returns The pointer-sized handle.
 */
function hkeyPtr(hkey: bigint): bigint {
  return hkeyToNative(hkey, pointerWidth(process.arch));
}

/**
 * The Node.js FFI implementation of the {@linkcode RegistryBackend} contract,
 * backed by `advapi32.dll`. The library opens lazily on the first call; use
 * {@linkcode open}, {@linkcode isOpened}, and {@linkcode close} for explicit
 * control over the native library lifetime.
 *
 * @example Usage
 * ```ts
 * import { close, open } from "@neotales/win-registry/ffi-node";
 * import { backend } from "@neotales/win-registry/ffi-node";
 * import { HKEY_CURRENT_USER } from "@neotales/win-registry/types";
 *
 * open();
 * try {
 *   const handle = backend.openKey(HKEY_CURRENT_USER, "Software", 0x20019);
 *   console.log(handle);
 *   backend.closeKey(handle);
 * } finally {
 *   close();
 * }
 * ```
 */
export const backend: RegistryBackend = {
  /**
   * Opens a subkey of a predefined root handle.
   *
   * @param hkey The predefined root handle.
   * @param subKey The relative subkey path.
   * @param access The requested access rights.
   * @returns The native handle of the opened key.
   * @throws {Error} If `RegOpenKeyExW` fails.
   */
  openKey(hkey, subKey, access) {
    const wSubKey = stringToWide(subKey);
    const resultBuf = new Uint8Array(8);
    const status = toStatus(
      fns().RegOpenKeyExW(hkeyPtr(hkey), wSubKey, 0, access, resultBuf),
    );

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(
        `RegOpenKeyExW failed for "${subKey}" with error code ${status}`,
      );
    }

    return readU64(resultBuf);
  },

  /**
   * Creates a subkey of a predefined root handle, or opens it when it exists.
   *
   * @param hkey The predefined root handle.
   * @param subKey The relative subkey path.
   * @param access The requested access rights.
   * @returns The native handle and whether the key was newly created.
   * @throws {Error} If `RegCreateKeyExW` fails.
   */
  createKey(hkey, subKey, access) {
    const wSubKey = stringToWide(subKey);
    const handleBuf = new Uint8Array(8);
    const dispositionBuf = new Uint8Array(4);
    const status = toStatus(
      fns().RegCreateKeyExW(
        hkeyPtr(hkey),
        wSubKey,
        0,
        null,
        0,
        access,
        null,
        handleBuf,
        dispositionBuf,
      ),
    );
    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(
        `RegCreateKeyExW failed for "${subKey}" with error code ${status}`,
      );
    }

    return {
      handle: readU64(handleBuf),
      created: readU32(dispositionBuf) === 1,
    };
  },

  /**
   * Closes an opened key handle.
   *
   * @param hkey The native handle to close.
   */
  closeKey(hkey) {
    fns().RegCloseKey(hkeyPtr(hkey));
  },

  /**
   * Deletes a subkey.
   *
   * @param hkey The parent handle.
   * @param subKey The relative subkey path.
   * @returns A Windows status code where `0` means success.
   */
  deleteKey(hkey, subKey) {
    return toStatus(fns().RegDeleteKeyW(hkeyPtr(hkey), stringToWide(subKey)));
  },

  /**
   * Deletes a value.
   *
   * @param hkey The parent handle.
   * @param valueName The value name to delete.
   * @returns A Windows status code where `0` means success.
   */
  deleteValue(hkey, valueName) {
    return toStatus(fns().RegDeleteValueW(hkeyPtr(hkey), stringToWide(valueName)));
  },

  /**
   * Queries summary information about a key.
   *
   * @param hkey The native key handle.
   * @returns Counts and size limits for the key's subkeys and values.
   * @throws {Error} If `RegQueryInfoKeyW` fails.
   */
  queryInfoKey(hkey) {
    const subKeyCountBuf = new Uint8Array(4);
    const maxSubKeyLenBuf = new Uint8Array(4);
    const valueCountBuf = new Uint8Array(4);
    const maxValueNameLenBuf = new Uint8Array(4);
    const maxValueLenBuf = new Uint8Array(4);
    const lastWriteTimeBuf = new Uint8Array(8);
    const status = toStatus(
      fns().RegQueryInfoKeyW(
        hkeyPtr(hkey),
        null,
        null,
        null,
        subKeyCountBuf,
        maxSubKeyLenBuf,
        null,
        valueCountBuf,
        maxValueNameLenBuf,
        maxValueLenBuf,
        null,
        lastWriteTimeBuf,
      ),
    );

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(
        `RegQueryInfoKeyW failed with error code ${status}`,
      );
    }

    return {
      subKeyCount: readU32(subKeyCountBuf),
      maxSubKeyLength: readU32(maxSubKeyLenBuf),
      valueCount: readU32(valueCountBuf),
      maxValueNameLength: readU32(maxValueNameLenBuf),
      maxValueLength: readU32(maxValueLenBuf),
      lastWriteTime: Number(readU64(lastWriteTimeBuf)),
    };
  },

  /**
   * Enumerates a subkey name by index.
   *
   * @param hkey The native key handle.
   * @param index The zero-based subkey index.
   * @param nameBufferSize The maximum subkey name length in characters.
   * @returns The subkey name, or `null` when no more items exist.
   * @throws {Error} If `RegEnumKeyExW` fails unexpectedly.
   */
  enumKeyNames(hkey, index, nameBufferSize) {
    const nameBuf = new Uint8Array((nameBufferSize + 1) * 2);
    const sizeBuf = new Uint8Array(4);

    writeU32(sizeBuf, nameBufferSize + 1);

    const status = toStatus(
      fns().RegEnumKeyExW(
        hkeyPtr(hkey),
        index,
        nameBuf,
        sizeBuf,
        null,
        null,
        null,
        null,
      ),
    );

    if (status === ERROR_NO_MORE_ITEMS) {
      return null;
    }

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(`RegEnumKeyExW failed with error code ${status}`);
    }

    return wideToString(nameBuf, readU32(sizeBuf) * 2);
  },

  /**
   * Enumerates a value name by index.
   *
   * @param hkey The native key handle.
   * @param index The zero-based value index.
   * @param nameBufferSize The maximum value name length in characters.
   * @returns The value name, or `null` when no more items exist.
   * @throws {Error} If `RegEnumValueW` fails unexpectedly.
   */
  enumValueNames(hkey, index, nameBufferSize) {
    const nameBuf = new Uint8Array((nameBufferSize + 1) * 2);
    const sizeBuf = new Uint8Array(4);

    writeU32(sizeBuf, nameBufferSize + 1);

    const typeBuf = new Uint8Array(4);
    const status = toStatus(
      fns().RegEnumValueW(
        hkeyPtr(hkey),
        index,
        nameBuf,
        sizeBuf,
        null,
        typeBuf,
        null,
        null,
      ),
    );

    if (status === ERROR_NO_MORE_ITEMS) {
      return null;
    }

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(`RegEnumValueW failed with error code ${status}`);
    }

    return wideToString(nameBuf, readU32(sizeBuf) * 2);
  },

  /**
   * Reads a raw value and its type.
   *
   * @param hkey The native key handle.
   * @param valueName The value name to read.
   * @returns The value type and data, or `null` when the value is missing.
   */
  queryValue(hkey, valueName) {
    const wName = stringToWide(valueName);
    return readRegistryValue((buffer, typeBuf, sizeBuf) =>
      toStatus(
        fns().RegQueryValueExW(
          hkeyPtr(hkey),
          wName,
          null,
          typeBuf,
          buffer,
          sizeBuf,
        ),
      ),
    );
  },

  /**
   * Writes a raw value.
   *
   * @param hkey The native key handle.
   * @param valueName The value name to write.
   * @param type The registry value type.
   * @param data The encoded value data.
   * @throws {Error} If `RegSetValueExW` fails.
   */
  setValue(hkey, valueName, type, data) {
    const status = toStatus(
      fns().RegSetValueExW(
        hkeyPtr(hkey),
        stringToWide(valueName),
        0,
        type,
        data,
        data.length,
      ),
    );

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(
        `RegSetValueExW failed with error code ${status}`,
      );
    }
  },
};
