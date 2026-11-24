/**
 * Deno FFI backend for Windows Registry operations.
 *
 * Loads `advapi32.dll` through Deno FFI, which requires the `--allow-ffi`
 * permission flag. Because opening the library is a side effectful operation,
 * the backend exposes an explicit lifecycle: {@linkcode open} eagerly opens
 * `advapi32.dll`, {@linkcode close} unloads it again, and {@linkcode isOpened}
 * reports the current state. The library also loads lazily on the first
 * backend call when {@linkcode open} was never used.
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

/** An opened Deno dynamic library with its resolved symbols. */
interface DenoLibrary {
  /** The resolved FFI entry points, keyed by symbol name. */
  symbols: Record<string, (...args: unknown[]) => number>;
  /** Unloads the library. */
  close(): void;
}

let library: DenoLibrary | null = null;

/**
 * The `advapi32.dll` symbol table requested from Deno FFI.
 */
const SYMBOLS = {
  RegOpenKeyExW: {
    parameters: ["pointer", "buffer", "u32", "u32", "buffer"],
    result: "i32",
  },
  RegCreateKeyExW: {
    parameters: [
      "pointer",
      "buffer",
      "u32",
      "pointer",
      "u32",
      "u32",
      "pointer",
      "buffer",
      "buffer",
    ],
    result: "i32",
  },
  RegCloseKey: { parameters: ["pointer"], result: "i32" },
  RegDeleteKeyW: { parameters: ["pointer", "buffer"], result: "i32" },
  RegDeleteValueW: { parameters: ["pointer", "buffer"], result: "i32" },
  RegQueryInfoKeyW: {
    parameters: [
      "pointer",
      "pointer",
      "pointer",
      "pointer",
      "buffer",
      "buffer",
      "pointer",
      "buffer",
      "buffer",
      "buffer",
      "pointer",
      "buffer",
    ],
    result: "i32",
  },
  RegEnumKeyExW: {
    parameters: [
      "pointer",
      "u32",
      "buffer",
      "buffer",
      "pointer",
      "pointer",
      "pointer",
      "pointer",
    ],
    result: "i32",
  },
  RegEnumValueW: {
    parameters: [
      "pointer",
      "u32",
      "buffer",
      "buffer",
      "pointer",
      "buffer",
      "buffer",
      "buffer",
    ],
    result: "i32",
  },
  RegQueryValueExW: {
    parameters: ["pointer", "buffer", "pointer", "buffer", "buffer", "buffer"],
    result: "i32",
  },
  RegSetValueExW: {
    parameters: ["pointer", "buffer", "u32", "u32", "buffer", "u32"],
    result: "i32",
  },
} as const;

/**
 * Opens `advapi32.dll` exactly once, reusing the opened
 * library on subsequent calls.
 *
 * @returns The opened Deno dynamic library.
 * @throws {Error} If not running under Deno or if opening `advapi32.dll`
 * fails, e.g. when the `--allow-ffi` permission flag is missing.
 */
function ensureLoaded(): DenoLibrary {
  if (library) {
    return library;
  }

  if (typeof globalThis.Deno === "undefined") {
    throw new RegistryError("Deno runtime is required for this backend");
  }

  try {
    library = Deno.dlopen("advapi32.dll", SYMBOLS) as unknown as DenoLibrary;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new RegistryError(
      `Failed to open "advapi32.dll" via Deno FFI (requires --allow-ffi): ${reason}`,
      { cause: error },
    );
  }

  return library;
}

/**
 * Returns the resolved FFI entry points, opening `advapi32.dll` if
 * {@linkcode open} has not been called yet.
 *
 * @returns The resolved symbol functions.
 * @throws {Error} If the library cannot be loaded.
 */
function fns(): Record<string, (...args: unknown[]) => number> {
  return ensureLoaded().symbols;
}

/**
 * Converts a registry key handle into a Deno pointer without losing the
 * pointer-width sign extension on predefined roots.
 *
 * @param hkey The native registry key handle.
 * @returns The pointer-sized handle.
 */
function hkeyPtr(hkey: bigint): Deno.PointerValue {
  return Deno.UnsafePointer.create(
    hkeyToNative(hkey, pointerWidth(Deno.build.arch)),
  );
}

/**
 * Eagerly opens `advapi32.dll` through Deno FFI.
 *
 * Call this at startup to fail fast when the `--allow-ffi` permission is
 * missing; otherwise the library loads lazily on the first backend call.
 * Repeated calls are no-ops while the backend stays open.
 *
 * @throws {Error} If the library cannot be loaded.
 *
 * @example Usage
 * ```ts
 * import { open } from "@neotales/win-registry/ffi-deno";
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
 * import { isOpened } from "@neotales/win-registry/ffi-deno";
 *
 * console.log(isOpened());
 * ```
 */
