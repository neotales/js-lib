/**
 * Deno Security.framework FFI backend.
 *
 * @module @neotales/darwin-keychain
 */

import {
  type DarwinKeychainBackend,
  type GenericPassword,
  KeychainHandle,
  type SecretRecord,
} from "./types.ts";
import { retaining } from "./retain.ts";

// deno-lint-ignore no-explicit-any
const deno = (globalThis as typeof globalThis & { Deno?: any }).Deno;

const sec = deno.dlopen(
  "/System/Library/Frameworks/Security.framework/Security",
  {
    SecKeychainFindGenericPassword: {
      parameters: ["pointer", "u32", "buffer", "u32", "buffer", "buffer", "buffer", "buffer"],
      result: "i32",
    },
    SecKeychainAddGenericPassword: {
      parameters: ["pointer", "u32", "buffer", "u32", "buffer", "u32", "buffer", "buffer"],
      result: "i32",
    },
    SecKeychainItemModifyAttributesAndData: {
      parameters: ["pointer", "pointer", "u32", "buffer"],
      result: "i32",
    },
    SecKeychainItemDelete: {
      parameters: ["pointer"],
      result: "i32",
    },
    SecKeychainItemFreeContent: {
      parameters: ["pointer", "pointer"],
      result: "i32",
    },
    SecKeychainSearchCreateFromAttributes: {
      parameters: ["pointer", "i32", "pointer", "buffer"],
      result: "i32",
    },
    SecKeychainSearchCopyNext: {
      parameters: ["pointer", "buffer"],
      result: "i32",
    },
    SecKeychainItemCopyAttributesAndData: {
      parameters: ["pointer", "pointer", "pointer", "buffer", "buffer", "pointer"],
      result: "i32",
    },
    SecKeychainItemFreeAttributesAndData: {
      parameters: ["pointer", "pointer"],
      result: "i32",
    },
  } as const,
);

const cf = deno.dlopen(
  "/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation",
  {
    CFRelease: {
      parameters: ["pointer"],
      result: "void",
    },
  } as const,
);

const ERR_ITEM_NOT_FOUND = -25300;
const ITEM_CLASS_GENERIC_PASSWORD = 0x67656e70;
const ATTR_SERVICE = 0x73766365;
const ATTR_ACCOUNT = 0x61636374;

const enc = new TextEncoder();

function cbytes(v: string): Uint8Array {
  return enc.encode(v);
}

function osCheck(status: number, message: string): void {
  if (status !== 0)
    throw new Error(`${message} (${status})`);
}

function readPtr(buf: Uint8Array): bigint {
  return new DataView(buf.buffer).getBigUint64(0, true);
}

function ptrToBytes(ptr: bigint, len: number): Uint8Array {
  const view = new deno.UnsafePointerView(deno.UnsafePointer.create(ptr));
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = view.getUint8(i);
  return out;
}

function toAttr(service: string): { serviceBytes: Uint8Array; attribute: Uint8Array } {
  const serviceBytes = cbytes(service);
  const attr = new Uint8Array(16);
  const dv = new DataView(attr.buffer);
  dv.setUint32(0, ATTR_SERVICE, true);
  dv.setUint32(4, serviceBytes.length, true);
  dv.setBigUint64(8, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(serviceBytes))), true);
  return { serviceBytes, attribute: attr };
}

function pointerOf(handle: KeychainHandle): bigint {
  if (handle.runtime !== "deno")
    throw new TypeError("Keychain handle belongs to a different runtime.");
  const pointer = handle.valueOf();
  if (typeof pointer !== "bigint")
    throw new TypeError("Invalid Deno Keychain handle.");
  return pointer;
}

