import "./_dnt.polyfills.js";
import { GCancellableHandle, prepareGCancellable, prepareLibsecretError, releaseGCancellable, SecretPasswordHandle, SecretSchemaHandle, setLibsecretError, } from "./types.js";
import { copyExactBytes, detectEndianness, detectPointerWidth, readGSize, requireLibsecretAbi, } from "./abi.js";
import { decodeUtf8 } from "./encoding.js";
// Fail closed before loading native code: every operation parses 64-bit
// little-endian GError and pointer structures.
requireLibsecretAbi(detectPointerWidth(), detectEndianness());
// deno-lint-ignore no-explicit-any
const deno = globalThis.Deno;
const libsecret = deno.dlopen("libsecret-1.so.0", {
    secret_schema_new: {
        parameters: ["buffer", "u32", "buffer", "u32", "buffer", "u32", "pointer"],
        result: "pointer",
    },
    secret_password_lookup_sync: {
        parameters: [
            "pointer",
            "pointer",
            "buffer",
            "buffer",
            "buffer",
            "buffer",
            "buffer",
            "pointer",
        ],
        result: "pointer",
    },
    secret_password_store_sync: {
        parameters: [
            "pointer",
            "buffer",
            "buffer",
            "buffer",
            "pointer",
            "buffer",
            "buffer",
            "buffer",
            "buffer",
            "buffer",
            "pointer",
        ],
        result: "i32",
    },
    secret_password_clear_sync: {
        parameters: [
            "pointer",
            "pointer",
            "buffer",
            "buffer",
            "buffer",
            "buffer",
            "buffer",
            "pointer",
        ],
        result: "i32",
    },
    secret_password_search_sync: {
        parameters: ["pointer", "u32", "pointer", "buffer", "buffer", "buffer", "pointer"],
        result: "pointer",
    },
    secret_password_free: { parameters: ["pointer"], result: "void" },
});
const glib = deno.dlopen("libglib-2.0.so.0", {
    g_error_free: { parameters: ["pointer"], result: "void" },
    g_hash_table_lookup: { parameters: ["pointer", "buffer"], result: "pointer" },
    g_hash_table_unref: { parameters: ["pointer"], result: "void" },
    g_list_free: { parameters: ["pointer"], result: "void" },
});
const gobject = deno.dlopen("libgobject-2.0.so.0", { g_object_unref: { parameters: ["pointer"], result: "void" } });
const gio = (() => {
    try {
        return deno.dlopen("libgio-2.0.so.0", {
            g_cancellable_new: { parameters: [], result: "pointer" },
            g_cancellable_cancel: { parameters: ["pointer"], result: "void" },
        });
    }
    catch {
        return undefined;
    }
})();
const listing = deno.dlopen("libsecret-1.so.0", {
    secret_retrievable_get_attributes: { parameters: ["pointer"], result: "pointer" },
    secret_retrievable_retrieve_secret_sync: {
        parameters: ["pointer", "pointer", "buffer"],
        result: "pointer",
    },
    secret_value_get: { parameters: ["pointer", "buffer"], result: "pointer" },
    secret_value_unref: { parameters: ["pointer"], result: "void" },
});
const encoder = new TextEncoder();
const runtime = "deno";
let listSchema = null;
function cstr(value) {
    const bytes = encoder.encode(value);
    const result = new Uint8Array(bytes.length + 1);
    result.set(bytes);
    return result;
}
function pointerValue(pointer) {
    return BigInt(deno.UnsafePointer.value(pointer));
}
function nativePointer(handle) {
    if (handle.runtime !== runtime || typeof handle.valueOf() !== "bigint")
        throw new TypeError("Libsecret handle belongs to a different runtime.");
    return deno.UnsafePointer.create(handle.valueOf());
}
function cancellablePointer(handle) {
    prepareGCancellable(handle, runtime);
    if (typeof handle.valueOf() !== "bigint")
        throw new TypeError("GCancellable handle belongs to a different runtime.");
    return deno.UnsafePointer.create(handle.valueOf());
}
function readCString(pointer) {
    return new deno.UnsafePointerView(deno.UnsafePointer.create(pointer)).getCString();
}
function readCStringBytes(pointer) {
    const view = new deno.UnsafePointerView(deno.UnsafePointer.create(pointer));
    const bytes = [];
    for (let index = 0;; index++) {
        const value = view.getUint8(index);
        if (value === 0)
            return new Uint8Array(bytes);
        bytes.push(value);
    }
}
function readPointer(buffer) {
    return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength).getBigUint64(0, true);
}
function readU64(view, offset) {
    const low = view.getUint8(offset) | (view.getUint8(offset + 1) << 8) |
        (view.getUint8(offset + 2) << 16) | (view.getUint8(offset + 3) << 24);
    const high = view.getUint8(offset + 4) | (view.getUint8(offset + 5) << 8) |
        (view.getUint8(offset + 6) << 16) | (view.getUint8(offset + 7) << 24);
    return (BigInt(high >>> 0) << 32n) | BigInt(low >>> 0);
}
function listDataPointer(node) {
    return readU64(new deno.UnsafePointerView(deno.UnsafePointer.create(node)), 0);
}
function listNextPointer(node) {
    return readU64(new deno.UnsafePointerView(deno.UnsafePointer.create(node)), 8);
}
function throwIfError(errorOut) {
    const error = readPointer(errorOut);
    if (error === 0n)
        return;
    const messagePointer = readU64(new deno.UnsafePointerView(deno.UnsafePointer.create(error)), 8);
    const message = messagePointer === 0n ? "Unknown libsecret error" : readCString(messagePointer);
    glib.symbols.g_error_free(deno.UnsafePointer.create(error));
    throw new Error(message || "Unknown libsecret error");
}
function captureError(errorOut, errorStorage) {
    const error = readPointer(errorStorage);
    if (error === 0n)
        return;
    let message = "Unknown libsecret error";
    try {
        const messagePointer = readU64(new deno.UnsafePointerView(deno.UnsafePointer.create(error)), 8);
        message = messagePointer === 0n ? message : readCString(messagePointer);
    }
    finally {
        glib.symbols.g_error_free(deno.UnsafePointer.create(error));
    }
    setLibsecretError(errorOut, new Error(message || "Unknown libsecret error"));
}
function secretSchemaNew(name, flags, attributeName1, attributeType1, attributeName2, attributeType2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    const value = libsecret.symbols.secret_schema_new(cstr(name), flags, cstr(attributeName1), attributeType1, cstr(attributeName2), attributeType2, terminator);
    if (value === null)
        return null;
    return new SecretSchemaHandle(runtime, pointerValue(value));
}
function secretPasswordLookupSync(schema, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const value = libsecret.symbols.secret_password_lookup_sync(nativePointer(schema), cancellable === null ? null : cancellablePointer(cancellable), errorStorage, cstr(attributeName1), cstr(attributeValue1), cstr(attributeName2), cstr(attributeValue2), terminator);
    captureError(errorOut, errorStorage);
    if (value === null)
        return null;
    const pointer = pointerValue(value);
    let text;
    try {
        text = decodeUtf8(readCStringBytes(pointer), "secret");
    }
    catch (error) {
        libsecret.symbols.secret_password_free(deno.UnsafePointer.create(pointer));
        throw error;
    }
    return new SecretPasswordHandle(runtime, pointer, text);
}
function secretPasswordStoreSync(schema, collection, label, password, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const stored = libsecret.symbols.secret_password_store_sync(nativePointer(schema), cstr(collection), cstr(label), cstr(password), cancellable === null ? null : cancellablePointer(cancellable), errorStorage, cstr(attributeName1), cstr(attributeValue1), cstr(attributeName2), cstr(attributeValue2), terminator);
    captureError(errorOut, errorStorage);
    return Boolean(stored);
}
function secretPasswordClearSync(schema, cancellable, errorOut, attributeName1, attributeValue1, attributeName2, attributeValue2, terminator) {
    if (terminator !== null)
        throw new TypeError("The libsecret attribute terminator must be null.");
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const cleared = libsecret.symbols.secret_password_clear_sync(nativePointer(schema), cancellable === null ? null : cancellablePointer(cancellable), errorStorage, cstr(attributeName1), cstr(attributeValue1), cstr(attributeName2), cstr(attributeValue2), terminator);
    captureError(errorOut, errorStorage);
    return Boolean(cleared);
}
function secretPasswordFree(password) {
    libsecret.symbols.secret_password_free(nativePointer(password));
}
function cancellableNew() {
    if (gio === undefined)
        throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    const cancellable = gio.symbols.g_cancellable_new();
    if (cancellable === null)
        throw new Error("Failed to create GCancellable.");
    return new GCancellableHandle(runtime, pointerValue(cancellable));
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
function getListSchema() {
    if (listSchema === null) {
        const schema = secretSchemaNew("org.freedesktop.Secret.Generic", 0, "service", 0, "account", 0, null);
        if (schema === null)
            throw new Error("Failed to create libsecret schema.");
        listSchema = schema;
    }
    return listSchema;
}
function listSecretRecords(service) {
    const width = 64;
    const errorOut = new Uint8Array(8);
    const list = libsecret.symbols.secret_password_search_sync(nativePointer(getListSchema()), 2, null, errorOut, cstr("service"), cstr(service), null);
    throwIfError(errorOut);
    if (list === null)
        return [];
    const listPointer = pointerValue(list);
    const records = [];
    try {
        for (let node = listPointer; node !== 0n; node = listNextPointer(node)) {
            const retrievable = listDataPointer(node);
            if (retrievable === 0n)
                continue;
            const attributes = listing.symbols.secret_retrievable_get_attributes(deno.UnsafePointer.create(retrievable));
            try {
                const account = glib.symbols.g_hash_table_lookup(attributes, cstr("account"));
                if (account === null)
                    continue;
                const accountPointer = pointerValue(account);
                const secretError = new Uint8Array(8);
                const value = listing.symbols.secret_retrievable_retrieve_secret_sync(deno.UnsafePointer.create(retrievable), null, secretError);
                throwIfError(secretError);
                if (value === null)
                    continue;
                try {
                    const lengthBuffer = new Uint8Array(width / 8);
                    const secret = listing.symbols.secret_value_get(value, lengthBuffer);
                    const length = readGSize(lengthBuffer, 64);
                    if (secret === null) {
                        if (length !== 0)
                            throw new Error("secret_value_get returned a null pointer with a non-zero length");
                        records.push({ service, account: decodeUtf8(readCStringBytes(accountPointer), "account"), secret: new Uint8Array(0) });
                    }
                    else {
                        const pointer = pointerValue(secret);
                        const pointerView = new deno.UnsafePointerView(deno.UnsafePointer.create(pointer));
                        records.push({
                            service,
                            account: decodeUtf8(readCStringBytes(accountPointer), "account"),
                            secret: copyExactBytes(length, (index) => pointerView.getUint8(index)),
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
        for (let node = listPointer; node !== 0n; node = listNextPointer(node)) {
            const retrievable = listDataPointer(node);
            if (retrievable !== 0n)
                gobject.symbols.g_object_unref(deno.UnsafePointer.create(retrievable));
        }
        glib.symbols.g_list_free(deno.UnsafePointer.create(listPointer));
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
