/**
 * txiki.js `tjs:ffi` bindings for Linux libsecret.
 *
 * The native symbol table and backend implementation are separate from the
 * `tjs:ffi` loader so the bindings can be tested on a host without the
 * txiki.js binary. C strings use the `buffer` argument type, nullable handles
 * use `ptr`, and returned `GError` values are read from the caller's pointer
 * buffer and freed with `g_error_free`.
 *
 * @module
 * @internal
 */
import { GCancellableHandle, LibsecretErrorHandle, prepareGCancellable, prepareLibsecretError, releaseGCancellable, SecretPasswordHandle, SecretSchemaHandle, setLibsecretError, } from "./types.js";
import { copyExactBytes, detectEndianness, readGSize, requireLibsecretAbi, widthFromByteSize, } from "./abi.js";
import { decodeUtf8 } from "./encoding.js";
/** The `libsecret-1.so.0` symbol table requested from `tjs:ffi`. */
export const TXIKI_LIBSECRET_SYMBOLS = {
    secret_schema_new: {
        args: ["buffer", "u32", "buffer", "u32", "buffer", "u32", "ptr"],
        returns: "ptr",
    },
    secret_password_lookup_sync: {
        args: ["ptr", "ptr", "buffer", "buffer", "buffer", "buffer", "buffer", "ptr"],
        returns: "ptr",
    },
    secret_password_store_sync: {
        args: [
            "ptr",
            "buffer",
            "buffer",
            "buffer",
            "ptr",
            "buffer",
            "buffer",
            "buffer",
            "buffer",
            "buffer",
            "ptr",
        ],
        returns: "i32",
    },
    secret_password_clear_sync: {
        args: ["ptr", "ptr", "buffer", "buffer", "buffer", "buffer", "buffer", "ptr"],
        returns: "i32",
    },
    secret_password_search_sync: {
        args: ["ptr", "u32", "ptr", "buffer", "buffer", "buffer", "ptr"],
        returns: "ptr",
    },
    secret_retrievable_get_attributes: { args: ["ptr"], returns: "ptr" },
    secret_retrievable_retrieve_secret_sync: { args: ["ptr", "ptr", "buffer"], returns: "ptr" },
    secret_value_get: { args: ["ptr", "buffer"], returns: "ptr" },
    secret_value_unref: { args: ["ptr"], returns: "void" },
    secret_password_free: { args: ["ptr"], returns: "void" },
};
/** The `libglib-2.0.so.0` symbol table requested from `tjs:ffi`. */
export const TXIKI_GLIB_SYMBOLS = {
    g_error_free: { args: ["ptr"], returns: "void" },
    g_hash_table_lookup: { args: ["ptr", "buffer"], returns: "ptr" },
    g_hash_table_unref: { args: ["ptr"], returns: "void" },
    g_list_free: { args: ["ptr"], returns: "void" },
};
/** The optional `libgio-2.0.so.0` symbol table requested from `tjs:ffi`. */
export const TXIKI_GIO_SYMBOLS = {
    g_cancellable_new: { args: [], returns: "ptr" },
    g_cancellable_cancel: { args: ["ptr"], returns: "void" },
};
/** The `libgobject-2.0.so.0` symbol table requested from `tjs:ffi`. */
export const TXIKI_GOBJECT_SYMBOLS = {
    g_object_unref: { args: ["ptr"], returns: "void" },
};
function pointerFromBuffer(ffi, buffer) {
    return ffi.read.ptr(ffi.bufferToPointer(buffer), 0);
}
function cstr(value) {
    const bytes = new TextEncoder().encode(value);
    const result = new Uint8Array(bytes.length + 1);
    result.set(bytes);
    return result;
}
/**
 * Creates the txiki.js libsecret backend and lifecycle helpers around an
 * already loaded `tjs:ffi` module.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export function createTxikiBackend(ffi, options = {}) {
    let libsecret = null;
    let glib = null;
    let gobject = null;
    let gio;
    const runtime = "tjs";
    const pointerSize = ffi.types?.pointer?.size;
    const sizeSize = ffi.types?.size?.size;
    const detectedWidth = pointerSize !== undefined && pointerSize === sizeSize
        ? widthFromByteSize(pointerSize)
        : null;
    let abiError = null;
    let abiWidth = null;
    try {
        abiWidth = requireLibsecretAbi(detectedWidth, options.endianness !== undefined ? options.endianness : detectEndianness());
    }
    catch (error) {
        abiError = error instanceof Error ? error : new Error(String(error));
    }
    function assertAbi() {
        if (abiError !== null)
            throw abiError;
    }
    function verifiedWidth() {
        assertAbi();
        return abiWidth;
    }
    function ensureGio() {
        if (gio === undefined) {
            try {
                gio = ffi.dlopen("libgio-2.0.so.0", TXIKI_GIO_SYMBOLS);
            }
            catch {
                gio = null;
            }
        }
        return gio;
    }
    function ensure() {
        if (libsecret === null) {
            libsecret = ffi.dlopen("libsecret-1.so.0", TXIKI_LIBSECRET_SYMBOLS);
        }
        if (glib === null)
            glib = ffi.dlopen("libglib-2.0.so.0", TXIKI_GLIB_SYMBOLS);
        if (gobject === null) {
            gobject = ffi.dlopen("libgobject-2.0.so.0", TXIKI_GOBJECT_SYMBOLS);
        }
        return { libsecret, glib, gobject };
    }
    function readCString(pointer) {
        const bytes = [];
        for (let index = 0;; index++) {
            const value = ffi.read.u8(pointer, index);
            if (value === 0)
                return new Uint8Array(bytes);
            bytes.push(value);
        }
    }
    function schemaPointer(handle) {
        const pointer = handle.valueOf();
        if (handle.runtime !== runtime || typeof pointer !== "object" || pointer === null) {
            throw new TypeError("Secret schema handle belongs to a different runtime.");
        }
        return pointer;
    }
    function passwordPointer(handle) {
        const pointer = handle.valueOf();
        if (handle.runtime !== runtime || typeof pointer !== "object" || pointer === null) {
            throw new TypeError("Secret password handle belongs to a different runtime.");
        }
        return pointer;
    }
    function cancellablePointer(handle) {
        prepareGCancellable(handle, runtime);
        const pointer = handle.valueOf();
        if (typeof pointer !== "object" || pointer === null) {
            throw new TypeError("GCancellable handle belongs to a different runtime.");
        }
        return pointer;
    }
    function captureError(errorOut, errorStorage) {
        const { glib } = ensure();
        const pointer = pointerFromBuffer(ffi, errorStorage);
        if (pointer === null)
            return;
        let message = "Unknown libsecret error";
        try {
            const messagePointer = ffi.read.ptr(pointer, 8);
            message = messagePointer === null
                ? message
                : new TextDecoder().decode(readCString(messagePointer));
        }
        finally {
            glib.symbols.g_error_free(pointer);
        }
        setLibsecretError(errorOut, new Error(message || "Unknown libsecret error"));
    }
    function secretSchemaNew(name, flags, attributeName1, attributeType1, attributeName2, attributeType2, terminator) {
        assertAbi();
        const { libsecret } = ensure();
        if (terminator !== null) {
            throw new TypeError("The libsecret attribute terminator must be null.");
        }
        const owners = [cstr(name), cstr(attributeName1), cstr(attributeName2)];
        const pointer = libsecret.symbols.secret_schema_new(owners[0], flags, owners[1], attributeType1, owners[2], attributeType2, null);
        void owners;
        return pointer === null ? null : new SecretSchemaHandle(runtime, pointer);
    }
    function secretPasswordLookupSync(schema, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
        assertAbi();
        const { libsecret } = ensure();
        if (terminator !== null) {
            throw new TypeError("The libsecret attribute terminator must be null.");
        }
        prepareLibsecretError(errorOut, runtime);
        const errorStorage = new Uint8Array(8);
        const owners = [
            cstr(attributeName1),
            cstr(attributeValue1),
            cstr(attributeName2),
            cstr(attributeValue2),
        ];
        const pointer = libsecret.symbols.secret_password_lookup_sync(schemaPointer(schema), cancellable === null ? null : cancellablePointer(cancellable), errorStorage, owners[0], owners[1], owners[2], owners[3], null);
        void owners;
        captureError(errorOut, errorStorage);
        if (pointer === null)
            return null;
        let text;
        try {
            text = decodeUtf8(readCString(pointer), "secret");
        }
        catch (error) {
            libsecret.symbols.secret_password_free(pointer);
            throw error;
        }
        return new SecretPasswordHandle(runtime, pointer, text);
    }
    function secretPasswordStoreSync(schema, collection, label, password, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
        assertAbi();
        const { libsecret } = ensure();
        if (terminator !== null) {
            throw new TypeError("The libsecret attribute terminator must be null.");
        }
        prepareLibsecretError(errorOut, runtime);
        const errorStorage = new Uint8Array(8);
        const owners = [
            cstr(collection),
            cstr(label),
            cstr(password),
            cstr(attributeName1),
            cstr(attributeValue1),
            cstr(attributeName2),
            cstr(attributeValue2),
        ];
        const stored = libsecret.symbols.secret_password_store_sync(schemaPointer(schema), owners[0], owners[1], owners[2], cancellable === null ? null : cancellablePointer(cancellable), errorStorage, owners[3], owners[4], owners[5], owners[6], null);
        void owners;
        captureError(errorOut, errorStorage);
        return Boolean(stored);
    }
    function secretPasswordClearSync(schema, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
        assertAbi();
        const { libsecret } = ensure();
        if (terminator !== null) {
            throw new TypeError("The libsecret attribute terminator must be null.");
        }
        prepareLibsecretError(errorOut, runtime);
        const errorStorage = new Uint8Array(8);
        const owners = [
            cstr(attributeName1),
            cstr(attributeValue1),
            cstr(attributeName2),
            cstr(attributeValue2),
        ];
        const cleared = libsecret.symbols.secret_password_clear_sync(schemaPointer(schema), cancellable === null ? null : cancellablePointer(cancellable), errorStorage, owners[0], owners[1], owners[2], owners[3], null);
        void owners;
        captureError(errorOut, errorStorage);
        return Boolean(cleared);
    }
    function secretPasswordFree(password) {
        assertAbi();
        assertAbi();
        const { libsecret } = ensure();
        libsecret.symbols.secret_password_free(passwordPointer(password));
    }
    function cancellableNew() {
        assertAbi();
        assertAbi();
        const gioLibrary = ensureGio();
        if (gioLibrary === null) {
            throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
        }
        const pointer = gioLibrary.symbols.g_cancellable_new();
        if (pointer === null)
            throw new Error("Failed to create GCancellable.");
        return new GCancellableHandle(runtime, pointer);
    }
    function cancellableCancel(cancellable) {
        assertAbi();
        assertAbi();
        const gioLibrary = ensureGio();
        if (gioLibrary === null) {
            throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
        }
        gioLibrary.symbols.g_cancellable_cancel(cancellablePointer(cancellable));
    }
    function cancellableRelease(cancellable) {
        assertAbi();
        assertAbi();
        const gioLibrary = ensureGio();
        if (gioLibrary === null) {
            throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
        }
        const { gobject } = ensure();
        const pointer = cancellablePointer(cancellable);
        releaseGCancellable(cancellable, runtime);
        gobject.symbols.g_object_unref(pointer);
    }
    let listSchema = null;
    function getListSchema() {
        if (listSchema === null) {
            const value = secretSchemaNew("org.freedesktop.Secret.Generic", 0, "service", 0, "account", 0, null);
            if (value === null)
                throw new Error("Failed to create libsecret schema.");
            listSchema = value;
        }
        return listSchema;
    }
    function listDataPointer(node) {
        return ffi.read.ptr(node, 0);
    }
    function listNextPointer(node) {
        return ffi.read.ptr(node, 8);
    }
    function listSecretRecords(service) {
        assertAbi();
        const width = verifiedWidth();
        const { libsecret, glib, gobject } = ensure();
        const errorStorage = new Uint8Array(8);
        const owners = [cstr("service"), cstr(service)];
        const list = libsecret.symbols.secret_password_search_sync(schemaPointer(getListSchema()), 2, null, errorStorage, owners[0], owners[1], null);
        void owners;
        const error = new LibsecretErrorHandle();
        prepareLibsecretError(error, runtime);
        captureError(error, errorStorage);
        const failure = error.error();
        if (failure !== null)
            throw failure;
        if (list === null)
            return [];
        const records = [];
        try {
            for (let node = list; node !== null; node = listNextPointer(node)) {
                const retrievable = listDataPointer(node);
                if (retrievable === null)
                    continue;
                const attributes = libsecret.symbols.secret_retrievable_get_attributes(retrievable);
                if (attributes === null)
                    continue;
                try {
                    const name = cstr("account");
                    const account = glib.symbols.g_hash_table_lookup(attributes, name);
                    void name;
                    if (account === null)
                        continue;
                    const secretStorage = new Uint8Array(8);
                    const value = libsecret.symbols.secret_retrievable_retrieve_secret_sync(retrievable, null, secretStorage);
                    const secretError = new LibsecretErrorHandle();
                    prepareLibsecretError(secretError, runtime);
                    captureError(secretError, secretStorage);
                    const secretFailure = secretError.error();
                    if (secretFailure !== null)
                        throw secretFailure;
                    if (value === null)
                        continue;
                    try {
                        const lengthBuffer = new Uint8Array(width / 8);
                        const secret = libsecret.symbols.secret_value_get(value, lengthBuffer);
                        const length = readGSize(lengthBuffer, 64);
                        if (secret === null) {
                            if (length !== 0)
                                throw new Error("secret_value_get returned a null pointer with a non-zero length");
                            records.push({
                                service,
                                account: decodeUtf8(readCString(account), "account"),
                                secret: new Uint8Array(0),
                            });
                        }
                        else {
                            records.push({
                                service,
                                account: decodeUtf8(readCString(account), "account"),
                                secret: copyExactBytes(length, (index) => ffi.read.u8(secret, index)),
                            });
                        }
                    }
                    finally {
                        libsecret.symbols.secret_value_unref(value);
                    }
                }
                finally {
                    glib.symbols.g_hash_table_unref(attributes);
                }
            }
        }
        finally {
            for (let node = list; node !== null; node = listNextPointer(node)) {
                const retrievable = listDataPointer(node);
                if (retrievable !== null)
                    gobject.symbols.g_object_unref(retrievable);
            }
            glib.symbols.g_list_free(list);
        }
        return records;
    }
    const gioReady = abiError === null ? ensureGio() : null;
    const backend = {
        runtime,
        listSecretRecords,
        secretSchemaNew,
        secretPasswordLookupSync,
        secretPasswordStoreSync,
        secretPasswordClearSync,
        secretPasswordFree,
        ...(gioReady === null ? {} : {
            gio: { cancellableNew, cancellableCancel, cancellableRelease },
        }),
    };
    return {
        backend,
        open() {
            assertAbi();
            ensure();
            ensureGio();
        },
        isOpened() {
            return libsecret !== null && glib !== null && gobject !== null;
        },
        close() {
            libsecret?.close();
            glib?.close();
            gobject?.close();
            gio?.close();
            libsecret = null;
            glib = null;
            gobject = null;
            gio = undefined;
        },
    };
}
export const LIBRARY_NAMES = [
    "libsecret-1.so.0",
    "libglib-2.0.so.0",
    "libgio-2.0.so.0",
    "libgobject-2.0.so.0",
];