function accountForItem(item: bigint): string | null {
  const tags = new Uint8Array(4);
  new DataView(tags.buffer).setUint32(0, ATTR_ACCOUNT, true);
  const formats = new Uint8Array(4);
  const info = new Uint8Array(24);
  const view = new DataView(info.buffer);
  view.setUint32(0, 1, true);
  view.setBigUint64(8, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(tags))), true);
  view.setBigUint64(16, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(formats))), true);

  const attributes = new Uint8Array(8);
  const length = new Uint8Array(4);
  const owners = [tags, formats, info, attributes, length];
  const status = retaining(owners, () =>
    sec.symbols.SecKeychainItemCopyAttributesAndData(
      deno.UnsafePointer.create(item),
      deno.UnsafePointer.of(info),
      null,
      attributes,
      length,
      null,
    ));
  if (status === ERR_ITEM_NOT_FOUND)
    return null;
  osCheck(status, "SecKeychainItemCopyAttributesAndData failed");

  const attributesPointer = readPtr(attributes);
  if (!attributesPointer)
    throw new Error("SecKeychainItemCopyAttributesAndData returned no attribute list");
  try {
    if (ffiReadU32(attributesPointer, 0) === 0)
      return null;
    const itemPointer = ffiReadU64(attributesPointer, 8);
    if (ffiReadU32(itemPointer, 0) !== ATTR_ACCOUNT)
      throw new Error("SecKeychainItemCopyAttributesAndData returned a malformed account attribute");
    const accountLength = ffiReadU32(itemPointer, 4);
    const accountPointer = ffiReadU64(itemPointer, 8);
    if (!accountPointer && accountLength > 0)
      throw new Error("SecKeychainItemCopyAttributesAndData returned a null account value");
    return new TextDecoder().decode(ptrToBytes(accountPointer, accountLength));
  } finally {
    sec.symbols.SecKeychainItemFreeAttributesAndData(
      deno.UnsafePointer.create(attributesPointer),
      null,
    );
  }
}