export function isOpened(): boolean {
  return library !== null;
}

/**
 * Unloads `advapi32.dll` so a later {@linkcode open} starts from a clean
 * state. Safe to call when the backend was never opened. Open registry keys
 * must be closed before calling this.
 *
 * @example Usage
 * ```ts
 * import { close } from "@neotales/win-registry/ffi-deno";
 *
 * close();
 * ```
 */
export function close(): void {
  if (!library) {
    return;
  }
  try {
    library.close();
  } finally {
    library = null;
  }
}

/**
 * The Deno FFI implementation of the {@linkcode RegistryBackend} contract,
 * backed by `advapi32.dll`. The library opens lazily on the first call; use
 * {@linkcode open}, {@linkcode isOpened}, and {@linkcode close} for explicit
 * control over the native library lifetime.
 *
 * @example Usage
 * ```ts
 * import { backend, close, open } from "@neotales/win-registry/ffi-deno";
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
  openKey(hkey, subKey, access) {
    const wSubKey = stringToWide(subKey);
    const resultBuf = new Uint8Array(8);
    const status = fns().RegOpenKeyExW(
      hkeyPtr(hkey),
      wSubKey,
      0,
      access,
      resultBuf,
    );

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(
        `RegOpenKeyExW failed for "${subKey}" with error code ${status}`,
      );
    }

    return readU64(resultBuf);
  },
  createKey(hkey, subKey, access) {
    const wSubKey = stringToWide(subKey);
    const handleBuf = new Uint8Array(8);
    const dispositionBuf = new Uint8Array(4);
    const status = fns().RegCreateKeyExW(
      hkeyPtr(hkey),
      wSubKey,
      0,
      null,
      0,
      access,
      null,
      handleBuf,
      dispositionBuf,
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
  closeKey(hkey) {
    fns().RegCloseKey(hkeyPtr(hkey));
  },
  deleteKey(hkey, subKey) {
    return fns()
      .RegDeleteKeyW(
        hkeyPtr(hkey),
        stringToWide(subKey),
      );
  },
  deleteValue(hkey, valueName) {
    return fns().RegDeleteValueW(
      hkeyPtr(hkey),
      stringToWide(valueName),
    );
  },
  queryInfoKey(hkey) {
    const subKeyCountBuf = new Uint8Array(4);
    const maxSubKeyLenBuf = new Uint8Array(4);
    const valueCountBuf = new Uint8Array(4);
    const maxValueNameLenBuf = new Uint8Array(4);
    const maxValueLenBuf = new Uint8Array(4);
    const lastWriteTimeBuf = new Uint8Array(8);
    const status = fns().RegQueryInfoKeyW(
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
  enumKeyNames(hkey, index, nameBufferSize) {
    const nameBuf = new Uint8Array((nameBufferSize + 1) * 2);
    const sizeBuf = new Uint8Array(4);

    writeU32(sizeBuf, nameBufferSize + 1);

    const status = fns().RegEnumKeyExW(
      hkeyPtr(hkey),
      index,
      nameBuf,
      sizeBuf,
      null,
      null,
      null,
      null,
    );

    if (status === ERROR_NO_MORE_ITEMS) {
      return null;
    }

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(`RegEnumKeyExW failed with error code ${status}`);
    }

    return wideToString(nameBuf, readU32(sizeBuf) * 2);
  },
  enumValueNames(hkey, index, nameBufferSize) {
    const nameBuf = new Uint8Array((nameBufferSize + 1) * 2);
    const sizeBuf = new Uint8Array(4);

    writeU32(sizeBuf, nameBufferSize + 1);

    const typeBuf = new Uint8Array(4);
    const status = fns().RegEnumValueW(
      hkeyPtr(hkey),
      index,
      nameBuf,
      sizeBuf,
      null,
      typeBuf,
      null,
      null,
    );

    if (status === ERROR_NO_MORE_ITEMS) {
      return null;
    }

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(`RegEnumValueW failed with error code ${status}`);
    }

    return wideToString(nameBuf, readU32(sizeBuf) * 2);
  },
  queryValue(hkey, valueName) {
    const wName = stringToWide(valueName);
    return readRegistryValue((buffer, typeBuf, sizeBuf) =>
      fns().RegQueryValueExW(
        hkeyPtr(hkey),
        wName,
        null,
        typeBuf,
        buffer,
        sizeBuf,
      ),
    );
  },
  setValue(hkey, valueName, type, data) {
    const status = fns().RegSetValueExW(
      hkeyPtr(hkey),
      stringToWide(valueName),
      0,
      type,
      data,
      data.length,
    );

    if (status !== ERROR_SUCCESS) {
      throw new RegistryError(
        `RegSetValueExW failed with error code ${status}`,
      );
    }
  },
};
