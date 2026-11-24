import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import {

  createTxikiKeychainBackend,
  type TxikiFfiModule,
  type TxikiPointer,
  TXIKI_COREFOUNDATION_SYMBOLS,
  TXIKI_SECURITY_SYMBOLS,
} from "./txiki_bindings.ts";

function expectThrows(fn: () => unknown, pattern: RegExp): void {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ok(pattern.test(message), `expected ${pattern}, got ${message}`);
    return;
  }
  throw new Error("expected an error");
}

const ERR_ITEM_NOT_FOUND = -25300;
const ITEM_CLASS_GENERIC_PASSWORD = 0x67656e70;
const ATTR_SERVICE = 0x73766365;
const ATTR_ACCOUNT = 0x61636374;
const canEncode = typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined";
function encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}
function decode(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

class MockMemory {
  #chunks = new Map<number, Uint8Array>();
  #next = 0x1000;

  alloc(bytes: Uint8Array): TxikiPointer {
    const address = this.#next;
    this.#next += 0x1000;
    this.#chunks.set(address, bytes);
    return this.pointer(address);
  }

  pointer(address: bigint | number): TxikiPointer {
    return { value: BigInt(address) };
  }

  pointerFromBuffer(buffer: Uint8Array): TxikiPointer {
    for (const [address, chunk] of this.#chunks) {
      if (chunk === buffer) return this.pointer(address);
    }
    return this.alloc(buffer);
  }

  chunk(pointer: TxikiPointer): Uint8Array {
    const chunk = this.#chunks.get(Number(pointer.value));
    if (!chunk) throw new Error(`no memory at ${pointer.value}`);
    return chunk;
  }

  u8(pointer: TxikiPointer, offset = 0): number {
    return this.chunk(pointer)[offset];
  }

  u32(pointer: TxikiPointer, offset = 0): number {
    const chunk = this.chunk(pointer);
    return new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
      .getUint32(offset, true);
  }

  ptr(pointer: TxikiPointer, offset = 0): TxikiPointer | null {
    const chunk = this.chunk(pointer);
    const address = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
      .getBigUint64(offset, true);
    return address === 0n ? null : this.pointer(address);
  }

  writePtr(buffer: Uint8Array, offset: number, pointer: TxikiPointer | null): void {
    new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      .setBigUint64(offset, pointer === null ? 0n : pointer.value, true);
  }

  writeU32(buffer: Uint8Array, offset: number, value: number): void {
    new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      .setUint32(offset, value, true);
  }

  readU32(buffer: Uint8Array, offset = 0): number {
    return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      .getUint32(offset, true);
  }

  readPtr(buffer: Uint8Array, offset = 0): TxikiPointer | null {
    const address = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      .getBigUint64(offset, true);
    return address === 0n ? null : this.pointer(address);
  }

  string(pointer: TxikiPointer | null, length?: number): string {
    if (pointer === null) return "";
    const chunk = this.chunk(pointer);
    return length === undefined ? decode(chunk) : decode(chunk.subarray(0, length));
  }
}

type SeedItem = {
  account: string;
  secret: Uint8Array;
};

function mockFfi(items: SeedItem[] = []) {
  const memory = new MockMemory();
  const calls: { name: string; args: unknown[] }[] = [];
  const released: bigint[] = [];
  const freedContent: bigint[] = [];
  let opens = 0;
  let closes = 0;
  let nextIndex = 0;
  let createStatus = 0;
  let nextError = 0;
  let copyStatus = 0;
  let malformedAttribute = false;
  const stored = new Map<string, Uint8Array>();

  const itemPointers = items.map((item, index) => {
    stored.set(item.account, item.secret);
    return memory.pointer(0x9000 + index * 0x10);
  });

  function record(name: string, args: unknown[]): void {
    const table = TXIKI_SECURITY_SYMBOLS[name] ?? TXIKI_COREFOUNDATION_SYMBOLS[name];
    const types = table?.args ?? [];
    equal(args.length, types.length, `${name} argument count`);
    for (let index = 0; index < types.length; index++) {
      const type = types[index];
      if (type === "buffer") {
        ok(args[index] instanceof Uint8Array, `${name} argument ${index} is a buffer`);
      } else if (type === "ptr") {
        ok(
          args[index] === null ||
            (typeof args[index] === "object" && args[index] !== null && "value" in args[index]),
          `${name} argument ${index} is a pointer or null`,
        );
      } else if (type === "u32") {
        equal(typeof args[index], "number", `${name} argument ${index} is a u32`);
      } else if (type === "i32") {
        equal(typeof args[index], "number", `${name} argument ${index} is an i32`);
      }
    }
    calls.push({ name, args });
  }

  const symbols: Record<string, (...args: unknown[]) => unknown> = {
    SecKeychainFindGenericPassword(...args) {
      record("SecKeychainFindGenericPassword", args);
      const service = decode(args[2] as Uint8Array);
      const account = decode(args[4] as Uint8Array);
      equal((args[2] as Uint8Array).length, args[1]);
      equal((args[4] as Uint8Array).length, args[3]);
      const secret = stored.get(account);
      if (service !== "service" || secret === undefined) return ERR_ITEM_NOT_FOUND;
      memory.writeU32(args[5] as Uint8Array, 0, secret.length);
      memory.writePtr(args[6] as Uint8Array, 0, memory.alloc(secret));
      memory.writePtr(args[7] as Uint8Array, 0, memory.pointer(0x4242));
      return 0;
    },
    SecKeychainAddGenericPassword(...args) {
      record("SecKeychainAddGenericPassword", args);
      const account = decode(args[4] as Uint8Array);
      stored.set(account, (args[6] as Uint8Array).slice());
      memory.writePtr(args[7] as Uint8Array, 0, memory.pointer(0x5151));
      return 0;
    },
    SecKeychainItemModifyAttributesAndData(...args) {
      record("SecKeychainItemModifyAttributesAndData", args);
      stored.set("updated", (args[3] as Uint8Array).slice());
      return 0;
    },
    SecKeychainItemDelete(...args) {
      record("SecKeychainItemDelete", args);
      return 0;
    },
    SecKeychainItemFreeContent(...args) {
      record("SecKeychainItemFreeContent", args);
      freedContent.push((args[1] as TxikiPointer).value);
      return 0;
    },
    SecKeychainSearchCreateFromAttributes(...args) {
      record("SecKeychainSearchCreateFromAttributes", args);
      if (createStatus !== 0) return createStatus;
      equal(args[1], ITEM_CLASS_GENERIC_PASSWORD);
      const list = args[2] as Uint8Array;
      equal(memory.readU32(list, 0), 1);
      const attribute = memory.readPtr(list, 8);
      ok(attribute);
      equal(memory.u32(attribute, 0), ATTR_SERVICE);
      const length = memory.u32(attribute, 4);
      const data = memory.ptr(attribute, 8);
      equal(memory.string(data, length), "service");
      memory.writePtr(args[3] as Uint8Array, 0, memory.pointer(0x7777));
      nextIndex = 0;
      return 0;
    },
    SecKeychainSearchCopyNext(...args) {
      record("SecKeychainSearchCopyNext", args);
      if (nextError !== 0) {
        const status = nextError;
        nextError = 0;
        return status;
      }
      if (nextIndex >= itemPointers.length) return ERR_ITEM_NOT_FOUND;
      memory.writePtr(args[1] as Uint8Array, 0, itemPointers[nextIndex++]);
      return 0;
    },
    SecKeychainItemCopyAttributesAndData(...args) {
      record("SecKeychainItemCopyAttributesAndData", args);
      if (copyStatus !== 0) return copyStatus;
      const item = args[0] as TxikiPointer;
      const index = Number((item.value - 0x9000n) / 0x10n);
      const seed = items[index];
      if (!seed) return ERR_ITEM_NOT_FOUND;
      const info = args[1] as TxikiPointer;
      ok(info);
      const tag = memory.ptr(info, 8);
      ok(tag);
      equal(memory.u32(tag, 0), ATTR_ACCOUNT);

      const accountBytes = encode(seed.account);
      const accountData = memory.alloc(accountBytes);
      const attribute = new Uint8Array(16);
      memory.writeU32(attribute, 0, malformedAttribute ? 0 : ATTR_ACCOUNT);
      memory.writeU32(attribute, 4, accountBytes.length);
      memory.writePtr(attribute, 8, accountData);

      const list = new Uint8Array(16);
      memory.writeU32(list, 0, 1);
      memory.writePtr(list, 8, memory.alloc(attribute));
      memory.writePtr(args[3] as Uint8Array, 0, memory.alloc(list));
      memory.writeU32(args[4] as Uint8Array, 0, 0);
      return 0;
    },
    SecKeychainItemFreeAttributesAndData(...args) {
      record("SecKeychainItemFreeAttributesAndData", args);
      return 0;
    },
    CFRelease(...args) {
      record("CFRelease", args);
      released.push((args[0] as TxikiPointer).value);
    },
  };

  const ffi: TxikiFfiModule = {
    createPointer(value) {
      return memory.pointer(value);
    },
    bufferToPointer(buffer) {
      return memory.pointerFromBuffer(buffer);
    },
    read: {
      u8: (pointer, offset) => memory.u8(pointer, offset),
      u32: (pointer, offset) => memory.u32(pointer, offset),
      ptr: (pointer, offset) => memory.ptr(pointer, offset),
    },
    dlopen(name, table) {
      opens++;
      if (name.includes("Security.framework")) equal(table, TXIKI_SECURITY_SYMBOLS);
      else if (name.includes("CoreFoundation.framework")) {
        equal(table, TXIKI_COREFOUNDATION_SYMBOLS);
      } else throw new Error(`unexpected library ${name}`);
      return {
        symbols,
        close() {
          closes++;
        },
      };
    },
  };

  return {
    ffi,
    memory,
    calls,
    released,
    freedContent,
    opens: () => opens,
    closes: () => closes,
    setCreateStatus: (status: number) => {
      createStatus = status;
    },
    setNextError: (status: number) => {
      nextError = status;
    },
    setCopyStatus: (status: number) => {
      copyStatus = status;
    },
    setMalformedAttribute: (value: boolean) => {
      malformedAttribute = value;
    },
  };
}

test("darwin-keychain txiki bindings declare every framework symbol", () => {
  equal(Object.keys(TXIKI_SECURITY_SYMBOLS).sort(), [
    "SecKeychainAddGenericPassword",
    "SecKeychainFindGenericPassword",
    "SecKeychainItemCopyAttributesAndData",
    "SecKeychainItemDelete",
    "SecKeychainItemFreeAttributesAndData",
    "SecKeychainItemFreeContent",
    "SecKeychainItemModifyAttributesAndData",
    "SecKeychainSearchCopyNext",
    "SecKeychainSearchCreateFromAttributes",
  ]);
  equal(TXIKI_SECURITY_SYMBOLS.SecKeychainFindGenericPassword.args, [
    "ptr",
    "u32",
    "buffer",
    "u32",
    "buffer",
    "buffer",
    "buffer",
    "buffer",
  ]);
  equal(TXIKI_SECURITY_SYMBOLS.CFRelease, undefined);
  equal(Object.keys(TXIKI_COREFOUNDATION_SYMBOLS), ["CFRelease"]);
});

test("darwin-keychain txiki find reads UTF-8 buffers, the secret, and frees both references", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi([{ account: "account", secret: new Uint8Array([1, 2, 3]) }]);
  const backend = createTxikiKeychainBackend(mock.ffi).backend;

  equal([...backend.getSecretBytes("service", "account")!], [1, 2, 3]);
  equal(mock.freedContent.length, 1);
  equal(mock.released.length, 1);
  equal(mock.calls[0].name, "SecKeychainFindGenericPassword");
  equal(decode(mock.calls[0].args[2] as Uint8Array), "service");
  equal(decode(mock.calls[0].args[4] as Uint8Array), "account");
});