export const backend: DarwinKeychainBackend = {
  getSecretBytes(service: string, account: string): Uint8Array | null {
    const serviceB = cbytes(service);
    const accountB = cbytes(account);
    const pwLen = new Uint8Array(4);
    const pwData = new Uint8Array(8);
    const itemRef = new Uint8Array(8);
    const owners = [serviceB, accountB, pwLen, pwData, itemRef];
    const status = retaining(owners, () =>
      sec.symbols.SecKeychainFindGenericPassword(
        null,
        serviceB.length,
        serviceB,
        accountB.length,
        accountB,
        pwLen,
        pwData,
        itemRef,
      ));
    if (status === ERR_ITEM_NOT_FOUND)
      return null;
    osCheck(status, "SecKeychainFindGenericPassword failed");

    const len = new DataView(pwLen.buffer).getUint32(0, true);
    const dataPtr = readPtr(pwData);
    const refPtr = readPtr(itemRef);

    try {
      return ptrToBytes(dataPtr, len);
    } finally {
      if (dataPtr) {
        sec.symbols.SecKeychainItemFreeContent(null, deno.UnsafePointer.create(dataPtr));
      }
      if (refPtr)
        cf.symbols.CFRelease(deno.UnsafePointer.create(refPtr));
    }
  },

  saveSecretBytes(service: string, account: string, secret: Uint8Array): void {
    const serviceB = cbytes(service);
    const accountB = cbytes(account);
    const pwLen = new Uint8Array(4);
    const pwData = new Uint8Array(8);
    const itemRef = new Uint8Array(8);

    const findOwners = [serviceB, accountB, pwLen, pwData, itemRef];
    const find = retaining(findOwners, () =>
      sec.symbols.SecKeychainFindGenericPassword(
        null,
        serviceB.length,
        serviceB,
        accountB.length,
        accountB,
        pwLen,
        pwData,
        itemRef,
      ));

    const refPtr = readPtr(itemRef);
    const dataPtr = readPtr(pwData);

    try {
      if (find === 0 && refPtr) {
        const status = retaining([secret, refPtr], () =>
          sec.symbols.SecKeychainItemModifyAttributesAndData(
            deno.UnsafePointer.create(refPtr),
            null,
            secret.length,
            secret,
          ));
        osCheck(status, "SecKeychainItemModifyAttributesAndData failed");
        return;
      }

      if (find !== 0 && find !== ERR_ITEM_NOT_FOUND) {
        osCheck(find, "SecKeychainFindGenericPassword failed");
      }

      const outRef = new Uint8Array(8);
      const add = retaining([serviceB, accountB, secret, outRef], () =>
        sec.symbols.SecKeychainAddGenericPassword(
          null,
          serviceB.length,
          serviceB,
          accountB.length,
          accountB,
          secret.length,
          secret,
          outRef,
        ));
      osCheck(add, "SecKeychainAddGenericPassword failed");
      const newRef = readPtr(outRef);
      if (newRef)
        cf.symbols.CFRelease(deno.UnsafePointer.create(newRef));
    } finally {
      if (dataPtr) {
        sec.symbols.SecKeychainItemFreeContent(null, deno.UnsafePointer.create(dataPtr));
      }
      if (refPtr)
        cf.symbols.CFRelease(deno.UnsafePointer.create(refPtr));
    }
  },

  removeSecret(service: string, account: string): boolean {
    const serviceB = cbytes(service);
    const accountB = cbytes(account);
    const pwLen = new Uint8Array(4);
    const pwData = new Uint8Array(8);
    const itemRef = new Uint8Array(8);
    const owners = [serviceB, accountB, pwLen, pwData, itemRef];
    const status = retaining(owners, () =>
      sec.symbols.SecKeychainFindGenericPassword(
        null,
        serviceB.length,
        serviceB,
        accountB.length,
        accountB,
        pwLen,
        pwData,
        itemRef,
      ));
    if (status === ERR_ITEM_NOT_FOUND)
      return false;
    osCheck(status, "SecKeychainFindGenericPassword failed");

    const refPtr = readPtr(itemRef);
    const dataPtr = readPtr(pwData);
    try {
      if (!refPtr)
        return false;
      osCheck(
        sec.symbols.SecKeychainItemDelete(deno.UnsafePointer.create(refPtr)),
        "SecKeychainItemDelete failed",
      );
      return true;
    } finally {
      if (dataPtr) {
        sec.symbols.SecKeychainItemFreeContent(null, deno.UnsafePointer.create(dataPtr));
      }
      if (refPtr)
        cf.symbols.CFRelease(deno.UnsafePointer.create(refPtr));
    }
  },

  listSecrets(service: string): SecretRecord[] {
    const attr = toAttr(service);
    const list = new Uint8Array(16);
    new DataView(list.buffer).setUint32(0, 1, true);
    new DataView(list.buffer).setBigUint64(
      8,
      BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(attr.attribute))),
      true,
    );

    const searchRefBuf = new Uint8Array(8);
    const owners = [attr.serviceBytes, attr.attribute, list, searchRefBuf];
    const createStatus = retaining(owners, () =>
      sec.symbols.SecKeychainSearchCreateFromAttributes(
        null,
        ITEM_CLASS_GENERIC_PASSWORD,
        deno.UnsafePointer.of(list),
        searchRefBuf,
      ));
    if (createStatus === ERR_ITEM_NOT_FOUND)
      return [];
    osCheck(createStatus, "SecKeychainSearchCreateFromAttributes failed");

    const searchRef = readPtr(searchRefBuf);
    const results: SecretRecord[] = [];

    try {
      while (true) {
        const itemRefBuf = new Uint8Array(8);
        const next = sec.symbols.SecKeychainSearchCopyNext(
          deno.UnsafePointer.create(searchRef),
          itemRefBuf,
        );
        if (next === ERR_ITEM_NOT_FOUND)
          break;
        osCheck(next, "SecKeychainSearchCopyNext failed");

        const itemRef = readPtr(itemRefBuf);
        if (!itemRef)
          break;
        try {
          const tags = new Uint8Array(4);
          new DataView(tags.buffer).setUint32(0, ATTR_ACCOUNT, true);
          const fmts = new Uint8Array(4);
          const info = new Uint8Array(24);
          const iv = new DataView(info.buffer);
          iv.setUint32(0, 1, true);
          iv.setBigUint64(8, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(tags))), true);
          iv.setBigUint64(
            16,
            BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(fmts))),
            true,
          );

          const outAttrs = new Uint8Array(8);
          const outLen = new Uint8Array(4);
          const copyStatus = sec.symbols.SecKeychainItemCopyAttributesAndData(
            deno.UnsafePointer.create(itemRef),
            deno.UnsafePointer.of(info),
            null,
            outAttrs,
            outLen,
            null,
          );
          if (copyStatus === ERR_ITEM_NOT_FOUND)
            continue;
          osCheck(copyStatus, "SecKeychainItemCopyAttributesAndData failed");

          const attrsPtr = readPtr(outAttrs);
          let account = "";
          if (attrsPtr) {
            try {
              const count = Number(ffiReadU32(attrsPtr, 0));
              if (count > 0) {
                const attrsArrPtr = ffiReadU64(attrsPtr, 8);
                const tag = Number(ffiReadU32(attrsArrPtr, 0));
                if (tag !== ATTR_ACCOUNT)
                  throw new Error("SecKeychainItemCopyAttributesAndData returned a malformed account attribute");
                const alen = Number(ffiReadU32(attrsArrPtr, 4));
                const dataPtr = ffiReadU64(attrsArrPtr, 8);
                if (!dataPtr && alen > 0)
                  throw new Error("SecKeychainItemCopyAttributesAndData returned a null account value");
                account = new TextDecoder().decode(ptrToBytes(dataPtr, alen));
              }
            } finally {
              sec.symbols.SecKeychainItemFreeAttributesAndData(
                deno.UnsafePointer.create(attrsPtr),
                null,
              );
            }
          }

          if (!account)
            continue;
          const secret = this.getSecretBytes(service, account);
          if (secret === null)
            continue;
          results.push({ service, account, secret });
        } finally {
          cf.symbols.CFRelease(deno.UnsafePointer.create(itemRef));
        }
      }
    } finally {
      if (searchRef) {
        cf.symbols.CFRelease(deno.UnsafePointer.create(searchRef));
      }
    }

    return results;
  },
};

