/** Bun FFI backend for macOS Keychain. */

// The pointer type is opaque here; bun:ffi's own declaration is not imported
// because dnt follows a type-only import into a host module it cannot map.
type Pointer = unknown;

const specifier = "bun:ffi";
// deno-lint-ignore no-explicit-any -- bun:ffi has no portable ambient declaration.
let bunFfi: any;
try {
  bunFfi = await import(/* @vite-ignore */ specifier);
} catch (cause) {
  throw new Error(`Unable to load ${specifier}. Run this backend in Bun.`, { cause });
}
const { dlopen, ptr, read } = bunFfi;
import type { DarwinKeychainBackend, SecretRecord } from "./types.ts";
import { retaining } from "./retain.ts";

const sec = dlopen("/System/Library/Frameworks/Security.framework/Security", {
  SecKeychainFindGenericPassword: {
    args: ["ptr", "u32", "ptr", "u32", "ptr", "ptr", "ptr", "ptr"],
    returns: "i32",
  },
  SecKeychainAddGenericPassword: {
    args: ["ptr", "u32", "ptr", "u32", "ptr", "u32", "ptr", "ptr"],
    returns: "i32",
  },
  SecKeychainItemModifyAttributesAndData: { args: ["ptr", "ptr", "u32", "ptr"], returns: "i32" },
  SecKeychainItemDelete: { args: ["ptr"], returns: "i32" },
  SecKeychainItemFreeContent: { args: ["ptr", "ptr"], returns: "i32" },
  SecKeychainSearchCreateFromAttributes: { args: ["ptr", "i32", "ptr", "ptr"], returns: "i32" },
  SecKeychainSearchCopyNext: { args: ["ptr", "ptr"], returns: "i32" },
  SecKeychainItemCopyAttributesAndData: {
    args: ["ptr", "ptr", "ptr", "ptr", "ptr", "ptr"],
    returns: "i32",
  },
  SecKeychainItemFreeAttributesAndData: { args: ["ptr", "ptr"], returns: "i32" },
});
const cf = dlopen("/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation", {
  CFRelease: { args: ["ptr"], returns: "void" },
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

function readPointer(buffer: Uint8Array): number {
  return Number(new DataView(buffer.buffer).getBigUint64(0, true));
}

function find(service: string, account: string): {
  data: number;
  item: number;
  length: number;
} | null {
  const serviceBytes = encoder.encode(service);
  const accountBytes = encoder.encode(account);
  const length = new Uint8Array(4);
  const data = new Uint8Array(8);
  const item = new Uint8Array(8);
  const owners = [serviceBytes, accountBytes, length, data, item];
  const status = retaining(owners, () =>
    sec.symbols.SecKeychainFindGenericPassword(
      null,
      serviceBytes.length,
      ptr(serviceBytes),
      accountBytes.length,
      ptr(accountBytes),
      ptr(length),
      ptr(data),
      ptr(item),
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

function release(found: { data: number; item: number } | null): void {
  if (!found)
    return;
  if (found.data)
    sec.symbols.SecKeychainItemFreeContent(null, found.data as Pointer);
  if (found.item)
    cf.symbols.CFRelease(found.item as Pointer);
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
  attributeView.setBigUint64(8, BigInt(ptr(serviceBytes)), true);

  const list = new Uint8Array(16);
  const listView = new DataView(list.buffer);
  listView.setUint32(0, 1, true);
  listView.setBigUint64(8, BigInt(ptr(attribute)), true);
  return { serviceBytes, attribute, list };
}

function accountForItem(item: number): string | null {
  const tag = new Uint8Array(4);
  new DataView(tag.buffer).setUint32(0, ATTR_ACCOUNT, true);
  const format = new Uint8Array(4);
  const info = new Uint8Array(24);
  const infoView = new DataView(info.buffer);
  infoView.setUint32(0, 1, true);
  infoView.setBigUint64(8, BigInt(ptr(tag)), true);
  infoView.setBigUint64(16, BigInt(ptr(format)), true);
  const attributes = new Uint8Array(8);
  const length = new Uint8Array(4);
  const owners = [tag, format, info, attributes, length];
  const status = retaining(owners, () =>
    sec.symbols.SecKeychainItemCopyAttributesAndData(
      item as Pointer,
      ptr(info),
      null,
      ptr(attributes),
      ptr(length),
      null,
    ));
  if (status === ERR_ITEM_NOT_FOUND)
    return null;
  check(status, "SecKeychainItemCopyAttributesAndData");
  const attributeList = readPointer(attributes);
  if (!attributeList)
    throw new Error("SecKeychainItemCopyAttributesAndData returned no attribute list");
  try {
    if (read.u32(attributeList as Pointer, 0) === 0)
      return "";
    const attribute = Number(read.ptr(attributeList as Pointer, 8));
    if (!attribute || read.u32(attribute as Pointer, 0) !== ATTR_ACCOUNT)
      throw new Error("SecKeychainItemCopyAttributesAndData returned a malformed account attribute");
    const byteLength = read.u32(attribute as Pointer, 4);
    const data = Number(read.ptr(attribute as Pointer, 8));
    if (!data && byteLength > 0)
      throw new Error("SecKeychainItemCopyAttributesAndData returned a null account value");
    if (byteLength === 0)
      return "";
    const account = new Uint8Array(byteLength);
    for (let index = 0; index < byteLength; index++)
      account[index] = read.u8(data as Pointer, index);
    return decoder.decode(account);
  } finally {
    sec.symbols.SecKeychainItemFreeAttributesAndData(attributeList as Pointer, null);
  }
}

/** Raw generic-password operations implemented through Bun FFI. */
export const backend: DarwinKeychainBackend = {
  getSecretBytes(service, account): Uint8Array | null {
    const found = find(service, account);
    if (!found)
      return null;
    try {
      const secret = new Uint8Array(found.length);
      for (let index = 0; index < found.length; index++)
        secret[index] = read.u8(found.data as Pointer, index);
      return secret;
    } finally {
      release(found);
    }
  },
  saveSecretBytes(service, account, secret): void {
    const found = find(service, account);
    try {
      if (found) {
        check(
          sec.symbols.SecKeychainItemModifyAttributesAndData(
            found.item as Pointer,
            null,
            secret.length,
            ptr(secret),
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
          sec.symbols.SecKeychainAddGenericPassword(
            null,
            serviceBytes.length,
            ptr(serviceBytes),
            accountBytes.length,
            ptr(accountBytes),
            secret.length,
            ptr(secret),
            ptr(item),
          ),
          "SecKeychainAddGenericPassword",
        ));
      const pointer = readPointer(item);
      if (pointer)
        cf.symbols.CFRelease(pointer as Pointer);
    } finally {
      release(found);
    }
  },
  removeSecret(service, account): boolean {
    const found = find(service, account);
    if (!found)
      return false;
    try {
      check(sec.symbols.SecKeychainItemDelete(found.item as Pointer), "SecKeychainItemDelete");
      return true;
    } finally {
      release(found);
    }
  },
  listSecrets(service): SecretRecord[] {
    const owners = serviceAttributes(service);
    const search = new Uint8Array(8);
    const status = sec.symbols.SecKeychainSearchCreateFromAttributes(
      null,
      ITEM_CLASS_GENERIC_PASSWORD,
      ptr(owners.list),
      ptr(search),
    );
    void owners;
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
        const next = sec.symbols.SecKeychainSearchCopyNext(searchPointer as Pointer, ptr(item));
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
          cf.symbols.CFRelease(itemPointer as Pointer);
        }
      }
    } finally {
      cf.symbols.CFRelease(searchPointer as Pointer);
    }
    return records;
  },
};