test("darwin-keychain txiki find returns null for a missing item", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi();
  const backend = createTxikiKeychainBackend(mock.ffi).backend;
  equal(backend.getSecretBytes("service", "other"), null);
  equal(mock.freedContent.length, 0);
  equal(mock.released.length, 0);
});

test("darwin-keychain txiki save modifies an existing item and releases it", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi([{ account: "account", secret: new Uint8Array([9]) }]);
  const backend = createTxikiKeychainBackend(mock.ffi).backend;
  backend.saveSecretBytes("service", "account", new Uint8Array([4, 5]));
  equal(mock.calls[1].name, "SecKeychainItemModifyAttributesAndData");
  equal([...(mock.calls[1].args[3] as Uint8Array)], [4, 5]);
});

test("darwin-keychain txiki save adds a missing item and releases the new reference", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi();
  const backend = createTxikiKeychainBackend(mock.ffi).backend;
  backend.saveSecretBytes("service", "new", new Uint8Array([7, 8]));

  equal(mock.calls[1].name, "SecKeychainAddGenericPassword");
  equal(decode(mock.calls[1].args[2] as Uint8Array), "service");
  equal(decode(mock.calls[1].args[4] as Uint8Array), "new");
  equal([...(mock.calls[1].args[6] as Uint8Array)], [7, 8]);
  equal(mock.released, [0x5151n]);
});

