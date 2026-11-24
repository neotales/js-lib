/** Node.js FFI bindings for Linux libsecret. */
import "./_dnt.polyfills.js";
import { createRequire } from "node:module";
import { GCancellableHandle, prepareGCancellable, prepareLibsecretError, releaseGCancellable, SecretPasswordHandle, SecretSchemaHandle, setLibsecretError, } from "./types.js";
import { copyExactBytes, detectEndianness, detectPointerWidth, readGSize, requireLibsecretAbi, } from "./abi.js";
import { decodeUtf8 } from "./encoding.js";
// Fail closed before loading native code: every operation parses 64-bit
// little-endian GError and pointer structures.
requireLibsecretAbi(detectPointerWidth(), detectEndianness());
const require = createRequire(globalThis[Symbol.for("import-meta-ponyfill-esmodule")](import.meta).url);
// deno-lint-ignore no-explicit-any -- node:ffi has no ambient type declarations.
let ffi;
const specifier = "node:ffi";
try {
    ffi = require(specifier);
}
catch (cause) {
    throw new Error("Unable to load node:ffi. Run Node.js >= 26 with --experimental-ffi.", { cause });
}
const libsecret = ffi.dlopen("libsecret-1.so.0", {
    secret_schema_new: {
        arguments: ["pointer", "u32", "pointer", "u32", "pointer", "u32", "pointer"],
        return: "pointer",
    },
    secret_password_lookup_sync: {
        arguments: [
            "pointer",
            "pointer",
            "pointer",
            "pointer",
            "pointer",
            "pointer",
            "pointer",
            "pointer",
        ],
        return: "pointer",
    },
    secret_password_store_sync: {
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
        ],
        return: "u8",
    },
    secret_password_clear_sync: {
        arguments: [
            "pointer",
            "pointer",
            "pointer",
            "pointer",
            "pointer",
            "pointer",
            "pointer",
            "pointer",
        ],
        return: "u8",
    },
    secret_password_search_sync: {
        arguments: ["pointer", "u32", "pointer", "pointer", "pointer", "pointer", "pointer"],
        return: "pointer",
    },
    secret_retrievable_get_attributes: { arguments: ["pointer"], return: "pointer" },
    secret_retrievable_retrieve_secret_sync: {
        arguments: ["pointer", "pointer", "pointer"],
        return: "pointer",
    },
    secret_value_get: { arguments: ["pointer", "pointer"], return: "pointer" },
    secret_value_unref: { arguments: ["pointer"], return: "void" },
    secret_password_free: { arguments: ["pointer"], return: "void" },
});
const glib = ffi.dlopen("libglib-2.0.so.0", {
    g_error_free: { arguments: ["pointer"], return: "void" },
    g_hash_table_lookup: { arguments: ["pointer", "pointer"], return: "pointer" },
    g_hash_table_unref: { arguments: ["pointer"], return: "void" },
    g_list_free: { arguments: ["pointer"], return: "void" },
});
const gobject = ffi.dlopen("libgobject-2.0.so.0", {
    g_object_unref: { arguments: ["pointer"], return: "void" },
});
const gio = (() => {
    try {
        return ffi.dlopen("libgio-2.0.so.0", {
            g_cancellable_new: { arguments: [], return: "pointer" },
            g_cancellable_cancel: { arguments: ["pointer"], return: "void" },
        });
    }
    catch {
        return undefined;
    }
})();
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const runtime = "node";
let listSchema = null;
function cstr(value) {
    const bytes = encoder.encode(value);
    const result = new Uint8Array(bytes.length + 1);
    result.set(bytes);
    return result;
}
function readCString(pointer) {
    const bytes = [];
    for (let index = 0;; index++) {
        const value = ffi.getUint8(pointer, index);
        if (value === 0)
            return new Uint8Array(bytes);
        bytes.push(value);
    }
}
function schemaPointer(handle) {
    if (handle.runtime !== runtime || typeof handle.valueOf() !== "bigint")
        throw new TypeError("Secret schema handle belongs to a different runtime.");
    return handle.valueOf();
}
function passwordPointer(handle) {
    if (handle.runtime !== runtime || typeof handle.valueOf() !== "bigint")
        throw new TypeError("Secret password handle belongs to a different runtime.");
    return handle.valueOf();
}
function cancellablePointer(handle) {
    prepareGCancellable(handle, runtime);
    if (typeof handle.valueOf() !== "bigint")
        throw new TypeError("GCancellable handle belongs to a different runtime.");
    return handle.valueOf();
}
function throwIfError(errorOut) {
    const error = new DataView(errorOut.buffer, errorOut.byteOffset, errorOut.byteLength)
        .getBigUint64(0, true);
    if (error === 0n)
        return;
    const messagePointer = ffi.getUint64(error, 8);
    const message = messagePointer
        ? decoder.decode(readCString(messagePointer))
        : "Unknown libsecret error";
    glib.functions.g_error_free(error);
    throw new Error(message);
}
function captureError(errorOut, errorStorage) {
    const error = new DataView(errorStorage.buffer, errorStorage.byteOffset, errorStorage.byteLength)
        .getBigUint64(0, true);
    if (error === 0n)
        return;
    let message = "Unknown libsecret error";
    try {
        const messagePointer = ffi.getUint64(error, 8);
        message = messagePointer ? decoder.decode(readCString(messagePointer)) : message;
    }
    finally {
        glib.functions.g_error_free(error);
    }
    setLibsecretError(errorOut, new Error(message || "Unknown libsecret error"));
}
function secretSchemaNew(name, flags, attributeName1, attributeType1, attributeName2, attributeType2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    const pointer = libsecret.functions.secret_schema_new(cstr(name), flags, cstr(attributeName1), attributeType1, cstr(attributeName2), attributeType2, terminator);
    return pointer ? new SecretSchemaHandle(runtime, pointer) : null;
}
function secretPasswordLookupSync(schema, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const pointer = libsecret.functions.secret_password_lookup_sync(schemaPointer(schema), cancellable === null ? null : cancellablePointer(cancellable), errorStorage, cstr(attributeName1), cstr(attributeValue1), cstr(attributeName2), cstr(attributeValue2), terminator);
    captureError(errorOut, errorStorage);
    if (!pointer)
        return null;
    let text;
    try {
        text = decodeUtf8(readCString(pointer), "secret");
    }
    catch (error) {
        libsecret.functions.secret_password_free(pointer);
        throw error;
    }
    return new SecretPasswordHandle(runtime, pointer, text);
}
function secretPasswordStoreSync(schema, collection, label, password, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const stored = libsecret.functions.secret_password_store_sync(schemaPointer(schema), cstr(collection), cstr(label), cstr(password), cancellable === null ? null : cancellablePointer(cancellable), errorStorage, cstr(attributeName1), cstr(attributeValue1), cstr(attributeName2), cstr(attributeValue2), terminator);
    captureError(errorOut, errorStorage);
    return Boolean(stored);
}
function secretPasswordClearSync(schema, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const cleared = libsecret.functions.secret_password_clear_sync(schemaPointer(schema), cancellable === null ? null : cancellablePointer(cancellable), errorStorage, cstr(attributeName1), cstr(attributeValue1), cstr(attributeName2), cstr(attributeValue2), terminator);
    captureError(errorOut, errorStorage);
    return Boolean(cleared);
}
function secretPasswordFree(password) {
    libsecret.functions.secret_password_free(passwordPointer(password));
}
function cancellableNew() {
    if (gio === undefined)
        throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    const pointer = gio.functions.g_cancellable_new();
    if (!pointer)
        throw new Error("Failed to create GCancellable.");
    return new GCancellableHandle(runtime, pointer);
}
function cancellableCancel(cancellable) {
    if (gio === undefined)
        throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    gio.functions.g_cancellable_cancel(cancellablePointer(cancellable));
}
function cancellableRelease(cancellable) {
    if (gio === undefined)
        throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    const pointer = cancellablePointer(cancellable);
    releaseGCancellable(cancellable, runtime);
    gobject.functions.g_object_unref(pointer);
}
function getListSchema() {
    if (listSchema === null) {
        const schema = secretSchemaNew("org.freedesktop.Secret.Generic", 0, "service", 0, "account", 0, null);
        if (schema === null)
            throw new Error("Failed to create libsecret schema.");
        listSchema = schema;
    }
    return listSchema;
}
function listDataPointer(list) {
    return ffi.getUint64(list, 0);
}
function listNextPointer(list) {
    return ffi.getUint64(list, 8);
}
function listSecretRecords(service) {
    const width = 64;
    const errorOut = new Uint8Array(8);
    const list = libsecret.functions.secret_password_search_sync(schemaPointer(getListSchema()), 2, null, errorOut, cstr("service"), cstr(service), null);
    throwIfError(errorOut);
    if (!list)
        return [];
    const records = [];
    try {
        for (let node = list; node; node = listNextPointer(node)) {
            const retrievable = listDataPointer(node);
            if (!retrievable)
                continue;
            const attributes = libsecret.functions.secret_retrievable_get_attributes(retrievable);
            try {
                const account = glib.functions.g_hash_table_lookup(attributes, cstr("account"));
                if (!account)
                    continue;
                const secretError = new Uint8Array(8);
                const value = libsecret.functions.secret_retrievable_retrieve_secret_sync(retrievable, null, secretError);
                throwIfError(secretError);
                if (!value)
                    continue;
                try {
                    const secretLength = new Uint8Array(width / 8);
                    const secret = libsecret.functions.secret_value_get(value, secretLength);
                    const length = readGSize(secretLength, 64);
                    if (!secret) {
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
                            secret: copyExactBytes(length, (index) => ffi.getUint8(secret, index)),
                        });
                    }
                }
                finally {
                    libsecret.functions.secret_value_unref(value);
                }
            }
            finally {
                glib.functions.g_hash_table_unref(attributes);
            }
        }
    }
    finally {
        for (let node = list; node; node = listNextPointer(node)) {
            const retrievable = listDataPointer(node);
            if (retrievable)
                gobject.functions.g_object_unref(retrievable);
        }
        glib.functions.g_list_free(list);
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