type KeychainApi = {
  /**
   * Finds a native generic-password item.
   *
   * @param service Service name.
   * @param account Account name.
   * @returns An owned item and copied secret, or `null`.
   * @example
   * ```ts
   * import { Keychain } from "@neotales/darwin-keychain/ffi";
   * const result = Keychain.SecKeychainFindGenericPassword("service", "account");
   * ```
   */
  SecKeychainFindGenericPassword(service: string, account: string): GenericPassword | null;
  /**
   * Adds a native generic-password item.
   *
   * @param service Service name.
   * @param account Account name.
   * @param secret Secret bytes.
   * @returns An owned item handle.
   * @example
   * ```ts
   * import { Keychain } from "@neotales/darwin-keychain/ffi";
   *
   * const item = Keychain.SecKeychainAddGenericPassword("service", "account", new Uint8Array());
   * ```
   */
  SecKeychainAddGenericPassword(
    service: string,
    account: string,
    secret: Uint8Array,
  ): KeychainHandle;
  /**
   * Replaces item data.
   *
   * @param item Owned item handle.
   * @param secret Replacement bytes.
   * @returns Nothing.
   * @example
   * ```ts
   * import { Keychain } from "@neotales/darwin-keychain/ffi";
   *
   * Keychain.SecKeychainItemModifyAttributesAndData(item, new Uint8Array());
   * ```
   */
  SecKeychainItemModifyAttributesAndData(item: KeychainHandle, secret: Uint8Array): void;
  /**
   * Deletes an item.
   *
   * @param item Owned item handle.
   * @returns Nothing.
   * @example
   * ```ts
   * import { Keychain } from "@neotales/darwin-keychain/ffi";
   *
   * Keychain.SecKeychainItemDelete(item);
   * ```
   */
  SecKeychainItemDelete(item: KeychainHandle): void;
  /**
   * Creates a generic-password search.
   *
   * @param service Service name.
   * @returns An owned search handle.
   * @example
   * ```ts
   * import { Keychain } from "@neotales/darwin-keychain/ffi";
   *
   * const search = Keychain.SecKeychainSearchCreateFromAttributes("service");
   * ```
   */
  SecKeychainSearchCreateFromAttributes(service: string): KeychainHandle;
  /**
   * Advances a search.
   *
   * @param search Owned search handle.
   * @returns The next owned item, or `null`.
   * @example
   * ```ts
   * import { Keychain } from "@neotales/darwin-keychain/ffi";
   *
   * const item = Keychain.SecKeychainSearchCopyNext(search);
   * ```
   */
  SecKeychainSearchCopyNext(search: KeychainHandle): KeychainHandle | null;
  /**
   * Copies an item's account and secret.
   *
   * @param item Owned item handle.
   * @param service Service name.
   * @returns A copied record, or `null`.
   * @example
   * ```ts
   * import { Keychain } from "@neotales/darwin-keychain/ffi";
   *
   * const record = Keychain.SecKeychainItemCopyAttributesAndData(item, "service");
   * ```
   */
  SecKeychainItemCopyAttributesAndData(item: KeychainHandle, service: string): SecretRecord | null;
  /**
   * Releases an owned Security.framework reference.
   *
   * @param handle Owned item or search handle.
   * @returns Nothing.
   * @example
   * ```ts
   * import { Keychain } from "@neotales/darwin-keychain/ffi";
   *
   * Keychain.CFRelease(handle);
   * ```
   */
  CFRelease(handle: KeychainHandle): void;
};

/**
 * Direct Security.framework operations using opaque {@link KeychainHandle}
 * references. Call {@link Keychain.CFRelease} exactly once for every item or
 * search handle returned by this object.
 */
