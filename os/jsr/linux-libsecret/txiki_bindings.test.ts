import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  createTxikiBackend,
  type TxikiFfiModule,
  type TxikiPointer,
  TXIKI_GLIB_SYMBOLS,
  TXIKI_GIO_SYMBOLS,
  TXIKI_GOBJECT_SYMBOLS,
  TXIKI_LIBSECRET_SYMBOLS,
} from "./txiki_bindings.ts";
import { LibsecretErrorHandle } from "./types.ts";

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


const canEncode = typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined";
function encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}
function decode(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

class MockMemory {
  #chunks = new Map<number, Uint8Array>();
  #buffers = new Map<Uint8Array, TxikiPointer>();
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

  bufferToPointer(buffer: Uint8Array): TxikiPointer {
    const existing = this.#buffers.get(buffer);
    if (existing) return existing;
    const pointer = this.alloc(buffer);
    this.#buffers.set(buffer, pointer);
    return pointer;
  }

  allocAt(pointer: TxikiPointer, bytes: Uint8Array): TxikiPointer {
    this.#chunks.set(Number(pointer.value), bytes);
    return pointer;
  }

  chunk(pointer: TxikiPointer): Uint8Array {
    if (pointer === null || pointer === undefined || typeof pointer.value !== "bigint") {
      throw new Error(`invalid pointer ${String(pointer)}`);
    }
    const chunk = this.#chunks.get(Number(pointer.value));
    if (!chunk) throw new Error(`no memory at ${pointer.value}`);
    return chunk;
  }

  u8(pointer: TxikiPointer, offset = 0): number {
    const chunk = this.chunk(pointer);
    if (offset < 0 || offset >= chunk.length) {
      throw new RangeError(`read past synthetic allocation at ${pointer.value}+${offset}`);
    }
    return chunk[offset];
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

  cstr(value: string): TxikiPointer {
    const bytes = encode(value);
    const buffer = new Uint8Array(bytes.length + 1);
    buffer.set(bytes);
    return this.alloc(buffer);
  }

  string(pointer: TxikiPointer | null): string {
    if (pointer === null) return "";
    const bytes = this.chunk(pointer);
    let end = bytes.length;
    for (let index = 0; index < bytes.length; index++) {
      if (bytes[index] === 0) {
        end = index;
        break;
      }
    }
    return decode(bytes.subarray(0, end));
  }
}

type Options = {
  withGio?: boolean;
  lookup?: { text: string } | { error: string } | null;
  store?: boolean;
  clear?: boolean;
  storeError?: string;
};

function mockFfi(options: Options = {}) {
  const memory = new MockMemory();
  const calls: { name: string; args: unknown[] }[] = [];
  const freedPasswords: bigint[] = [];
  const freedErrors: bigint[] = [];
  const unreffed: bigint[] = [];
  const opened = new Map<string, { args?: string[]; returns?: string }>();
  const closed: string[] = [];

  const schemaPointer = memory.pointer(0x9000);
  const passwordPointer = memory.pointer(0xa000);
  const cancellablePointer = memory.pointer(0xb000);
  const errorPointer = memory.pointer(0xc000);
  let listError = false;
  let retrieveError = false;
  let lookupInvalidUtf8 = false;
  let secretNull = false;
  let secretPayload = new Uint8Array([0xef, 0xbb, 0xbf, 0x41, 0x00, 0x42]);

  function record(name: string, args: unknown[], table: Record<string, { args?: string[] }>): void {
    const types = table[name]?.args ?? [];
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
    secret_schema_new(...args) {
      record("secret_schema_new", args, TXIKI_LIBSECRET_SYMBOLS);
      return schemaPointer;
    },
    secret_password_lookup_sync(...args) {
      record("secret_password_lookup_sync", args, TXIKI_LIBSECRET_SYMBOLS);
      const outcome = options.lookup ?? null;
      if (outcome === null) {
        memory.writePtr(args[2] as Uint8Array, 0, null);
        if (lookupInvalidUtf8) {
          memory.allocAt(passwordPointer, new Uint8Array([0xff, 0]));
          return passwordPointer;
        }
        return null;
      }
      if ("error" in outcome) {
        const message = memory.cstr(outcome.error);
        const error = new Uint8Array(16);
        memory.writePtr(error, 8, message);
        const allocated = memory.alloc(error);
        memory.writePtr(args[2] as Uint8Array, 0, allocated);
        return null;
      }
      memory.writePtr(args[2] as Uint8Array, 0, null);
      memory.allocAt(passwordPointer, memory.chunk(memory.cstr(outcome.text)));
      return passwordPointer;
    },
    secret_password_store_sync(...args) {
      record("secret_password_store_sync", args, TXIKI_LIBSECRET_SYMBOLS);
      if (options.storeError) {
        const message = memory.cstr(options.storeError);
        const error = new Uint8Array(16);
        memory.writePtr(error, 8, message);
        memory.writePtr(args[5] as Uint8Array, 0, memory.alloc(error));
      } else {
        memory.writePtr(args[5] as Uint8Array, 0, null);
      }
      return options.store === false ? 0 : 1;
    },
    secret_password_clear_sync(...args) {
      record("secret_password_clear_sync", args, TXIKI_LIBSECRET_SYMBOLS);
      memory.writePtr(args[2] as Uint8Array, 0, null);
      return options.clear === false ? 0 : 1;
    },
    secret_password_free(...args) {
      record("secret_password_free", args, TXIKI_LIBSECRET_SYMBOLS);
      freedPasswords.push((args[0] as TxikiPointer).value);
    },
    g_error_free(...args) {
      record("g_error_free", args, TXIKI_GLIB_SYMBOLS);
      freedErrors.push((args[0] as TxikiPointer).value);
    },
    g_cancellable_new(...args) {
      record("g_cancellable_new", args, TXIKI_GIO_SYMBOLS);
      return cancellablePointer;
    },
    g_cancellable_cancel(...args) {
      record("g_cancellable_cancel", args, TXIKI_GIO_SYMBOLS);
    },
    g_object_unref(...args) {
      record("g_object_unref", args, TXIKI_GOBJECT_SYMBOLS);
      unreffed.push((args[0] as TxikiPointer).value);
    },
    secret_password_search_sync(...args) {
      record("secret_password_search_sync", args, TXIKI_LIBSECRET_SYMBOLS);
      if (listError) {
        const message = memory.cstr("list boom");
        const error = new Uint8Array(16);
        memory.writePtr(error, 8, message);
        memory.writePtr(args[3] as Uint8Array, 0, memory.alloc(error));
        return null;
      }
      const node = memory.alloc(new Uint8Array(16));
      memory.writePtr(memory.chunk(node), 0, memory.pointer(0xe000));
      memory.writePtr(memory.chunk(node), 8, null);
      return node;
    },
    secret_retrievable_get_attributes(...args) {
      record("secret_retrievable_get_attributes", args, TXIKI_LIBSECRET_SYMBOLS);
      return memory.alloc(new Uint8Array(8));
    },
    g_hash_table_lookup(...args) {
      record("g_hash_table_lookup", args, TXIKI_GLIB_SYMBOLS);
      const name = decode(args[1] as Uint8Array).replaceAll("\0", "");
      return name === "account" ? memory.cstr("\ufeffaccount") : null;
    },
    secret_retrievable_retrieve_secret_sync(...args) {
      record("secret_retrievable_retrieve_secret_sync", args, TXIKI_LIBSECRET_SYMBOLS);
      if (retrieveError) {
        const message = memory.cstr("retrieve boom");
        const error = new Uint8Array(16);
        memory.writePtr(error, 8, message);
        memory.writePtr(args[2] as Uint8Array, 0, memory.alloc(error));
        return null;
      }
      return memory.pointer(0xe100);
    },
    secret_value_get(...args) {
      record("secret_value_get", args, TXIKI_LIBSECRET_SYMBOLS);
      const length = args[1] as Uint8Array;
      new DataView(length.buffer, length.byteOffset, length.byteLength)
        .setBigUint64(0, BigInt(secretPayload.length), true);
      if (secretNull) return null;
      return memory.alloc(secretPayload);
    },
    secret_value_unref(...args) {
      record("secret_value_unref", args, TXIKI_LIBSECRET_SYMBOLS);
    },
    g_hash_table_unref(...args) {
      record("g_hash_table_unref", args, TXIKI_GLIB_SYMBOLS);
    },
    g_list_free(...args) {
      record("g_list_free", args, TXIKI_GLIB_SYMBOLS);
    },
  };

  const ffi: TxikiFfiModule = {
    types: {
      pointer: { size: 8 },
      size: { size: 8 },
    },
    createPointer(value) {
      return memory.pointer(value);
    },
    bufferToPointer(buffer) {
      return memory.bufferToPointer(buffer);
    },
    read: {
      u8: (pointer, offset) => memory.u8(pointer, offset),
      ptr: (pointer, offset) => memory.ptr(pointer, offset),
    },
    dlopen(name, table) {
      if (name === "libgio-2.0.so.0" && options.withGio === false) {
        throw new Error("libgio-2.0.so.0 is not installed");
      }
      opened.set(name, table);
      return {
        symbols,
        close() {
          closed.push(name);
        },
      };
    },
  };

  return {
    ffi,
    memory,
    calls,
    freedPasswords,
    freedErrors,
    unreffed,
    opened,
    closed,
    schemaPointer,
    passwordPointer,
    cancellablePointer,
    errorPointer,
    setListError: (value: boolean) => {
      listError = value;
    },
    setRetrieveError: (value: boolean) => {
      retrieveError = value;
    },
    setLookupInvalidUtf8: (value: boolean) => {
      lookupInvalidUtf8 = value;
    },
    setSecretPayload: (value: Uint8Array) => {
      secretPayload = value;
    },
    setSecretNull: (value: boolean) => {
      secretNull = value;
    },
  };
}

function schema(backend: ReturnType<typeof createTxikiBackend>["backend"]) {
  const handle = backend.secretSchemaNew(
    "org.example.Secret",
    0,
    "service",
    0,
    "account",
    0,
    null,
  );
  ok(handle);
  return handle;
}

function expectedSymbols(): void {
  equal(Object.keys(TXIKI_LIBSECRET_SYMBOLS).sort(), [
    "secret_password_clear_sync",
    "secret_password_free",
    "secret_password_lookup_sync",
    "secret_password_search_sync",
    "secret_password_store_sync",
    "secret_retrievable_get_attributes",
    "secret_retrievable_retrieve_secret_sync",
    "secret_schema_new",
    "secret_value_get",
    "secret_value_unref",
  ]);
  equal(TXIKI_LIBSECRET_SYMBOLS.secret_schema_new.args, [
    "buffer",
    "u32",
    "buffer",
    "u32",
    "buffer",
    "u32",
    "ptr",
  ]);
  equal(TXIKI_LIBSECRET_SYMBOLS.secret_password_lookup_sync.args, [
    "ptr",
    "ptr",
    "buffer",
    "buffer",
    "buffer",
    "buffer",
    "buffer",
    "ptr",
  ]);
  equal(TXIKI_GLIB_SYMBOLS.g_error_free.args, ["ptr"]);
  equal(TXIKI_GIO_SYMBOLS.g_cancellable_new.returns, "ptr");
  equal(TXIKI_GOBJECT_SYMBOLS.g_object_unref.args, ["ptr"]);
}

test("linux-libsecret txiki bindings declare every native symbol", () => {
  expectedSymbols();
});

test("linux-libsecret txiki schema creation passes null-terminated strings", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi();
  const backend = createTxikiBackend(mock.ffi).backend;
  const handle = schema(backend);

  equal(handle.runtime, "tjs");
  const args = mock.calls[0].args;
  equal(mock.memory.string(mock.memory.bufferToPointer(args[0] as Uint8Array)), "org.example.Secret");
  equal(mock.memory.string(mock.memory.bufferToPointer(args[2] as Uint8Array)), "service");
  equal(mock.memory.string(mock.memory.bufferToPointer(args[4] as Uint8Array)), "account");
  equal((args[0] as Uint8Array).at(-1), 0);
  equal((args[2] as Uint8Array).at(-1), 0);
  equal((args[4] as Uint8Array).at(-1), 0);
});

test("linux-libsecret txiki lookup returns the password and frees it on request", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi({ lookup: { text: "top-secret" } });
  const backend = createTxikiBackend(mock.ffi).backend;
  const errorOut = new LibsecretErrorHandle();

  const password = backend.secretPasswordLookupSync(
    schema(backend),
    null,
    errorOut,
    "service",
    "svc",
    "account",
    "acct",
    null,
  );
  ok(password);
  equal(password.text(), "top-secret");
  equal(errorOut.error(), null);
  equal(mock.freedPasswords, []);
  backend.secretPasswordFree(password);
  equal(mock.freedPasswords, [mock.passwordPointer.value]);
});

