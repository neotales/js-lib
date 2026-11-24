import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  createTxikiBackend,
  type TxikiFfiModule,
  TXIKI_KERNEL32_SYMBOLS,
  TXIKI_SYMBOLS,
  type TxikiPointer,
} from "./txiki_bindings.ts";
import type { RawCredential } from "./types.ts";

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


type Call = { name: string; args: unknown[] };

const SIZEOF_CREDENTIALW = 80;
const OFF = {
  flags: 0,
  type: 4,
  targetName: 8,
  comment: 16,
  lastWritten: 24,
  blobSize: 32,
  blob: 40,
  persist: 48,
  attrCount: 52,
  targetAlias: 64,
  userName: 72,
} as const;

function wide(value: string): Uint8Array {
  const bytes = new Uint8Array((value.length + 1) * 2);
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    bytes[index * 2] = code & 0xff;
    bytes[index * 2 + 1] = code >> 8;
  }
  return bytes;
}

function wideToString(bytes: Uint8Array): string {
  const chars: number[] = [];
  for (let index = 0; index < bytes.length - 1; index += 2) {
    const code = bytes[index] | (bytes[index + 1] << 8);
    if (code === 0) break;
    chars.push(code);
  }
  return String.fromCharCode(...chars);
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
    const value = BigInt(address);
    return {
      value,
      toUint8Array: (byteLength: number, byteOffset = 0): Uint8Array => {
        const chunk = this.#chunks.get(Number(value));
        if (!chunk) throw new Error(`no memory at ${value}`);
        return chunk.subarray(byteOffset, byteOffset + byteLength);
      },
    };
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
}

type Seed = {
  targetName: string;
  type: number;
  flags?: number;
  comment?: string;
  secret?: Uint8Array;
  persist?: number;
  lastWritten?: bigint;
  targetAlias?: string;
  userName?: string;
};

function mockFfi(seeds: Seed[] = []) {
  const memory = new MockMemory();
  const calls: Call[] = [];
  const freed: bigint[] = [];
  let opens = 0;
  let closes = 0;
  let readStatus = 1;
  let deleteStatus = 1;
  let enumerateStatus = 1;
  let lastError = 1168;

  function seedCredential(seed: Seed): TxikiPointer {
    const struct = new Uint8Array(SIZEOF_CREDENTIALW);
    const targetName = memory.alloc(wide(seed.targetName));
    const comment = memory.alloc(wide(seed.comment ?? ""));
    const secret = memory.alloc(seed.secret ?? new Uint8Array(0));
    const targetAlias = memory.alloc(wide(seed.targetAlias ?? ""));
    const userName = memory.alloc(wide(seed.userName ?? ""));
    memory.writeU32(struct, OFF.flags, seed.flags ?? 0);
    memory.writeU32(struct, OFF.type, seed.type);
    memory.writePtr(struct, OFF.targetName, targetName);
    memory.writePtr(struct, OFF.comment, comment);
    const lastWritten = seed.lastWritten ?? 0n;
    memory.writeU32(struct, OFF.lastWritten, Number(lastWritten & 0xffffffffn));
    memory.writeU32(struct, OFF.lastWritten + 4, Number(lastWritten >> 32n));
    memory.writeU32(struct, OFF.blobSize, seed.secret?.length ?? 0);
    memory.writePtr(struct, OFF.blob, secret);
    memory.writeU32(struct, OFF.persist, seed.persist ?? 2);
    memory.writeU32(struct, OFF.attrCount, 0);
    memory.writePtr(struct, OFF.targetAlias, seed.targetAlias ? targetAlias : null);
    memory.writePtr(struct, OFF.userName, userName);
    return memory.alloc(struct);
  }

  const seeded = seeds.map(seedCredential);

  function record(name: string, args: unknown[]): void {
    const types = TXIKI_SYMBOLS[name]?.args ?? TXIKI_KERNEL32_SYMBOLS[name]?.args ?? [];
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
      }
    }
    calls.push({ name, args });
  }

  const symbols: Record<string, (...args: unknown[]) => unknown> = {
    CredWriteW(...args) {
      record("CredWriteW", args);
      return 1;
    },
    CredReadW(...args) {
      record("CredReadW", args);
      if (readStatus === 0) return 0;
      const target = wideToString(args[0] as Uint8Array);
      const type = args[1] as number;
      const match = seeds.findIndex((seed) => seed.targetName === target && seed.type === type);
      if (match < 0) return 0;
      memory.writePtr(args[3] as Uint8Array, 0, seeded[match]);
      return 1;
    },
    CredDeleteW(...args) {
      record("CredDeleteW", args);
      return deleteStatus;
    },
    CredEnumerateW(...args) {
      record("CredEnumerateW", args);
      if (enumerateStatus === 0) return 0;
      const filter = args[0] === null
        ? ""
        : wideToString((args[0] as TxikiPointer).toUint8Array(1024));
      const matching = seeded.filter((_, index) => {
        const name = seeds[index].targetName;
        if (filter === "") return true;
        return name.startsWith(filter.replace(/\*$/, ""));
      });
      memory.writeU32(args[2] as Uint8Array, 0, matching.length);
      const pointers = new Uint8Array(matching.length * 8);
      for (let index = 0; index < matching.length; index++) {
        memory.writePtr(pointers, index * 8, matching[index]);
      }
      memory.writePtr(args[3] as Uint8Array, 0, memory.alloc(pointers));
      return 1;
    },
    CredFree(...args) {
      record("CredFree", args);
      freed.push((args[0] as TxikiPointer).value);
    },
    GetLastError(...args) {
      record("GetLastError", args);
      return lastError;
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
      if (name === "advapi32.dll") equal(table, TXIKI_SYMBOLS);
      else if (name === "kernel32.dll") equal(table, TXIKI_KERNEL32_SYMBOLS);
      else throw new Error(`unexpected library ${name}`);
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
    freed,
    seeds,
    opens: () => opens,
    closes: () => closes,
    setReadStatus: (status: number) => {
      readStatus = status;
    },
    setDeleteStatus: (status: number) => {
      deleteStatus = status;
    },
    setEnumerateStatus: (status: number) => {
      enumerateStatus = status;
    },
    setLastError: (code: number) => {
      lastError = code;
    },
  };
}

