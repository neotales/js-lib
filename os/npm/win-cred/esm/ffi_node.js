/** Node.js FFI backend for Windows Credential Manager. */
import "./_dnt.polyfills.js";
import { createRequire } from "node:module";
import { stringToWide } from "./types.js";
import { WIN_CRED_ERROR_NOT_FOUND, win32Failure } from "./win32.js";
const require = createRequire(globalThis[Symbol.for("import-meta-ponyfill-esmodule")](import.meta).url);
const specifier = "node:ffi";
let ffi;
try {
    ffi = require(specifier);
}
catch (cause) {
    throw new Error(`Unable to load ${specifier}. Run Node.js >= 26 with --experimental-ffi. For Node.js without native FFI, use the npm package @neotales/win-cred and install its optional koffi backend with npm install koffi.`, { cause });
}
const advapi32 = ffi.dlopen("advapi32.dll", {
    CredWriteW: { arguments: ["pointer", "u32"], return: "i32" },
    CredReadW: { arguments: ["pointer", "u32", "u32", "pointer"], return: "i32" },
    CredDeleteW: { arguments: ["pointer", "u32", "u32"], return: "i32" },
    CredEnumerateW: { arguments: ["pointer", "u32", "pointer", "pointer"], return: "i32" },
    CredFree: { arguments: ["pointer"], return: "void" },
});
const kernel32 = ffi.dlopen("kernel32.dll", {
    GetLastError: { arguments: [], return: "u32" },
});
const SIZEOF_CREDENTIALW = 80;
const OFF_FLAGS = 0;
const OFF_TYPE = 4;
const OFF_TARGET_NAME = 8;
const OFF_COMMENT = 16;
const OFF_LAST_WRITTEN = 24;
const OFF_BLOB_SIZE = 32;
const OFF_BLOB = 40;
const OFF_PERSIST = 48;
const OFF_ATTR_COUNT = 52;
const OFF_TARGET_ALIAS = 64;
const OFF_USER_NAME = 72;
function readWideString(pointer) {
    if (pointer === 0n)
        return "";
    const characters = [];
    for (let offset = 0;; offset += 2) {
        const low = ffi.getUint8(pointer, offset);
        const high = ffi.getUint8(pointer, offset + 1);
        if (low === 0 && high === 0)
            break;
        characters.push(low | (high << 8));
    }
    return String.fromCharCode(...characters);
}
function readBytes(pointer, length) {
    if (pointer === 0n || length === 0)
        return new Uint8Array();
    return new Uint8Array(ffi.toArrayBuffer(pointer, length));
}
function parseCredential(pointer) {
    const buffer = new Uint8Array(ffi.toArrayBuffer(pointer, SIZEOF_CREDENTIALW));
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const credentialBlobSize = view.getUint32(OFF_BLOB_SIZE, true);
    return {
        flags: view.getUint32(OFF_FLAGS, true),
        type: view.getUint32(OFF_TYPE, true),
        targetName: readWideString(view.getBigUint64(OFF_TARGET_NAME, true)),
        comment: readWideString(view.getBigUint64(OFF_COMMENT, true)),
        lastWritten: view.getBigUint64(OFF_LAST_WRITTEN, true),
        credentialBlobSize,
        credentialBlob: readBytes(view.getBigUint64(OFF_BLOB, true), credentialBlobSize),
        persist: view.getUint32(OFF_PERSIST, true),
        attributeCount: view.getUint32(OFF_ATTR_COUNT, true),
        targetAlias: readWideString(view.getBigUint64(OFF_TARGET_ALIAS, true)),
        userName: readWideString(view.getBigUint64(OFF_USER_NAME, true)),
    };
}
function credentialBuffer(credential) {
    const references = [];
    const buffer = new Uint8Array(SIZEOF_CREDENTIALW);
    const view = new DataView(buffer.buffer);
    view.setUint32(OFF_FLAGS, credential.flags, true);
    view.setUint32(OFF_TYPE, credential.type, true);
    const targetName = stringToWide(credential.targetName);
    references.push(targetName);
    view.setBigUint64(OFF_TARGET_NAME, ffi.getRawPointer(targetName), true);
    const comment = stringToWide(credential.comment);
    references.push(comment);
    view.setBigUint64(OFF_COMMENT, ffi.getRawPointer(comment), true);
    view.setBigUint64(OFF_LAST_WRITTEN, credential.lastWritten, true);
    view.setUint32(OFF_BLOB_SIZE, credential.credentialBlob.length, true);
    references.push(credential.credentialBlob);
    if (credential.credentialBlob.length > 0)
        view.setBigUint64(OFF_BLOB, ffi.getRawPointer(credential.credentialBlob), true);
    view.setUint32(OFF_PERSIST, credential.persist, true);
    view.setUint32(OFF_ATTR_COUNT, 0, true);
    const targetAlias = stringToWide(credential.targetAlias);
    references.push(targetAlias);
    if (credential.targetAlias)
        view.setBigUint64(OFF_TARGET_ALIAS, ffi.getRawPointer(targetAlias), true);
    const userName = stringToWide(credential.userName);
    references.push(userName);
    if (credential.userName)
        view.setBigUint64(OFF_USER_NAME, ffi.getRawPointer(userName), true);
    return { buffer, references };
}
/** Raw Credential Manager operations implemented through Node.js FFI. */
export const backend = {
    write(credential, flags) {
        const native = credentialBuffer(credential);
        const success = advapi32.functions.CredWriteW(native.buffer, flags);
        void native.references;
        if (!success)
            throw new Error(`CredWriteW failed with Win32 error ${kernel32.functions.GetLastError()}`);
    },
    read(targetName, type) {
        const target = stringToWide(targetName);
        const output = new Uint8Array(8);
        const success = advapi32.functions.CredReadW(target, type, 0, output);
        if (!success) {
            const code = kernel32.functions.GetLastError();
            if (code === WIN_CRED_ERROR_NOT_FOUND)
                return null;
            throw win32Failure("CredReadW", code);
        }
        const pointer = new DataView(output.buffer).getBigUint64(0, true);
        try {
            return parseCredential(pointer);
        }
        finally {
            advapi32.functions.CredFree(pointer);
        }
    },
    delete(targetName, type) {
        if (advapi32.functions.CredDeleteW(stringToWide(targetName), type, 0))
            return true;
        const code = kernel32.functions.GetLastError();
        if (code === WIN_CRED_ERROR_NOT_FOUND)
            return false;
        throw win32Failure("CredDeleteW", code);
    },
    enumerate(filter, flags) {
        const countBuffer = new Uint8Array(4);
        const output = new Uint8Array(8);
        const filterBuffer = filter === null ? null : stringToWide(filter);
        const success = advapi32.functions.CredEnumerateW(filterBuffer, flags, countBuffer, output);
        if (!success) {
            const code = kernel32.functions.GetLastError();
            if (code === WIN_CRED_ERROR_NOT_FOUND)
                return [];
            throw win32Failure("CredEnumerateW", code);
        }
        const count = new DataView(countBuffer.buffer).getUint32(0, true);
        const pointers = new DataView(output.buffer).getBigUint64(0, true);
        const credentials = [];
        try {
            for (let index = 0; index < count; index++)
                credentials.push(parseCredential(ffi.getUint64(pointers, index * 8)));
        }
        finally {
            advapi32.functions.CredFree(pointers);
        }
        return credentials;
    },
};