test("linux-libsecret txiki lookup frees the owned pointer when UTF-8 decoding fails", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi();
  mock.setLookupInvalidUtf8(true);
  const backend = createTxikiBackend(mock.ffi).backend;
  const errorOut = new LibsecretErrorHandle();
  expectThrows(
    () =>
      backend.secretPasswordLookupSync(
        schema(backend),
        null,
        errorOut,
        "service",
        "svc",
        "account",
        "acct",
        null,
      ),
    /valid UTF-8/,
  );
  equal(mock.freedPasswords, [mock.passwordPointer.value]);
});

test("linux-libsecret txiki lookup captures and frees a GError", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi({ lookup: { error: "boom" } });
  const backend = createTxikiBackend(mock.ffi).backend;
  const errorOut = new LibsecretErrorHandle();

  const password = backend.secretPasswordLookupSync(
    schema(backend),
    null,
    errorOut,
    "service",
    "svc",
    "account",
    "acct",
    null,
  );
  equal(password, null);
  equal(errorOut.error()?.message, "boom");
  equal(mock.freedErrors.length, 1);
});

test("linux-libsecret txiki store and clear report the native boolean", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi({ store: false, clear: false });
  const backend = createTxikiBackend(mock.ffi).backend;
  const errorOut = new LibsecretErrorHandle();
  const schemaHandle = schema(backend);

  equal(
    backend.secretPasswordStoreSync(
      schemaHandle,
      "default",
      "label",
      "password",
      null,
      errorOut,
      "service",
      "svc",
      "account",
      "acct",
      null,
    ),
    false,
  );
  equal(
    backend.secretPasswordClearSync(
      schemaHandle,
      null,
      errorOut,
      "service",
      "svc",
      "account",
      "acct",
      null,
    ),
    false,
  );
  const storeArgs = mock.calls.find((call) => call.name === "secret_password_store_sync")!.args;
  equal(mock.memory.string(mock.memory.bufferToPointer(storeArgs[1] as Uint8Array)), "default");
  equal(mock.memory.string(mock.memory.bufferToPointer(storeArgs[2] as Uint8Array)), "label");
  equal(mock.memory.string(mock.memory.bufferToPointer(storeArgs[3] as Uint8Array)), "password");
});