test("win-cred txiki bindings declare every native symbol", () => {
  equal(Object.keys(TXIKI_SYMBOLS).sort(), [
    "CredDeleteW",
    "CredEnumerateW",
    "CredFree",
    "CredReadW",
    "CredWriteW",
  ]);
  equal(TXIKI_SYMBOLS.CredReadW.args, ["buffer", "u32", "u32", "buffer"]);
  equal(TXIKI_SYMBOLS.CredEnumerateW.args, ["ptr", "u32", "buffer", "buffer"]);
  equal(TXIKI_SYMBOLS.CredFree.returns, "void");
  equal(TXIKI_KERNEL32_SYMBOLS.GetLastError.returns, "u32");
});

test("win-cred txiki write packs the 64-bit CREDENTIALW layout", () => {
  const mock = mockFfi();
  const backend = createTxikiBackend(mock.ffi).backend;
  const secret = new Uint8Array([0, 255, 1]);

  backend.write({
    flags: 1,
    type: 1,
    targetName: "target",
    comment: "comment",
    lastWritten: 0x1122334455667788n,
    credentialBlobSize: secret.length,
    credentialBlob: secret,
    persist: 2,
    attributeCount: 0,
    targetAlias: "alias",
    userName: "user",
  }, 0);

  equal(mock.calls[0].name, "CredWriteW");
  equal(mock.calls[0].args[1], 0);
  const struct = mock.calls[0].args[0] as Uint8Array;
  const view = new DataView(struct.buffer, struct.byteOffset, struct.byteLength);
  equal(struct.length, SIZEOF_CREDENTIALW);
  equal(view.getUint32(OFF.flags, true), 1);
  equal(view.getUint32(OFF.type, true), 1);
  equal(wideToString(mock.memory.chunk(mock.ffi.createPointer(
    view.getBigUint64(OFF.targetName, true),
  )!)), "target");
  equal(wideToString(mock.memory.chunk(mock.ffi.createPointer(
    view.getBigUint64(OFF.comment, true),
  )!)), "comment");
  const blob = mock.memory.chunk(mock.ffi.createPointer(
    view.getBigUint64(OFF.blob, true),
  )!);
  equal([...blob.subarray(0, view.getUint32(OFF.blobSize, true))], [0, 255, 1]);
  equal(view.getUint32(OFF.persist, true), 2);
  equal(view.getUint32(OFF.attrCount, true), 0);
  equal(wideToString(mock.memory.chunk(mock.ffi.createPointer(
    view.getBigUint64(OFF.targetAlias, true),
  )!)), "alias");
  equal(wideToString(mock.memory.chunk(mock.ffi.createPointer(
    view.getBigUint64(OFF.userName, true),
  )!)), "user");
});

test("win-cred txiki read decodes wide strings, the 64-bit timestamp, and the blob", () => {
  const lastWritten = 0x0123456789abcdefn;
  const mock = mockFfi([{
    targetName: "target",
    type: 1,
    comment: "note",
    secret: new Uint8Array([1, 2, 3, 0, 4]),
    persist: 3,
    lastWritten,
    targetAlias: "alias",
    userName: "user",
  }]);
  const backend = createTxikiBackend(mock.ffi).backend;
  const credential = backend.read("target", 1);

  ok(credential);
  equal(credential.targetName, "target");
  equal(credential.comment, "note");
  equal(credential.type, 1);
  equal(credential.persist, 3);
  equal(credential.lastWritten, lastWritten);
  equal(credential.credentialBlobSize, 5);
  equal([...credential.credentialBlob], [1, 2, 3, 0, 4]);
  equal(credential.targetAlias, "alias");
  equal(credential.userName, "user");
  equal(mock.freed.length, 1);
  equal(wideToString(mock.calls[0].args[0] as Uint8Array), "target");
});

