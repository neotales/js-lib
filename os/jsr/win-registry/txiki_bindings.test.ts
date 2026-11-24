import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  createTxikiBackend,
  TXIKI_SYMBOLS,
  type TxikiFfiModule,
} from "./txiki_bindings.ts";
import { RegistryError } from "./registry_error.ts";
import {
  ERROR_ACCESS_DENIED,
  ERROR_FILE_NOT_FOUND,
  ERROR_MORE_DATA,
  ERROR_SUCCESS,
  HKEY_CURRENT_USER,
  HKEY_PERFORMANCE_DATA,
} from "./types.ts";

type Call = { name: string; args: unknown[] };
type QueryStep = {
  status: number;
  type?: number;
  size?: number;
  bytes?: number[];
};

function pointerValue(value: unknown): bigint {
  if (typeof value !== "object" || value === null || !("value" in value)) {
    throw new Error("expected a pointer object");
  }
  const address = (value as { value: unknown }).value;
  if (typeof address !== "bigint") throw new Error("expected a bigint pointer");
  return address;
}

function buffer(value: unknown): Uint8Array {
  if (!(value instanceof Uint8Array)) throw new Error("expected a Uint8Array");
  return value;
}

function writeU64(value: unknown, number: bigint): void {
  const view = new DataView(buffer(value).buffer, buffer(value).byteOffset, buffer(value).byteLength);
  view.setBigUint64(0, number, true);
}

function record(calls: Call[], name: string, args: unknown[]): void {
  const types = TXIKI_SYMBOLS[name].args ?? [];
  equal(args.length, types.length, `${name} argument count`);
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    if (type === "buffer") {
      ok(args[i] instanceof Uint8Array, `${name} argument ${i} is a buffer`);
    } else if (type === "ptr") {
      const value = args[i];
      ok(
        value === null ||
          (typeof value === "object" && value !== null && "value" in value),
        `${name} argument ${i} is a pointer or null`,
      );
    } else if (type === "u32") {
      equal(typeof args[i], "number", `${name} argument ${i} is a u32`);
    } else {
      throw new Error(`${name} argument ${i} has unknown type ${type}`);
    }
  }
  calls.push({ name, args });
}