test("linux-libsecret txiki GIO lifecycle creates, cancels, and unreferences", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi({ withGio: true });
  const backend = createTxikiBackend(mock.ffi).backend;
  ok(backend.gio);

  const cancellable = backend.gio!.cancellableNew();
  backend.gio!.cancellableCancel(cancellable);
  backend.gio!.cancellableRelease(cancellable);
  equal(mock.unreffed, [mock.cancellablePointer.value]);
});

test("linux-libsecret txiki GIO stays optional", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi({ withGio: false });
  const backend = createTxikiBackend(mock.ffi).backend;
  equal(backend.gio, undefined);
});

test("linux-libsecret txiki enumerates records and frees the list", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const mock = mockFfi();
  const backend = createTxikiBackend(mock.ffi).backend;
  const records = backend.listSecretRecords!("service");
  equal(records.map((record) => record.account), ["\ufeffaccount"]);
  equal(records.map((record) => [...record.secret]), [[0xef, 0xbb, 0xbf, 0x41, 0x00, 0x42]]);
  equal(mock.calls.some((call) => call.name === "g_hash_table_unref"), true);
  equal(mock.calls.some((call) => call.name === "g_list_free"), true);
  equal(mock.calls.some((call) => call.name === "g_object_unref"), true);
});

test("linux-libsecret txiki enumeration propagates search and retrieve errors", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const search = mockFfi();
  search.setListError(true);
  expectThrows(
    () => createTxikiBackend(search.ffi).backend.listSecretRecords!("service"),
    /list boom/,
  );

  const retrieve = mockFfi();
  retrieve.setRetrieveError(true);
  expectThrows(
    () => createTxikiBackend(retrieve.ffi).backend.listSecretRecords!("service"),
    /retrieve boom/,
  );
});

