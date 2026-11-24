/**
 * txiki.js `tjs:ffi` bindings for macOS Keychain.
 *
 * The native symbol table and backend implementation are separate from the
 * `tjs:ffi` loader so the bindings can be tested without a macOS host. The
 * backend mirrors the Bun backend: `buffer` arguments point at JavaScript
 * bytes, returned CoreFoundation and Keychain references are followed with
 * `read.ptr`, and every owned reference is released.
 *
 * @module
 * @internal
 */
import { retaining } from "./retain.js";
/** The Security.framework symbols requested from `tjs:ffi`. */
export const TXIKI_SECURITY_SYMBOLS = {
    SecKeychainFindGenericPassword: {
        args: ["ptr", "u32", "buffer", "u32", "buffer", "buffer", "buffer", "buffer"],
        returns: "i32",
    },
    SecKeychainAddGenericPassword: {
        args: ["ptr", "u32", "buffer", "u32", "buffer", "u32", "buffer", "buffer"],
        returns: "i32",
    },
    SecKeychainItemModifyAttributesAndData: {
        args: ["ptr", "ptr", "u32", "buffer"],
        returns: "i32",
    },
    SecKeychainItemDelete: { args: ["ptr"], returns: "i32" },
    SecKeychainItemFreeContent: { args: ["ptr", "ptr"], returns: "i32" },
    SecKeychainSearchCreateFromAttributes: {
        args: ["ptr", "i32", "buffer", "buffer"],
        returns: "i32",
    },
    SecKeychainSearchCopyNext: { args: ["ptr", "buffer"], returns: "i32" },
    SecKeychainItemCopyAttributesAndData: {
        args: ["ptr", "ptr", "ptr", "buffer", "buffer", "ptr"],
        returns: "i32",
    },
    SecKeychainItemFreeAttributesAndData: { args: ["ptr", "ptr"], returns: "i32" },
};
/** The CoreFoundation symbols requested from `tjs:ffi`. */
export const TXIKI_COREFOUNDATION_SYMBOLS = {
    CFRelease: { args: ["ptr"], returns: "void" },
};
const ERR_ITEM_NOT_FOUND = -25300;
const ITEM_CLASS_GENERIC_PASSWORD = 0x67656e70;
const ATTR_SERVICE = 0x73766365;
const ATTR_ACCOUNT = 0x61636374;
function check(status, operation) {
    if (status !== 0)
        throw new Error(`${operation} failed (${status})`);
}
function pointerFromBuffer(ffi, buffer) {
    return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        .getBigUint64(0, true);
}
/**
 * Creates the txiki.js macOS Keychain backend and lifecycle helpers around an
 * already loaded `tjs:ffi` module.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export function createTxikiKeychainBackend(ffi) {
    let security = null;
    let coreFoundation = null;
    function ensure() {
        if (security === null) {
            security = ffi.dlopen("/System/Library/Frameworks/Security.framework/Security", TXIKI_SECURITY_SYMBOLS);
        }
        if (coreFoundation === null) {
            coreFoundation = ffi.dlopen("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation", TXIKI_COREFOUNDATION_SYMBOLS);
        }
        return { sec: security, cf: coreFoundation };
    }
    function pointerTo(ffiPointer) {
        return ffiPointer;
    }
    function find(service, account) {
        const { sec } = ensure();
        const serviceBytes = new TextEncoder().encode(service);
        const accountBytes = new TextEncoder().encode(account);
        const length = new Uint8Array(4);
        const data = new Uint8Array(8);
        const item = new Uint8Array(8);
        const owners = [serviceBytes, accountBytes, length, data, item];
        const status = retaining(owners, () => sec.symbols.SecKeychainFindGenericPassword(null, serviceBytes.length, serviceBytes, accountBytes.length, accountBytes, length, data, item));
        if (status === ERR_ITEM_NOT_FOUND)
            return null;
        check(status, "SecKeychainFindGenericPassword");
        return {
            data: pointerFromBuffer(ffi, data),
            item: pointerFromBuffer(ffi, item),
            length: new DataView(length.buffer).getUint32(0, true),
        };
    }
    function release(found) {
        if (!found)
            return;
        const { sec, cf } = ensure();
        if (found.data) {
            sec.symbols.SecKeychainItemFreeContent(null, pointerTo(ffi.createPointer(found.data)));
        }
        if (found.item)
            cf.symbols.CFRelease(pointerTo(ffi.createPointer(found.item)));
    }
    function serviceAttributes(service) {
        const serviceBytes = new TextEncoder().encode(service);
        const attribute = new Uint8Array(16);
        const attributeView = new DataView(attribute.buffer);
        attributeView.setUint32(0, ATTR_SERVICE, true);
        attributeView.setUint32(4, serviceBytes.length, true);
        attributeView.setBigUint64(8, ffi.bufferToPointer(serviceBytes)?.value ?? 0n, true);
        const list = new Uint8Array(16);
        const listView = new DataView(list.buffer);
        listView.setUint32(0, 1, true);
        listView.setBigUint64(8, ffi.bufferToPointer(attribute)?.value ?? 0n, true);
        return { serviceBytes, attribute, list };
    }
    function accountForItem(item) {
        const { sec } = ensure();
        const tag = new Uint8Array(4);
        new DataView(tag.buffer).setUint32(0, ATTR_ACCOUNT, true);
        const format = new Uint8Array(4);
        const info = new Uint8Array(24);
        const infoView = new DataView(info.buffer);
        infoView.setUint32(0, 1, true);
        infoView.setBigUint64(8, ffi.bufferToPointer(tag)?.value ?? 0n, true);
        infoView.setBigUint64(16, ffi.bufferToPointer(format)?.value ?? 0n, true);
        const attributes = new Uint8Array(8);
        const length = new Uint8Array(4);
        const owners = [tag, format, info, attributes, length];
        const status = retaining(owners, () => sec.symbols.SecKeychainItemCopyAttributesAndData(pointerTo(ffi.createPointer(item)), ffi.bufferToPointer(info), null, attributes, length, null));
        if (status === ERR_ITEM_NOT_FOUND)
            return null;
        check(status, "SecKeychainItemCopyAttributesAndData");
        const attributeList = pointerFromBuffer(ffi, attributes);
        if (!attributeList) {
            throw new Error("SecKeychainItemCopyAttributesAndData returned no attribute list");
        }
        try {
            const listPointer = ffi.createPointer(attributeList);
            if (listPointer === null) {
                throw new Error("SecKeychainItemCopyAttributesAndData returned a null attribute list");
            }
            if (ffi.read.u32(listPointer, 0) === 0)
                return "";
            const attribute = ffi.read.ptr(listPointer, 8);
            if (attribute === null || ffi.read.u32(attribute, 0) !== ATTR_ACCOUNT) {
                throw new Error("SecKeychainItemCopyAttributesAndData returned a malformed account attribute");
            }
            const byteLength = ffi.read.u32(attribute, 4);
            const data = ffi.read.ptr(attribute, 8);
            if (data === null) {
                if (byteLength === 0)
                    return "";
                throw new Error("SecKeychainItemCopyAttributesAndData returned a null account value");
            }
            const account = new Uint8Array(byteLength);
            for (let index = 0; index < byteLength; index++) {
                account[index] = ffi.read.u8(data, index);
            }
            return new TextDecoder().decode(account);
        }
        finally {
            sec.symbols.SecKeychainItemFreeAttributesAndData(pointerTo(ffi.createPointer(attributeList)), null);
        }
    }
    const backend = {
        getSecretBytes(service, account) {
            const found = find(service, account);
            if (!found)
                return null;
            try {
                const pointer = ffi.createPointer(found.data);
                if (pointer === null)
                    return new Uint8Array(0);
                const secret = new Uint8Array(found.length);
                for (let index = 0; index < found.length; index++) {
                    secret[index] = ffi.read.u8(pointer, index);
                }
                return secret;
            }
            finally {
                release(found);
            }
        },
        saveSecretBytes(service, account, secret) {
            const { sec, cf } = ensure();
            const found = find(service, account);
            try {
                if (found) {
                    retaining([secret], () => check(sec.symbols.SecKeychainItemModifyAttributesAndData(pointerTo(ffi.createPointer(found.item)), null, secret.length, secret), "SecKeychainItemModifyAttributesAndData"));
                    return;
                }
                const serviceBytes = new TextEncoder().encode(service);
                const accountBytes = new TextEncoder().encode(account);
                const item = new Uint8Array(8);
                retaining([serviceBytes, accountBytes, secret, item], () => check(sec.symbols.SecKeychainAddGenericPassword(null, serviceBytes.length, serviceBytes, accountBytes.length, accountBytes, secret.length, secret, item), "SecKeychainAddGenericPassword"));
                const pointer = pointerFromBuffer(ffi, item);
                if (pointer)
                    cf.symbols.CFRelease(pointerTo(ffi.createPointer(pointer)));
            }
            finally {
                release(found);
            }
        },
        removeSecret(service, account) {
            const { sec } = ensure();
            const found = find(service, account);
            if (!found)
                return false;
            try {
                check(sec.symbols.SecKeychainItemDelete(pointerTo(ffi.createPointer(found.item))), "SecKeychainItemDelete");
                return true;
            }
            finally {
                release(found);
            }
        },
        listSecrets(service) {
            const { sec, cf } = ensure();
            // Keep every typed array that backs a C pointer alive through the native
            // call. Destructuring only `list` lets the collector reclaim the service
            // bytes and attribute buffer before the framework reads them.
            const owners = serviceAttributes(service);
            const search = new Uint8Array(8);
            const status = sec.symbols.SecKeychainSearchCreateFromAttributes(null, ITEM_CLASS_GENERIC_PASSWORD, owners.list, search);
            void owners;
            if (status === ERR_ITEM_NOT_FOUND)
                return [];
            check(status, "SecKeychainSearchCreateFromAttributes");
            const searchPointer = pointerFromBuffer(ffi, search);
            if (!searchPointer)
                return [];
            const records = [];
            try {
                while (true) {
                    const item = new Uint8Array(8);
                    const next = sec.symbols.SecKeychainSearchCopyNext(pointerTo(ffi.createPointer(searchPointer)), item);
                    if (next === ERR_ITEM_NOT_FOUND)
                        break;
                    check(next, "SecKeychainSearchCopyNext");
                    const itemPointer = pointerFromBuffer(ffi, item);
                    if (!itemPointer)
                        break;
                    try {
                        const account = accountForItem(itemPointer);
                        if (account === null)
                            continue;
                        const secret = this.getSecretBytes(service, account);
                        if (secret !== null)
                            records.push({ service, account, secret });
                    }
                    finally {
                        cf.symbols.CFRelease(pointerTo(ffi.createPointer(itemPointer)));
                    }
                }
            }
            finally {
                cf.symbols.CFRelease(pointerTo(ffi.createPointer(searchPointer)));
            }
            return records;
        },
    };
    return {
        backend,
        open() {
            ensure();
        },
        isOpened() {
            return security !== null && coreFoundation !== null;
        },
        close() {
            security?.close();
            coreFoundation?.close();
            security = null;
            coreFoundation = null;
        },
    };
}