test("win-cred txiki read returns null for a missing target", () => {
  const mock = mockFfi();
  const backend = createTxikiBackend(mock.ffi).backend;
  equal(backend.read("missing", 1), null);
  equal(mock.freed.length, 0);
});

test("win-cred txiki enumerate parses an array of credential pointers", () => {
  const mock = mockFfi([
    { targetName: "a", type: 1, secret: new Uint8Array([1]) },
    { targetName: "b", type: 1, secret: new Uint8Array([2]) },
  ]);
  const backend = createTxikiBackend(mock.ffi).backend;
  const records: RawCredential[] = backend.enumerate(null, 1);

  equal(records.map((record) => record.targetName), ["a", "b"]);
  equal(records.map((record) => [...record.credentialBlob]), [[1], [2]]);
  equal(mock.freed.length, 1);
  equal(mock.calls.at(-1)?.name, "CredFree");
});

test("win-cred txiki enumerate filters by target prefix", () => {
  const mock = mockFfi([
    { targetName: "neotales:a", type: 1 },
    { targetName: "other:b", type: 1 },
  ]);
  const backend = createTxikiBackend(mock.ffi).backend;
  const records = backend.enumerate("neotales:*", 0);
  equal(records.map((record) => record.targetName), ["neotales:a"]);
});

test("win-cred txiki delete reports the native boolean", () => {
  const mock = mockFfi();
  const backend = createTxikiBackend(mock.ffi).backend;

  equal(backend.delete("target", 1), true);
  equal(wideToString(mock.calls[0].args[0] as Uint8Array), "target");
  equal(mock.calls[0].args[1], 1);
  equal(mock.calls[0].args[2], 0);

  mock.setDeleteStatus(0);
  equal(backend.delete("target", 1), false);
});

test("win-cred txiki reads missing only for ERROR_NOT_FOUND", () => {
  const missing = mockFfi();
  const backend = createTxikiBackend(missing.ffi).backend;
  equal(backend.read("missing", 1), null);

  const denied = mockFfi();
  denied.setLastError(5);
  expectThrows(
    () => createTxikiBackend(denied.ffi).backend.read("missing", 1),
    /CredReadW failed with Win32 error 5/,
  );
});

test("win-cred txiki delete and enumerate reject real errors", () => {
  const denied = mockFfi();
  denied.setDeleteStatus(0);
  denied.setLastError(5);
  expectThrows(
    () => createTxikiBackend(denied.ffi).backend.delete("target", 1),
    /CredDeleteW failed with Win32 error 5/,
  );

  const noSession = mockFfi();
  noSession.setDeleteStatus(0);
  noSession.setLastError(1312);
  expectThrows(
    () => createTxikiBackend(noSession.ffi).backend.delete("target", 1),
    /CredDeleteW failed with Win32 error 1312/,
  );

  const enumerateDenied = mockFfi();
  enumerateDenied.setEnumerateStatus(0);
  enumerateDenied.setLastError(5);
  expectThrows(
    () => createTxikiBackend(enumerateDenied.ffi).backend.enumerate(null, 0),
    /CredEnumerateW failed with Win32 error 5/,
  );

  const enumerateMissing = mockFfi();
  enumerateMissing.setEnumerateStatus(0);
  equal(createTxikiBackend(enumerateMissing.ffi).backend.enumerate(null, 0), []);
});

test("win-cred txiki availability probe fails closed on a load error", () => {
  const failing = {
    createPointer: () => null,
    bufferToPointer: () => null,
    read: { u8: () => 0, u32: () => 0, ptr: () => null },
    dlopen: () => {
      throw new Error("advapi32.dll is missing");
    },
  } as unknown as TxikiFfiModule;
  const backend = createTxikiBackend(failing);
  expectThrows(() => backend.open(), /advapi32.dll is missing/);
  equal(backend.isOpened(), false);
});

test("win-cred txiki lifecycle opens once and closes once", () => {
  const mock = mockFfi();
  const backend = createTxikiBackend(mock.ffi);

  equal(backend.isOpened(), false);
  backend.open();
  backend.open();
  equal(backend.isOpened(), true);
  equal(mock.opens(), 2);
  backend.close();
  equal(backend.isOpened(), false);
  equal(mock.closes(), 2);
  backend.close();
  equal(mock.closes(), 2);
});