test("linux-libsecret txiki enumeration handles zero and null secret data", (t) => {
  if (!canEncode) t.skip("JerryScript has no TextEncoder/TextDecoder; txiki.js does");
  const empty = mockFfi();
  empty.setSecretPayload(new Uint8Array(0));
  const emptyRecords = createTxikiBackend(empty.ffi).backend.listSecretRecords!("service");
  equal(emptyRecords.map((record) => [...record.secret]), [[]]);

  const nullPointer = mockFfi();
  nullPointer.setSecretNull(true);
  expectThrows(
    () => createTxikiBackend(nullPointer.ffi).backend.listSecretRecords!("service"),
    /null pointer with a non-zero length/,
  );
});

test("linux-libsecret txiki enumeration fails closed on a 32-bit process ABI", () => {
  const mock = mockFfi();
  mock.ffi.types!.pointer!.size = 4;
  mock.ffi.types!.size!.size = 4;
  const backend = createTxikiBackend(mock.ffi).backend;
  expectThrows(
    () => backend.listSecretRecords!("service"),
    /verified 64-bit/,
  );
  equal(mock.calls.length, 0);
});

test("linux-libsecret txiki ordinary operations fail closed on rejected ABI", () => {
  const mock = mockFfi();
  mock.ffi.types!.pointer!.size = 4;
  mock.ffi.types!.size!.size = 4;
  const instance = createTxikiBackend(mock.ffi);
  const backend = instance.backend;
  const errorOut = new LibsecretErrorHandle();

  expectThrows(
    () =>
      backend.secretPasswordLookupSync(
        null as never,
        null,
        errorOut,
        "service",
        "svc",
        "account",
        "acct",
        null,
      ),
    /verified 64-bit/,
  );
  expectThrows(
    () =>
      backend.secretPasswordStoreSync(
        null as never,
        "default",
        "label",
        "password",
        null,
        errorOut,
        "service",
        "svc",
        "account",
        "acct",
        null,
      ),
    /verified 64-bit/,
  );
  expectThrows(
    () =>
      backend.secretPasswordClearSync(
        null as never,
        null,
        errorOut,
        "service",
        "svc",
        "account",
        "acct",
        null,
      ),
    /verified 64-bit/,
  );
  expectThrows(() => backend.secretPasswordFree(null as never), /verified 64-bit/);
  expectThrows(() => backend.listSecretRecords!("service"), /verified 64-bit/);
  expectThrows(() => instance.open(), /verified 64-bit/);
  equal(mock.calls.length, 0);
});

