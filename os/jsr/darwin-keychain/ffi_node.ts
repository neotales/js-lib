/** Node.js FFI backend for macOS Keychain. */

import { createRequire } from "node:module";
import type { DarwinKeychainBackend, SecretRecord } from "./types.ts";
import { retaining } from "./retain.ts";

const require = createRequire(import.meta.url);
// deno-lint-ignore no-explicit-any -- node:ffi has no ambient type declarations.
let ffi: any;
const specifier = "node:ffi";
try {
  ffi = require(specifier);
} catch (cause) {
  throw new Error("Unable to load node:ffi. Run Node.js >= 26 with --experimental-ffi.", {
    cause,
  });
}

const sec = ffi.dlopen("/System/Library/Frameworks/Security.framework/Security", {
  SecKeychainFindGenericPassword: {
    arguments: ["pointer", "u32", "pointer", "u32", "pointer", "pointer", "pointer", "pointer"],
    return: "i32",
  },
  SecKeychainAddGenericPassword: {
    arguments: ["pointer", "u32", "pointer", "u32", "pointer", "u32", "pointer", "pointer"],
    return: "i32",
  },
  SecKeychainItemModifyAttributesAndData: {
    arguments: ["pointer", "pointer", "u32", "pointer"],
    return: "i32",
  },
  SecKeychainItemDelete: { arguments: ["pointer"], return: "i32" },
  SecKeychainItemFreeContent: { arguments: ["pointer", "pointer"], return: "i32" },
  SecKeychainSearchCreateFromAttributes: {
    arguments: ["pointer", "i32", "pointer", "pointer"],
    return: "i32",
  },
  SecKeychainSearchCopyNext: { arguments: ["pointer", "pointer"], return: "i32" },
  SecKeychainItemCopyAttributesAndData: {
    arguments: ["pointer", "pointer", "pointer", "pointer", "pointer", "pointer"],
    return: "i32",
  },
  SecKeychainItemFreeAttributesAndData: { arguments: ["pointer", "pointer"], return: "i32" },
});
const cf = ffi.dlopen("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation", {
  CFRelease: { arguments: ["pointer"], return: "void" },
});

const ERR_ITEM_NOT_FOUND = -25300;
const ITEM_CLASS_GENERIC_PASSWORD = 0x67656e70;
const ATTR_SERVICE = 0x73766365;
const ATTR_ACCOUNT = 0x61636374;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function check(status: number, operation: string): void {
  if (status !== 0)
    throw new Error(`${operation} failed (${status})`);
}

function readPointer(buffer: Uint8Array): bigint {
  return new DataView(buffer.buffer).getBigUint64(0, true);
}

function readBytes(pointer: bigint, length: number): Uint8Array {
  return new Uint8Array(ffi.toArrayBuffer(pointer, length));
}

function serviceAttributes(service: string): {
  serviceBytes: Uint8Array;
  attribute: Uint8Array;
  list: Uint8Array;
} {
  const serviceBytes = encoder.encode(service);
  const attribute = new Uint8Array(16);
  const attributeView = new DataView(attribute.buffer);
  attributeView.setUint32(0, ATTR_SERVICE, true);
  attributeView.setUint32(4, serviceBytes.length, true);
  attributeView.setBigUint64(8, ffi.getRawPointer(serviceBytes), true);

  const list = new Uint8Array(16);
  const listView = new DataView(list.buffer);
  listView.setUint32(0, 1, true);
  listView.setBigUint64(8, ffi.getRawPointer(attribute), true);
  return { serviceBytes, attribute, list };
}

function accountForItem(item: bigint): string | null {
  const tag = new Uint8Array(4);
  const format = new Uint8Array(4);
  new DataView(tag.buffer).setUint32(0, ATTR_ACCOUNT, true);

  const info = new Uint8Array(24);
  const infoView = new DataView(info.buffer);
  infoView.setUint32(0, 1, true);
  infoView.setBigUint64(8, ffi.getRawPointer(tag), true);
  infoView.setBigUint64(16, ffi.getRawPointer(format), true);

  const attributes = new Uint8Array(8);
  const length = new Uint8Array(4);
  const owners = [tag, format, info, attributes, length];
  const status = retaining(owners, () =>
    sec.functions.SecKeychainItemCopyAttributesAndData(
      item,
      info,
      null,
      attributes,
      length,
      null,
    ));
  if (status === ERR_ITEM_NOT_FOUND)
    return null;
  check(status, "SecKeychainItemCopyAttributesAndData");
  const attributeList = readPointer(attributes);
  if (!attributeList)
    throw new Error("SecKeychainItemCopyAttributesAndData returned no attribute list");
  try {
    if (ffi.getUint32(attributeList, 0) === 0)
      return "";
    const attribute = ffi.getUint64(attributeList, 8);
    if (!attribute || ffi.getUint32(attribute, 0) !== ATTR_ACCOUNT)
      throw new Error("SecKeychainItemCopyAttributesAndData returned a malformed account attribute");
    const byteLength = ffi.getUint32(attribute, 4);
    const data = ffi.getUint64(attribute, 8);
    if (!data && byteLength > 0)
      throw new Error("SecKeychainItemCopyAttributesAndData returned a null account value");
    if (byteLength === 0)
      return "";
    return decoder.decode(readBytes(data, byteLength));
  } finally {
    sec.functions.SecKeychainItemFreeAttributesAndData(attributeList, null);
  }
}

