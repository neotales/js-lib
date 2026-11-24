import "./_dnt.polyfills.js";
import { stringToWide } from "./types.js";
import { WIN_CRED_ERROR_NOT_FOUND, win32Failure } from "./win32.js";
const deno = globalThis.Deno;
const lib = deno.dlopen("advapi32.dll", {
    CredWriteW: { parameters: ["buffer", "u32"], result: "i32" },
    CredReadW: { parameters: ["buffer", "u32", "u32", "buffer"], result: "i32" },
    CredDeleteW: { parameters: ["buffer", "u32", "u32"], result: "i32" },
    CredEnumerateW: { parameters: ["pointer", "u32", "buffer", "buffer"], result: "i32" },
    CredFree: { parameters: ["pointer"], result: "void" },
});
const kernel32 = deno.dlopen("kernel32.dll", {
    GetLastError: { parameters: [], result: "u32" },
});
const { symbols } = lib;
const { symbols: k32 } = kernel32;
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
function readU32(view, offset) {
    return view.getUint32(offset, true);
}
function readU64(view, offset) {
    return view.getBigUint64(offset, true);
}
function readPointer(view, offset) {
    return view.getBigUint64(offset, true);
}
function readWideString(ptr) {
    if (ptr === 0n)
        return "";
    const view = new deno.UnsafePointerView(deno.UnsafePointer.create(ptr));
    const chars = [];
    for (let i = 0;; i += 2) {
        const lo = view.getUint8(i);
        const hi = view.getUint8(i + 1);
        if (lo === 0 && hi === 0)
            break;
        chars.push(lo | (hi << 8));
    }
    return String.fromCharCode(...chars);
}
function readBytes(ptr, length) {
    if (ptr === 0n || length === 0)
        return new Uint8Array(0);
    const view = new deno.UnsafePointerView(deno.UnsafePointer.create(ptr));
    const buf = new Uint8Array(length);
    for (let i = 0; i < length; i++)
        buf[i] = view.getUint8(i);
    return buf;
}
function parseCredential(credPtr) {
    const buf = readBytes(credPtr, SIZEOF_CREDENTIALW);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const blobSize = readU32(view, OFF_BLOB_SIZE);
    const blobPtr = readPointer(view, OFF_BLOB);
    return {
        flags: readU32(view, OFF_FLAGS),
        type: readU32(view, OFF_TYPE),
        targetName: readWideString(readPointer(view, OFF_TARGET_NAME)),
        comment: readWideString(readPointer(view, OFF_COMMENT)),
        lastWritten: readU64(view, OFF_LAST_WRITTEN),
        credentialBlobSize: blobSize,
        credentialBlob: readBytes(blobPtr, blobSize),
        persist: readU32(view, OFF_PERSIST),
        attributeCount: readU32(view, OFF_ATTR_COUNT),
        targetAlias: readWideString(readPointer(view, OFF_TARGET_ALIAS)),
        userName: readWideString(readPointer(view, OFF_USER_NAME)),
    };
}
function buildCredentialBuffer(cred) {
    const refs = [];
    const buf = new Uint8Array(SIZEOF_CREDENTIALW);
    const view = new DataView(buf.buffer);
    view.setUint32(OFF_FLAGS, cred.flags, true);
    view.setUint32(OFF_TYPE, cred.type, true);
    const wTarget = stringToWide(cred.targetName);
    refs.push(wTarget);
    view.setBigUint64(OFF_TARGET_NAME, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(wTarget))), true);
    const wComment = stringToWide(cred.comment);
    refs.push(wComment);
    view.setBigUint64(OFF_COMMENT, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(wComment))), true);
    view.setBigUint64(OFF_LAST_WRITTEN, cred.lastWritten, true);
    view.setUint32(OFF_BLOB_SIZE, cred.credentialBlob.length, true);
    const blob = cred.credentialBlob;
    refs.push(blob);
    if (blob.length > 0)
        view.setBigUint64(OFF_BLOB, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(blob))), true);
    view.setUint32(OFF_PERSIST, cred.persist, true);
    view.setUint32(OFF_ATTR_COUNT, 0, true);
    const wAlias = stringToWide(cred.targetAlias);
    refs.push(wAlias);
    if (cred.targetAlias)
        view.setBigUint64(OFF_TARGET_ALIAS, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(wAlias))), true);
    const wUser = stringToWide(cred.userName);
    refs.push(wUser);
    if (cred.userName)
        view.setBigUint64(OFF_USER_NAME, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(wUser))), true);
    return { structBuf: buf, refs };
}
export const backend = {
    write(cred, flags) {
        const native = buildCredentialBuffer(cred);
        const ok = symbols.CredWriteW(native.structBuf, flags);
        void native.refs;
        if (!ok)
            throw new Error(`CredWriteW failed with error code ${k32.GetLastError()}`);
    },
    read(targetName, type) {
        const wTarget = stringToWide(targetName);
        const outBuf = new Uint8Array(8);
        const ok = symbols.CredReadW(wTarget, type, 0, outBuf);
        if (!ok) {
            const code = k32.GetLastError();
            if (code === WIN_CRED_ERROR_NOT_FOUND)
                return null;
            throw win32Failure("CredReadW", code);
        }
        const credPtr = new DataView(outBuf.buffer).getBigUint64(0, true);
        try {
            return parseCredential(credPtr);
        }
        finally {
            symbols.CredFree(deno.UnsafePointer.create(credPtr));
        }
    },
    delete(targetName, type) {
        const ok = symbols.CredDeleteW(stringToWide(targetName), type, 0);
        if (ok)
            return true;
        const code = k32.GetLastError();
        if (code === WIN_CRED_ERROR_NOT_FOUND)
            return false;
        throw win32Failure("CredDeleteW", code);
    },
    enumerate(filter, flags) {
        const countBuf = new Uint8Array(4);
        const credsBuf = new Uint8Array(8);
        const ok = symbols.CredEnumerateW(filter !== null ? deno.UnsafePointer.of(stringToWide(filter)) : null, flags, countBuf, credsBuf);
        if (!ok) {
            const code = k32.GetLastError();
            if (code === WIN_CRED_ERROR_NOT_FOUND)
                return [];
            throw win32Failure("CredEnumerateW", code);
        }
        const count = new DataView(countBuf.buffer).getUint32(0, true);
        const arrayPtr = new DataView(credsBuf.buffer).getBigUint64(0, true);
        const results = [];
        try {
            const ptrArrayView = new deno.UnsafePointerView(deno.UnsafePointer.create(arrayPtr));
            for (let i = 0; i < count; i++) {
                const credPtrBuf = new Uint8Array(8);
                for (let b = 0; b < 8; b++)
                    credPtrBuf[b] = ptrArrayView.getUint8(i * 8 + b);
                results.push(parseCredential(new DataView(credPtrBuf.buffer).getBigUint64(0, true)));
            }
        }
        finally {
            symbols.CredFree(deno.UnsafePointer.create(arrayPtr));
        }
        return results;
    },
};