test("linux-libsecret txiki ordinary operations reject big-endian and unknown ABI", () => {
  for (const endianness of ["big", null] as const) {
    const mock = mockFfi();
    const backend = createTxikiBackend(mock.ffi, { endianness }).backend;
    const errorOut = new LibsecretErrorHandle();
    expectThrows(
      () =>
        backend.secretPasswordLookupSync(
          null as never,
          null,
          errorOut,
          "service",
          "svc",
          "account",
          "acct",
          null,
        ),
      /little-endian/,
    );
    equal(mock.calls.length, 0);
  }
});

test("linux-libsecret txiki enumeration fails closed on missing or inconsistent types", () => {
  const missing = mockFfi();
  missing.ffi.types = undefined;
  expectThrows(
    () => createTxikiBackend(missing.ffi).backend.listSecretRecords!("service"),
    /verified 64-bit/,
  );
  equal(missing.calls.length, 0);

  const inconsistent = mockFfi();
  inconsistent.ffi.types!.size!.size = 4;
  expectThrows(
    () => createTxikiBackend(inconsistent.ffi).backend.listSecretRecords!("service"),
    /verified 64-bit/,
  );
  equal(inconsistent.calls.length, 0);
});

test("linux-libsecret txiki availability probe fails closed on a load error", () => {
  const failing = {
    types: { pointer: { size: 8 }, size: { size: 8 } },
    createPointer: () => null,
    bufferToPointer: () => null,
    read: { u8: () => 0, ptr: () => null },
    dlopen: () => {
      throw new Error("libsecret-1.so.0 is missing");
    },
  } as unknown as TxikiFfiModule;
  const libsecret = createTxikiBackend(failing);
  expectThrows(() => libsecret.open(), /libsecret-1\.so\.0 is missing/);
  equal(libsecret.isOpened(), false);
});

test("linux-libsecret txiki lifecycle opens once and closes once", () => {
  const mock = mockFfi({ withGio: true });
  const libsecret = createTxikiBackend(mock.ffi);

  equal(libsecret.isOpened(), false);
  libsecret.open();
  libsecret.open();
  equal(libsecret.isOpened(), true);
  equal(mock.opened.size, 4);
  libsecret.close();
  equal(libsecret.isOpened(), false);
  equal(mock.closed.length, 4);
  libsecret.close();
  equal(mock.closed.length, 4);
});
