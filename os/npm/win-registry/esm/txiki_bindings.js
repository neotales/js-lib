/**
 * txiki.js `tjs:ffi` bindings for Windows Registry operations.
 *
 * The module separates the native symbol table and backend implementation from
 * the `tjs:ffi` loader so the bindings can be tested on a host without the
 * txiki.js binary. Numeric registry handles are converted to native pointers
 * with `createPointer`, and wide strings stay in the `buffer` argument type.
 *
 * @module
 * @internal
 */
import { RegistryError } from "./registry_error.js";
import { readU32, readU64, writeU32 } from "./binary.js";
import { hkeyToNative, pointerWidth, } from "./hkey.js";
import { readRegistryValue } from "./query_value.js";
import { ERROR_NO_MORE_ITEMS, ERROR_SUCCESS, stringToWide, wideToString, } from "./types.js";
/**
 * The `advapi32.dll` symbol table requested from `tjs:ffi`.
 *
 * `ptr` accepts a `NativePointer`, `null`, or a `Uint8Array`; `buffer` is a
 * `Uint8Array` argument. Registry handles are passed as pointers created with
 * `createPointer`.
 */
export const TXIKI_SYMBOLS = {
    RegOpenKeyExW: {
        args: ["ptr", "buffer", "u32", "u32", "buffer"],
        returns: "i32",
    },
    RegCreateKeyExW: {
        args: ["ptr", "buffer", "u32", "ptr", "u32", "u32", "ptr", "buffer", "buffer"],
        returns: "i32",
    },
    RegCloseKey: { args: ["ptr"], returns: "i32" },
    RegDeleteKeyW: { args: ["ptr", "buffer"], returns: "i32" },
    RegDeleteValueW: { args: ["ptr", "buffer"], returns: "i32" },
    RegQueryInfoKeyW: {
        args: [
            "ptr",
            "ptr",
            "ptr",
            "ptr",
            "buffer",
            "buffer",
            "ptr",
            "buffer",
            "buffer",
            "buffer",
            "ptr",
            "buffer",
        ],
        returns: "i32",
    },
    RegEnumKeyExW: {
        args: ["ptr", "u32", "buffer", "buffer", "ptr", "ptr", "ptr", "ptr"],
        returns: "i32",
    },
    RegEnumValueW: {
        args: ["ptr", "u32", "buffer", "buffer", "ptr", "buffer", "ptr", "ptr"],
        returns: "i32",
    },
    RegQueryValueExW: {
        args: ["ptr", "buffer", "ptr", "buffer", "buffer", "buffer"],
        returns: "i32",
    },
    RegSetValueExW: {
        args: ["ptr", "buffer", "u32", "u32", "buffer", "u32"],
        returns: "i32",
    },
};
/**
 * Creates the txiki.js registry backend and lifecycle helpers around an
 * already loaded `tjs:ffi` module.
 *
 * The returned functions share one lazily opened `advapi32.dll` handle. Keys
 * opened through the backend keep their native handles; callers must close
 * them before {@linkcode close}.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @param width The host pointer width used for predefined registry roots.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export function createTxikiBackend(ffi, width = pointerWidth(undefined)) {
    let library = null;
    function ensureLoaded() {
        if (library)
            return library;
        library = ffi.dlopen("advapi32.dll", TXIKI_SYMBOLS);
        return library;
    }
    function fns() {
        return ensureLoaded().symbols;
    }
    function handle(hkey) {
        return ffi.createPointer(hkeyToNative(hkey, width));
    }
    /** Number() on an FFI `i32` result, which is a JS number. */
    function status(value) {
        return typeof value === "number" ? value : Number(value);
    }
    const backend = {
        openKey(hkey, subKey, access) {
            const resultBuf = new Uint8Array(8);
            const code = status(fns().RegOpenKeyExW(handle(hkey), stringToWide(subKey), 0, access, resultBuf));
            if (code !== ERROR_SUCCESS) {
                throw new RegistryError(`RegOpenKeyExW failed for "${subKey}" with error code ${code}`);
            }
            return readU64(resultBuf);
        },
        createKey(hkey, subKey, access) {
            const handleBuf = new Uint8Array(8);
            const dispositionBuf = new Uint8Array(4);
            const code = status(fns().RegCreateKeyExW(handle(hkey), stringToWide(subKey), 0, null, 0, access, null, handleBuf, dispositionBuf));
            if (code !== ERROR_SUCCESS) {
                throw new RegistryError(`RegCreateKeyExW failed for "${subKey}" with error code ${code}`);
            }
            return {
                handle: readU64(handleBuf),
                created: readU32(dispositionBuf) === 1,
            };
        },
        closeKey(hkey) {
            fns().RegCloseKey(handle(hkey));
        },
        deleteKey(hkey, subKey) {
            return status(fns().RegDeleteKeyW(handle(hkey), stringToWide(subKey)));
        },
        deleteValue(hkey, valueName) {
            return status(fns().RegDeleteValueW(handle(hkey), stringToWide(valueName)));
        },
        queryInfoKey(hkey) {
            const subKeyCountBuf = new Uint8Array(4);
            const maxSubKeyLenBuf = new Uint8Array(4);
            const valueCountBuf = new Uint8Array(4);
            const maxValueNameLenBuf = new Uint8Array(4);
            const maxValueLenBuf = new Uint8Array(4);
            const lastWriteTimeBuf = new Uint8Array(8);
            const code = status(fns().RegQueryInfoKeyW(handle(hkey), null, null, null, subKeyCountBuf, maxSubKeyLenBuf, null, valueCountBuf, maxValueNameLenBuf, maxValueLenBuf, null, lastWriteTimeBuf));
            if (code !== ERROR_SUCCESS) {
                throw new RegistryError(`RegQueryInfoKeyW failed with error code ${code}`);
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
            const code = status(fns().RegEnumKeyExW(handle(hkey), index, nameBuf, sizeBuf, null, null, null, null));
            if (code === ERROR_NO_MORE_ITEMS)
                return null;
            if (code !== ERROR_SUCCESS) {
                throw new RegistryError(`RegEnumKeyExW failed with error code ${code}`);
            }
            return wideToString(nameBuf, readU32(sizeBuf) * 2);
        },
        enumValueNames(hkey, index, nameBufferSize) {
            const nameBuf = new Uint8Array((nameBufferSize + 1) * 2);
            const sizeBuf = new Uint8Array(4);
            const typeBuf = new Uint8Array(4);
            writeU32(sizeBuf, nameBufferSize + 1);
            const code = status(fns().RegEnumValueW(handle(hkey), index, nameBuf, sizeBuf, null, typeBuf, null, null));
            if (code === ERROR_NO_MORE_ITEMS)
                return null;
            if (code !== ERROR_SUCCESS) {
                throw new RegistryError(`RegEnumValueW failed with error code ${code}`);
            }
            return wideToString(nameBuf, readU32(sizeBuf) * 2);
        },
        queryValue(hkey, valueName) {
            const wName = stringToWide(valueName);
            return readRegistryValue((buffer, typeBuf, sizeBuf) => status(fns().RegQueryValueExW(handle(hkey), wName, null, typeBuf, buffer, sizeBuf)));
        },
        setValue(hkey, valueName, type, data) {
            const code = status(fns().RegSetValueExW(handle(hkey), stringToWide(valueName), 0, type, data, data.length));
            if (code !== ERROR_SUCCESS) {
                throw new RegistryError(`RegSetValueExW failed with error code ${code}`);
            }
        },
    };
    return {
        backend,
        open: ensureLoaded,
        isOpened: () => library !== null,
        close: () => {
            if (!library)
                return;
            try {
                library.close();
            }
            finally {
                library = null;
            }
        },
    };
}