export const Keychain: KeychainApi = {
  SecKeychainFindGenericPassword(service: string, account: string): GenericPassword | null {
    const serviceBytes = cbytes(service);
    const accountBytes = cbytes(account);
    const length = new Uint8Array(4);
    const data = new Uint8Array(8);
    const item = new Uint8Array(8);
    const status = sec.symbols.SecKeychainFindGenericPassword(
      null,
      serviceBytes.length,
      serviceBytes,
      accountBytes.length,
      accountBytes,
      length,
      data,
      item,
    );
    if (status === ERR_ITEM_NOT_FOUND)
      return null;
    osCheck(status, "SecKeychainFindGenericPassword failed");

    const dataPointer = readPtr(data);
    const itemPointer = readPtr(item);
    try {
      if (!itemPointer)
        throw new Error("SecKeychainFindGenericPassword returned no item reference.");
      return {
        item: new KeychainHandle("deno", itemPointer),
        secret: ptrToBytes(dataPointer, new DataView(length.buffer).getUint32(0, true)),
      };
    } finally {
      if (dataPointer)
        sec.symbols.SecKeychainItemFreeContent(null, deno.UnsafePointer.create(dataPointer));
    }
  },

  SecKeychainAddGenericPassword(
    service: string,
    account: string,
    secret: Uint8Array,
  ): KeychainHandle {
    const serviceBytes = cbytes(service);
    const accountBytes = cbytes(account);
    const item = new Uint8Array(8);
    osCheck(
      sec.symbols.SecKeychainAddGenericPassword(
        null,
        serviceBytes.length,
        serviceBytes,
        accountBytes.length,
        accountBytes,
        secret.length,
        secret,
        item,
      ),
      "SecKeychainAddGenericPassword failed",
    );
    const pointer = readPtr(item);
    if (!pointer)
      throw new Error("SecKeychainAddGenericPassword returned no item reference.");
    return new KeychainHandle("deno", pointer);
  },

  SecKeychainItemModifyAttributesAndData(item: KeychainHandle, secret: Uint8Array): void {
    osCheck(
      sec.symbols.SecKeychainItemModifyAttributesAndData(
        deno.UnsafePointer.create(pointerOf(item)),
        null,
        secret.length,
        secret,
      ),
      "SecKeychainItemModifyAttributesAndData failed",
    );
  },

  SecKeychainItemDelete(item: KeychainHandle): void {
    osCheck(
      sec.symbols.SecKeychainItemDelete(deno.UnsafePointer.create(pointerOf(item))),
      "SecKeychainItemDelete failed",
    );
  },

  SecKeychainSearchCreateFromAttributes(service: string): KeychainHandle {
    const { serviceBytes: _serviceBytes, attribute } = toAttr(service);
    const list = new Uint8Array(16);
    const view = new DataView(list.buffer);
    view.setUint32(0, 1, true);
    view.setBigUint64(8, BigInt(deno.UnsafePointer.value(deno.UnsafePointer.of(attribute))), true);
    const search = new Uint8Array(8);
    osCheck(
      sec.symbols.SecKeychainSearchCreateFromAttributes(
        null,
        ITEM_CLASS_GENERIC_PASSWORD,
        deno.UnsafePointer.of(list),
        search,
      ),
      "SecKeychainSearchCreateFromAttributes failed",
    );
    const pointer = readPtr(search);
    if (!pointer)
      throw new Error("SecKeychainSearchCreateFromAttributes returned no search reference.");
    return new KeychainHandle("deno", pointer);
  },

  SecKeychainSearchCopyNext(search: KeychainHandle): KeychainHandle | null {
    const item = new Uint8Array(8);
    const status = sec.symbols.SecKeychainSearchCopyNext(
      deno.UnsafePointer.create(pointerOf(search)),
      item,
    );
    if (status === ERR_ITEM_NOT_FOUND)
      return null;
    osCheck(status, "SecKeychainSearchCopyNext failed");
    const pointer = readPtr(item);
    return pointer ? new KeychainHandle("deno", pointer) : null;
  },

  SecKeychainItemCopyAttributesAndData(item: KeychainHandle, service: string): SecretRecord | null {
    const account = accountForItem(pointerOf(item));
    if (!account)
      return null;
    const secret = backend.getSecretBytes(service, account);
    return secret === null ? null : { service, account, secret };
  },

  CFRelease(handle: KeychainHandle): void {
    cf.symbols.CFRelease(deno.UnsafePointer.create(pointerOf(handle)));
  },
};

function ffiReadU32(ptr: bigint, offset: number): number {
  const view = new deno.UnsafePointerView(deno.UnsafePointer.create(ptr));
  return (
    view.getUint8(offset) |
    (view.getUint8(offset + 1) << 8) |
    (view.getUint8(offset + 2) << 16) |
    (view.getUint8(offset + 3) << 24)
  );
}

function ffiReadU64(ptr: bigint, offset: number): bigint {
  const lo = BigInt(ffiReadU32(ptr, offset) >>> 0);
  const hi = BigInt(ffiReadU32(ptr, offset + 4) >>> 0);
  return (hi << 32n) | lo;
}