function mockFfi() {
  const calls: Call[] = [];
  let opens = 0;
  let closes = 0;
  let openStatus = 0;
  let setValueStatus = 0;
  let querySteps: QueryStep[] = [];
  let queryCalls = 0;

  const symbols: Record<string, (...args: unknown[]) => unknown> = {
    RegOpenKeyExW(...args) {
      record(calls, "RegOpenKeyExW", args);
      if (openStatus === 0) writeU64(args[4], 0x1234n);
      return openStatus;
    },
    RegCreateKeyExW(...args) {
      record(calls, "RegCreateKeyExW", args);
      writeU64(args[7], 0x42n);
      new DataView(buffer(args[8]).buffer).setUint32(0, 1, true);
      return 0;
    },
    RegCloseKey(...args) {
      record(calls, "RegCloseKey", args);
      return 0;
    },
    RegDeleteKeyW(...args) {
      record(calls, "RegDeleteKeyW", args);
      return 0;
    },
    RegDeleteValueW(...args) {
      record(calls, "RegDeleteValueW", args);
      return 0;
    },
    RegQueryInfoKeyW() {
      return 0;
    },
    RegEnumKeyExW(...args) {
      record(calls, "RegEnumKeyExW", args);
      return 259;
    },
    RegEnumValueW(...args) {
      record(calls, "RegEnumValueW", args);
      return 259;
    },
    RegQueryValueExW(...args) {
      record(calls, "RegQueryValueExW", args);
      const step = querySteps[Math.min(queryCalls, querySteps.length - 1)];
      queryCalls++;
      if (!step) return ERROR_SUCCESS;
      if (step.type !== undefined) {
        new DataView(buffer(args[3]).buffer).setUint32(0, step.type, true);
      }
      if (step.size !== undefined) {
        new DataView(buffer(args[5]).buffer).setUint32(0, step.size, true);
      }
      if (step.bytes) buffer(args[4]).set(step.bytes);
      return step.status;
    },
    RegSetValueExW(...args) {
      record(calls, "RegSetValueExW", args);
      return setValueStatus;
    },
  };

  const ffi: TxikiFfiModule = {
    createPointer(value) {
      return { value };
    },
    dlopen(name, table) {
      opens++;
      equal(name, "advapi32.dll");
      equal(table, TXIKI_SYMBOLS);
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
    calls,
    opens: () => opens,
    closes: () => closes,
    setOpenStatus: (status: number) => {
      openStatus = status;
    },
    setSetValueStatus: (status: number) => {
      setValueStatus = status;
    },
    setQuerySteps: (steps: QueryStep[]) => {
      querySteps = steps;
      queryCalls = 0;
    },
  };
}

test("txiki bindings declare every advapi32 symbol", () => {
  const got = Object.keys(TXIKI_SYMBOLS).sort();
  const exp = [
    "RegCloseKey",
    "RegCreateKeyExW",
    "RegDeleteKeyW",
    "RegDeleteValueW",
    "RegEnumKeyExW",
    "RegEnumValueW",
    "RegOpenKeyExW",
    "RegQueryInfoKeyW",
    "RegQueryValueExW",
    "RegSetValueExW",
  ];
  equal(got, exp);
  equal(TXIKI_SYMBOLS.RegOpenKeyExW.args, ["ptr", "buffer", "u32", "u32", "buffer"]);
  equal(TXIKI_SYMBOLS.RegSetValueExW.returns, "i32");
});

test("txiki backend opens a key and passes the parent handle as a pointer", () => {
  const mock = mockFfi();
  const registry = createTxikiBackend(mock.ffi, 64);

  const handle = registry.backend.openKey(HKEY_CURRENT_USER, "Software", 0x20019);
  equal(handle, 0x1234n);
  equal(mock.calls[0].name, "RegOpenKeyExW");
  equal(pointerValue(mock.calls[0].args[0]), 0xffffffff80000001n);
  equal(mock.calls[0].args[2], 0);
  equal(mock.calls[0].args[3], 0x20019);

  const subKey = buffer(mock.calls[0].args[1]);
  equal(subKey[0], 83); // "S"
  equal(subKey[1], 0);
  equal(subKey[subKey.length - 2], 0);
  equal(subKey[subKey.length - 1], 0);
});

test("txiki backend creates a key and reports the disposition", () => {
  const mock = mockFfi();
  const registry = createTxikiBackend(mock.ffi, 64);

  const created = registry.backend.createKey(
    HKEY_CURRENT_USER,
    "Software\\MyApp",
    0x20019,
  );
  equal(created.handle, 0x42n);
  equal(created.created, true);
  equal(pointerValue(mock.calls[0].args[0]), 0xffffffff80000001n);
  equal(mock.calls[0].args[3], null);
  equal(mock.calls[0].args[6], null);
});

test("txiki backend closes a key through a recreated pointer", () => {
  const mock = mockFfi();
  const registry = createTxikiBackend(mock.ffi, 64);

  registry.backend.closeKey(0x42n);
  equal(mock.calls[0].name, "RegCloseKey");
  equal(pointerValue(mock.calls[0].args[0]), 0x42n);
});

test("txiki backend propagates a failed open as RegistryError", () => {
  const mock = mockFfi();
  mock.setOpenStatus(5);
  const registry = createTxikiBackend(mock.ffi, 64);

  try {
    registry.backend.openKey(HKEY_CURRENT_USER, "Software", 0x20019);
    throw new Error("expected RegistryError");
  } catch (error) {
    ok(error instanceof RegistryError);
  }
});

test("txiki backend loads a value that needs a larger buffer", () => {
  const mock = mockFfi();
  mock.setQuerySteps([
    { status: ERROR_MORE_DATA, size: 5000 },
    { status: ERROR_SUCCESS, type: 1, size: 4, bytes: [1, 2, 3, 4] },
  ]);
  const registry = createTxikiBackend(mock.ffi, 64);

  const value = registry.backend.queryValue(0x42n, "Theme");
  ok(value);
  equal(value.type, 1);
  equal([...value.data], [1, 2, 3, 4]);
  equal(mock.calls.length, 2);
});

test("txiki backend ignores a bogus size for HKEY_PERFORMANCE_DATA", () => {
  const mock = mockFfi();
  mock.setQuerySteps([
    { status: ERROR_MORE_DATA, size: 0xffffffff },
    { status: ERROR_SUCCESS, type: 1, size: 4, bytes: [1, 2, 3, 4] },
  ]);
  const registry = createTxikiBackend(mock.ffi, 64);

  const value = registry.backend.queryValue(HKEY_PERFORMANCE_DATA, "PerfData");
  ok(value);
  equal([...value.data], [1, 2, 3, 4]);
  equal(mock.calls.length, 2);
});

test("txiki backend ignores a bogus size for a normal handle", () => {
  const mock = mockFfi();
  mock.setQuerySteps([
    { status: ERROR_MORE_DATA, size: 0xffffffff },
    { status: ERROR_SUCCESS, type: 1, size: 4, bytes: [1, 2, 3, 4] },
  ]);
  const registry = createTxikiBackend(mock.ffi, 64);
  const value = registry.backend.queryValue(HKEY_CURRENT_USER, "Theme");
  ok(value);
  equal([...value.data], [1, 2, 3, 4]);
});

test("txiki backend ignores a bogus size for an opened handle", () => {
  const mock = mockFfi();
  mock.setQuerySteps([
    { status: ERROR_MORE_DATA, size: 0xffffffff },
    { status: ERROR_SUCCESS, type: 1, size: 4, bytes: [1, 2, 3, 4] },
  ]);
  const registry = createTxikiBackend(mock.ffi, 64);
  const value = registry.backend.queryValue(0x42n, "Theme");
  ok(value);
  equal([...value.data], [1, 2, 3, 4]);
});

test("txiki backend honors a smaller size on the retry", () => {
  const mock = mockFfi();
  mock.setQuerySteps([
    { status: ERROR_MORE_DATA, size: 5000 },
    { status: ERROR_SUCCESS, type: 1, size: 3, bytes: [1, 2, 3, 4, 5] },
  ]);
  const registry = createTxikiBackend(mock.ffi, 64);

  const value = registry.backend.queryValue(0x42n, "Theme");
  ok(value);
  equal([...value.data], [1, 2, 3]);
});

test("txiki backend returns null only for a missing value", () => {
  const mock = mockFfi();
  mock.setQuerySteps([{ status: ERROR_FILE_NOT_FOUND }]);
  const registry = createTxikiBackend(mock.ffi, 64);
  equal(registry.backend.queryValue(0x42n, "Theme"), null);
});

test("txiki backend propagates an access-denied query", () => {
  const mock = mockFfi();
  mock.setQuerySteps([{ status: ERROR_ACCESS_DENIED }]);
  const registry = createTxikiBackend(mock.ffi, 64);
  try {
    registry.backend.queryValue(0x42n, "Theme");
    throw new Error("expected RegistryError");
  } catch (error) {
    ok(error instanceof RegistryError);
  }
});

test("txiki backend sign-extends predefined roots for the host width", () => {
  const wide = mockFfi();
  createTxikiBackend(wide.ffi, 64).backend.openKey(
    HKEY_CURRENT_USER,
    "Software",
    0x20019,
  );
  equal(pointerValue(wide.calls[0].args[0]), 0xffffffff80000001n);

  const narrow = mockFfi();
  createTxikiBackend(narrow.ffi, 32).backend.openKey(
    HKEY_CURRENT_USER,
    "Software",
    0x20019,
  );
  equal(pointerValue(narrow.calls[0].args[0]), 0x80000001n);
});

test("txiki backend returns null when enumeration ends", () => {
  const mock = mockFfi();
  const registry = createTxikiBackend(mock.ffi, 64);

  equal(registry.backend.enumKeyNames(0x42n, 0, 255), null);
  equal(registry.backend.enumValueNames(0x42n, 0, 255), null);
});

test("txiki lifecycle opens once and closes once", () => {
  const mock = mockFfi();
  const registry = createTxikiBackend(mock.ffi, 64);

  equal(registry.isOpened(), false);
  registry.open();
  registry.open();
  equal(registry.isOpened(), true);
  equal(mock.opens(), 1);
  registry.close();
  equal(registry.isOpened(), false);
  equal(mock.closes(), 1);
  registry.close();
  equal(mock.closes(), 1);
});

test("txiki backend keeps RegistryError for a failed write", () => {
  const mock = mockFfi();
  mock.setSetValueStatus(5);
  const registry = createTxikiBackend(mock.ffi, 64);

  try {
    registry.backend.setValue(0x42n, "Theme", 1, new Uint8Array([1, 2, 3, 4]));
    throw new Error("expected RegistryError");
  } catch (error) {
    ok(error instanceof RegistryError);
  }

  equal(mock.calls[0].name, "RegSetValueExW");
  equal(pointerValue(mock.calls[0].args[0]), 0x42n);
});