function find(service: string, account: string): {
  data: bigint;
  item: bigint;
  length: number;
} | null {
  const serviceBytes = encoder.encode(service);
  const accountBytes = encoder.encode(account);
  const length = new Uint8Array(4);
  const data = new Uint8Array(8);
  const item = new Uint8Array(8);
  const owners = [serviceBytes, accountBytes, length, data, item];
  const status = retaining(owners, () =>
    sec.functions.SecKeychainFindGenericPassword(
      null,
      serviceBytes.length,
      serviceBytes,
      accountBytes.length,
      accountBytes,
      length,
      data,
      item,
    ));
  if (status === ERR_ITEM_NOT_FOUND)
    return null;
  check(status, "SecKeychainFindGenericPassword");
  return {
    data: readPointer(data),
    item: readPointer(item),
    length: new DataView(length.buffer).getUint32(0, true),
  };
}

function release(found: { data: bigint; item: bigint } | null): void {
  if (!found)
    return;
  if (found.data)
    sec.functions.SecKeychainItemFreeContent(null, found.data);
  if (found.item)
    cf.functions.CFRelease(found.item);
}

/** Raw generic-password operations implemented through Node.js FFI. */
export const backend: DarwinKeychainBackend = {
  getSecretBytes(service, account): Uint8Array | null {
    const found = find(service, account);
    if (!found)
      return null;
    try {
      return readBytes(found.data, found.length);
    } finally {
      release(found);
    }
  },
  saveSecretBytes(service, account, secret): void {
    const found = find(service, account);
    try {
      if (found) {
        check(
          sec.functions.SecKeychainItemModifyAttributesAndData(
            found.item,
            null,
            secret.length,
            secret,
          ),
          "SecKeychainItemModifyAttributesAndData",
        );
        return;
      }
      const serviceBytes = encoder.encode(service);
      const accountBytes = encoder.encode(account);
      const item = new Uint8Array(8);
      retaining([serviceBytes, accountBytes, secret, item], () =>
        check(
          sec.functions.SecKeychainAddGenericPassword(
            null,
            serviceBytes.length,
            serviceBytes,
            accountBytes.length,
            accountBytes,
            secret.length,
            secret,
            item,
          ),
          "SecKeychainAddGenericPassword",
        ));
      const pointer = readPointer(item);
      if (pointer)
        cf.functions.CFRelease(pointer);
    } finally {
      release(found);
    }
  },
  removeSecret(service, account): boolean {
    const found = find(service, account);
    if (!found)
      return false;
    try {
      check(sec.functions.SecKeychainItemDelete(found.item), "SecKeychainItemDelete");
      return true;
    } finally {
      release(found);
    }
  },
  listSecrets(service): SecretRecord[] {
    const attr = serviceAttributes(service);
    const search = new Uint8Array(8);
    const owners = [attr.serviceBytes, attr.attribute, attr.list, search];
    const status = retaining(owners, () =>
      sec.functions.SecKeychainSearchCreateFromAttributes(
        null,
        ITEM_CLASS_GENERIC_PASSWORD,
        attr.list,
        search,
      ));
    if (status === ERR_ITEM_NOT_FOUND)
      return [];
    check(status, "SecKeychainSearchCreateFromAttributes");
    const searchPointer = readPointer(search);
    if (!searchPointer)
      return [];
    const records: SecretRecord[] = [];
    try {
      while (true) {
        const item = new Uint8Array(8);
        const next = sec.functions.SecKeychainSearchCopyNext(searchPointer, item);
        if (next === ERR_ITEM_NOT_FOUND)
          break;
        check(next, "SecKeychainSearchCopyNext");
        const itemPointer = readPointer(item);
        if (!itemPointer)
          break;
        try {
          const account = accountForItem(itemPointer);
          if (account === null)
            continue;
          const secret = this.getSecretBytes(service, account);
          if (secret !== null)
            records.push({ service, account, secret });
        } finally {
          cf.functions.CFRelease(itemPointer);
        }
      }
    } finally {
      cf.functions.CFRelease(searchPointer);
    }
    return records;
  },
};
