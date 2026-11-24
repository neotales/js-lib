import "./_dnt.polyfills.js";
import { GCancellableHandle, LibsecretErrorHandle, prepareGCancellable, prepareLibsecretError, releaseGCancellable, SecretPasswordHandle, SecretSchemaHandle, setLibsecretError, } from "./types.js";
import { copyExactBytes, detectEndianness, detectPointerWidth, readGSize, requireLibsecretAbi, } from "./abi.js";
import { decodeUtf8 } from "./encoding.js";
// Fail closed before loading native code: every operation parses 64-bit
// little-endian GError and pointer structures.
requireLibsecretAbi(detectPointerWidth(), detectEndianness());
const specifier = "bun:ffi";
const ffi = await import(/* @vite-ignore */ specifier);
const { dlopen, ptr, read } = ffi;
const libsecret = dlopen("libsecret-1.so.0", {
    secret_schema_new: { args: ["ptr", "u32", "ptr", "u32", "ptr", "u32", "ptr"], returns: "ptr" },
    secret_password_lookup_sync: {
        args: ["ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr"],
        returns: "ptr",
    },
    secret_password_store_sync: {
        args: ["ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr"],
        returns: "i32",
    },
    secret_password_clear_sync: {
        args: ["ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr", "ptr"],
        returns: "i32",
    },
    secret_password_search_sync: {
        args: ["ptr", "u32", "ptr", "ptr", "ptr", "ptr", "ptr"],
        returns: "ptr",
    },
    secret_password_free: { args: ["ptr"], returns: "void" },
});
const listing = dlopen("libsecret-1.so.0", {
    secret_retrievable_get_attributes: { args: ["ptr"], returns: "ptr" },
    secret_retrievable_retrieve_secret_sync: { args: ["ptr", "ptr", "ptr"], returns: "ptr" },
    secret_value_get: { args: ["ptr", "ptr"], returns: "ptr" },
    secret_value_unref: { args: ["ptr"], returns: "void" },
});
const glib = dlopen("libglib-2.0.so.0", {
    g_error_free: { args: ["ptr"], returns: "void" },
    g_hash_table_lookup: { args: ["ptr", "ptr"], returns: "ptr" },
    g_hash_table_unref: { args: ["ptr"], returns: "void" },
    g_list_free: { args: ["ptr"], returns: "void" },
});
let gio;
try {
    gio = dlopen("libgio-2.0.so.0", {
        g_cancellable_new: { args: [], returns: "ptr" },
        g_cancellable_cancel: { args: ["ptr"], returns: "void" },
    });
}
catch {
    // GIO is only needed for explicit GCancellable operations.
}
const gobject = dlopen("libgobject-2.0.so.0", {
    g_object_unref: { args: ["ptr"], returns: "void" },
});
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const runtime = "bun";
function cstr(value) {
    const bytes = encoder.encode(value);
    const result = new Uint8Array(bytes.length + 1);
    result.set(bytes);
    return result;
}
function readCString(pointer) {
    const bytes = [];
    for (let index = 0;; index++) {
        const value = read.u8(pointer, index);
        if (value === 0)
            return new Uint8Array(bytes);
        bytes.push(value);
    }
}
function schemaPointer(handle) {
    const pointer = handle.valueOf();
    if (handle.runtime !== runtime || typeof pointer !== "number")
        throw new TypeError("Secret schema handle belongs to a different runtime.");
    return pointer;
}
function passwordPointer(handle) {
    const pointer = handle.valueOf();
    if (handle.runtime !== runtime || typeof pointer !== "number")
        throw new TypeError("Secret password handle belongs to a different runtime.");
    return pointer;
}
function cancellablePointer(handle) {
    prepareGCancellable(handle, runtime);
    const pointer = handle.valueOf();
    if (typeof pointer !== "number")
        throw new TypeError("GCancellable handle belongs to a different runtime.");
    return pointer;
}
function captureError(errorOut, errorStorage) {
    const error = new DataView(errorStorage.buffer, errorStorage.byteOffset, errorStorage.byteLength)
        .getBigUint64(0, true);
    if (error === 0n)
        return;
    const pointer = Number(error);
    let message = "Unknown libsecret error";
    try {
        const messagePointer = read.ptr(pointer, 8);
        message = messagePointer === null ? message : decoder.decode(readCString(messagePointer));
    }
    finally {
        glib.symbols.g_error_free(pointer);
    }
    setLibsecretError(errorOut, new Error(message || "Unknown libsecret error"));
}
function secretSchemaNew(name, flags, attributeName1, attributeType1, attributeName2, attributeType2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    const pointer = libsecret.symbols.secret_schema_new(ptr(cstr(name)), flags, ptr(cstr(attributeName1)), attributeType1, ptr(cstr(attributeName2)), attributeType2, terminator);
    return pointer === null ? null : new SecretSchemaHandle(runtime, pointer);
}
function secretPasswordLookupSync(schema, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const pointer = libsecret.symbols.secret_password_lookup_sync(schemaPointer(schema), cancellable === null ? null : cancellablePointer(cancellable), ptr(errorStorage), ptr(cstr(attributeName1)), ptr(cstr(attributeValue1)), ptr(cstr(attributeName2)), ptr(cstr(attributeValue2)), terminator);
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
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const stored = libsecret.symbols.secret_password_store_sync(schemaPointer(schema), ptr(cstr(collection)), ptr(cstr(label)), ptr(cstr(password)), cancellable === null ? null : cancellablePointer(cancellable), ptr(errorStorage), ptr(cstr(attributeName1)), ptr(cstr(attributeValue1)), ptr(cstr(attributeName2)), ptr(cstr(attributeValue2)), terminator);
    captureError(errorOut, errorStorage);
    return Boolean(stored);
}
function secretPasswordClearSync(schema, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const cleared = libsecret.symbols.secret_password_clear_sync(schemaPointer(schema), cancellable === null ? null : cancellablePointer(cancellable), ptr(errorStorage), ptr(cstr(attributeName1)), ptr(cstr(attributeValue1)), ptr(cstr(attributeName2)), ptr(cstr(attributeValue2)), terminator);
    captureError(errorOut, errorStorage);
    return Boolean(cleared);
}
function secretPasswordFree(password) {
    libsecret.symbols.secret_password_free(passwordPointer(password));
}
function cancellableNew() {
    if (gio === undefined)
        throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    const pointer = gio.symbols.g_cancellable_new();
    if (pointer === null)
        throw new Error("Failed to create GCancellable.");
    return new GCancellableHandle(runtime, pointer);
}
function cancellableCancel(cancellable) {
    if (gio === undefined)
        throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    gio.symbols.g_cancellable_cancel(cancellablePointer(cancellable));
}
function cancellableRelease(cancellable) {
    if (gio === undefined)
        throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    const pointer = cancellablePointer(cancellable);
    releaseGCancellable(cancellable, runtime);
    gobject.symbols.g_object_unref(pointer);
}
let listSchema = null;
function getListSchema() {
    if (listSchema === null) {
        const schema = secretSchemaNew("org.freedesktop.Secret.Generic", 0, "service", 0, "account", 0, null);
        if (schema === null)
            throw new Error("Failed to create libsecret schema.");
        listSchema = schema;
    }
    return listSchema;
}
function listDataPointer(node) {
    return read.ptr(node, 0);
}
function listNextPointer(node) {
    return read.ptr(node, 8);
}
function listSecretRecords(service) {
    const width = 64;
    const errorOut = new LibsecretErrorHandle();
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const owners = [cstr("service"), cstr(service)];
    const list = libsecret.symbols.secret_password_search_sync(schemaPointer(getListSchema()), 2, null, ptr(errorStorage), ptr(owners[0]), ptr(owners[1]), null);
    void owners;
    captureError(errorOut, errorStorage);
    const error = errorOut.error();
    if (error !== null)
        throw error;
    if (list === null)
        return [];
    const records = [];
    try {
        for (let node = list; node !== null; node = listNextPointer(node)) {
            const retrievable = listDataPointer(node);
            if (retrievable === null)
                continue;
            const attributes = listing.symbols.secret_retrievable_get_attributes(retrievable);
            if (attributes === null)
                continue;
            try {
                const name = cstr("account");
                const account = glib.symbols.g_hash_table_lookup(attributes, ptr(name));
                void name;
                if (account === null)
                    continue;
                const secretError = new Uint8Array(8);
                const value = listing.symbols.secret_retrievable_retrieve_secret_sync(retrievable, null, ptr(secretError));
                captureError(errorOut, secretError);
                const secretFailure = errorOut.error();
                if (secretFailure !== null)
                    throw secretFailure;
                if (value === null)
                    continue;
                try {
                    const secretLength = new Uint8Array(width / 8);
                    const secret = listing.symbols.secret_value_get(value, ptr(secretLength));
                    const length = readGSize(secretLength, 64);
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
                            secret: copyExactBytes(length, (index) => read.u8(secret, index)),
                        });
                    }
                }
                finally {
                    listing.symbols.secret_value_unref(value);
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
export const backend = {
    runtime,
    secretSchemaNew,
    secretPasswordLookupSync,
    secretPasswordStoreSync,
    secretPasswordClearSync,
    secretPasswordFree,
    ...(gio === undefined ? {} : {
        gio: { cancellableNew, cancellableCancel, cancellableRelease },
    }),
    listSecretRecords,
};