test("darwin-keychain txiki remove deletes and releases the found reference", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi([{ account: "account", secret: new Uint8Array([1]) }]);
  const backend = createTxikiKeychainBackend(mock.ffi).backend;

  equal(backend.removeSecret("service", "account"), true);
  equal(mock.calls.some((call) => call.name === "SecKeychainItemDelete"), true);
  equal(mock.released.length, 1);
});

test("darwin-keychain txiki propagates search and attribute errors", (t) => {
  if (!canEncode) t.skip("JerryScript/QuickJS-ng/ClearScript have no TextEncoder; txiki.js does");
  const createDenied = mockFfi();
  createDenied.setCreateStatus(5);
  expectThrows(
    () => createTxikiKeychainBackend(createDenied.ffi).backend.listSecrets("service"),
    /SecKeychainSearchCreateFromAttributes failed \(5\)/,
  );

  const nextDenied = mockFfi();
  nextDenied.setNextError(5);
  expectThrows(
    () => createTxikiKeychainBackend(nextDenied.ffi).backend.listSecrets("service"),
    /SecKeychainSearchCopyNext failed \(5\)/,
  );

  const copyDenied = mockFfi([{ account: "a", secret: new Uint8Array([1]) }]);
  copyDenied.setCopyStatus(5);
  expectThrows(
    () => createTxikiKeychainBackend(copyDenied.ffi).backend.listSecrets("service"),
    /SecKeychainItemCopyAttributesAndData failed \(5\)/,
  );

  const malformed = mockFfi([{ account: "a", secret: new Uint8Array([1]) }]);
  malformed.setMalformedAttribute(true);
  expectThrows(
    () => createTxikiKeychainBackend(malformed.ffi).backend.listSecrets("service"),
    /malformed account attribute/,
  );
});

test("darwin-keychain txiki ends enumeration for item-not-found and skips a vanished item", (t) => {
  if (!canEncode) t.skip("JerryScript/QuickJS-ng/ClearScript have no TextEncoder; txiki.js does");
  const empty = mockFfi();
  equal(createTxikiKeychainBackend(empty.ffi).backend.listSecrets("service"), []);

  const vanished = mockFfi([{ account: "a", secret: new Uint8Array([1]) }]);
  vanished.setCopyStatus(-25300);
  equal(createTxikiKeychainBackend(vanished.ffi).backend.listSecrets("service"), []);
});

test("darwin-keychain txiki availability probe fails closed on a load error", () => {
  const failing = {
    createPointer: () => null,
    bufferToPointer: () => null,
    read: { u8: () => 0, u32: () => 0, ptr: () => null },
    dlopen: () => {
      throw new Error("Security.framework is missing");
    },
  } as unknown as TxikiFfiModule;
  const keychain = createTxikiKeychainBackend(failing);
  expectThrows(() => keychain.open(), /Security.framework is missing/);
  equal(keychain.isOpened(), false);
});

test("darwin-keychain txiki list retains typed-array owners through the search call", (t) => {
  if (!canEncode) t.skip("JerryScript/QuickJS-ng/ClearScript have no TextEncoder; txiki.js does");
  const bun = (globalThis as { Bun?: { gc?: (force: boolean) => void } }).Bun;
  if (!bun?.gc) {
    t.skip("forced GC is only available on Bun");
  }
  const weak: WeakRef<Uint8Array>[] = [];
  let next = 0;
  const ffi = {
    createPointer: (value: bigint) => ({ value }),
    bufferToPointer: (buffer: Uint8Array) => {
      weak.push(new WeakRef(buffer));
      return { value: BigInt(0x1000 + next++ * 0x100) };
    },
    read: {
      u8: () => 0,
      u32: () => 0,
      ptr: () => null,
    },
    dlopen(name: string) {
      if (name.includes("Security.framework")) {
        return {
          symbols: {
            SecKeychainSearchCreateFromAttributes() {
              bun.gc!(true);
              equal(weak.every((ref) => ref.deref() !== undefined), true);
              return -25300;
            },
          },
          close() {},
        };
      }
      return { symbols: { CFRelease() {} }, close() {} };
    },
  } as unknown as TxikiFfiModule;
  equal(createTxikiKeychainBackend(ffi).backend.listSecrets("service"), []);
});

test("darwin-keychain txiki list builds the service attribute list and reads accounts", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi([
    { account: "a", secret: new Uint8Array([1]) },
    { account: "b", secret: new Uint8Array([2, 3]) },
  ]);
  const backend = createTxikiKeychainBackend(mock.ffi).backend;

  const records = backend.listSecrets("service");
  equal(records.map((record) => record.account), ["a", "b"]);
  equal(records.map((record) => [...record.secret]), [[1], [2, 3]]);
  equal(mock.calls[0].name, "SecKeychainSearchCreateFromAttributes");
  equal(mock.calls.some((call) => call.name === "SecKeychainItemCopyAttributesAndData"), true);
  equal(mock.calls.some((call) => call.name === "SecKeychainItemFreeAttributesAndData"), true);
});

test("darwin-keychain txiki lifecycle opens once and closes once", () => {
  const mock = mockFfi();
  const keychain = createTxikiKeychainBackend(mock.ffi);

  equal(keychain.isOpened(), false);
  keychain.open();
  keychain.open();
  equal(keychain.isOpened(), true);
  equal(mock.opens(), 2);
  keychain.close();
  equal(keychain.isOpened(), false);
  equal(mock.closes(), 2);
  keychain.close();
  equal(mock.closes(), 2);
});
