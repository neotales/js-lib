import { deepStrictEqual as deepEqual, equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { isRegistryAvailable, Registry, RegistryError } from "@neotales/win-registry";
import { readU32, readU64, writeU32 } from "./binary.ts";

function uniqueTestKey(): string {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `HKCU\\Software\\neotales-js-test-registry-${suffix}`;
}

type Host = {
  Deno?: {
    build?: { os?: string };
    env?: { get(name: string): string | undefined };
  };
  process?: {
    env?: Record<string, string | undefined>;
    platform?: string;
  };
  tjs?: { env?: Record<string, string | undefined> };
  navigator?: { userAgentData?: { platform?: string } };
};

function host(): Host {
  return globalThis as Host;
}

function windows(): boolean {
  const current = host();
  const os = current.Deno?.build?.os ?? current.process?.platform;
  return os === "windows" || os === "win32" ||
    current.navigator?.userAgentData?.platform === "Windows";
}

function env(name: string): string | undefined {
  try {
    const current = host();
    if (current.process?.env) return current.process.env[name];
    if (current.Deno?.env) return current.Deno.env.get(name);
    if (current.tjs?.env) return current.tjs.env[name];
  } catch {
    // Deno and Ende need --allow-env to read an environment variable.
  }
  return undefined;
}

function writeRequested(): boolean {
  return env("WIN_REGISTRY_WRITE_TESTS") === "1";
}

function requireFfi(): boolean {
  return env("REQUIRE_WIN_REGISTRY_FFI") === "1";
}

type WriteMode =
  | { action: "write" }
  | { action: "skip"; reason: string }
  | { action: "fail"; reason: string };

function writeMode(input: {
  writeRequested: boolean;
  requireFfi: boolean;
  windows: boolean;
  available: boolean;
}): WriteMode {
  if (!input.windows || !input.available) {
    return input.requireFfi
      ? {
        action: "fail",
        reason:
          "REQUIRE_WIN_REGISTRY_FFI=1 but no Windows registry backend is available",
      }
      : { action: "skip", reason: "no Windows registry backend" };
  }
  if (!input.writeRequested) {
    return input.requireFfi
      ? {
        action: "fail",
        reason:
          "REQUIRE_WIN_REGISTRY_FFI=1 but WIN_REGISTRY_WRITE_TESTS is not 1",
      }
      : {
        action: "skip",
        reason:
          "set both WIN_REGISTRY_WRITE_TESTS=1 and REQUIRE_WIN_REGISTRY_FFI=1 to allow the disposable test key",
      };
  }
  if (!input.requireFfi) {
    return {
      action: "skip",
      reason:
        "WIN_REGISTRY_WRITE_TESTS=1 requires REQUIRE_WIN_REGISTRY_FFI=1; no registry write performed",
    };
  }
  return { action: "write" };
}

test("binary helpers roundtrip unsigned values", () => {
  const buf = new Uint8Array(8);
  writeU32(buf, 0xdeadbeef);
  equal(readU32(buf), 0xdeadbeef);
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, 0x1122334455667788n, true);
  equal(readU64(new Uint8Array(view.buffer)), 0x1122334455667788n);
});

test("required Windows registry backend is available", (t) => {
  if (!requireFfi()) t.skip("REQUIRE_WIN_REGISTRY_FFI is not set");
  if (!windows()) {
    throw new Error("REQUIRE_WIN_REGISTRY_FFI=1 but this host is not Windows");
  }
  equal(isRegistryAvailable(), true);
});

test("unknown roots and missing keys throw RegistryError", () => {
  expectRegistryError(() => Registry.openKey("BOGUS\\Path"));
  expectRegistryError(() =>
    Registry.openKey("HKCU\\Software\\definitely-missing-key-xyz")
  );
});

test("write authorization requires both flags before any mutation", () => {
  const base = { writeRequested: false, requireFfi: false, windows: true, available: true };
  deepEqual(writeMode(base), { action: "skip", reason: "set both WIN_REGISTRY_WRITE_TESTS=1 and REQUIRE_WIN_REGISTRY_FFI=1 to allow the disposable test key" });
  deepEqual(writeMode({ ...base, writeRequested: true }), { action: "skip", reason: "WIN_REGISTRY_WRITE_TESTS=1 requires REQUIRE_WIN_REGISTRY_FFI=1; no registry write performed" });
  deepEqual(writeMode({ ...base, requireFfi: true }), { action: "fail", reason: "REQUIRE_WIN_REGISTRY_FFI=1 but WIN_REGISTRY_WRITE_TESTS is not 1" });
  deepEqual(writeMode({ ...base, writeRequested: true, requireFfi: true, windows: false, available: false }), { action: "fail", reason: "REQUIRE_WIN_REGISTRY_FFI=1 but no Windows registry backend is available" });
  deepEqual(writeMode({ ...base, writeRequested: true, requireFfi: true, available: false }), { action: "fail", reason: "REQUIRE_WIN_REGISTRY_FFI=1 but no Windows registry backend is available" });
  deepEqual(writeMode({ ...base, writeRequested: true, requireFfi: true }), { action: "write" });
  deepEqual(writeMode({ ...base, writeRequested: true, windows: false, available: false }), { action: "skip", reason: "no Windows registry backend" });
});

test("value roundtrips incl. DWORD and QWORD (opt-in, dangerous)", (t) => {
  const mode = writeMode({
    writeRequested: writeRequested(),
    requireFfi: requireFfi(),
    windows: windows(),
    available: isRegistryAvailable(),
  });
  if (mode.action === "fail") throw new Error(mode.reason);
  if (mode.action === "skip") t.skip(mode.reason);

  const testKey = uniqueTestKey();
  const key = Registry.createKey(testKey);
  if (!key.created) {
    key.close();
    throw new Error(
      `disposable test key already existed; refusing to touch it: ${testKey}`,
    );
  }
  try {
    key.setString("Theme", "dark");
    equal(key.getString("Theme"), "dark");

    key.setInt32("Dword", 0x11223344);
    equal(key.getInt32("Dword"), 0x11223344);

    key.setInt64("Qword", 9007199254740993n);
    equal(key.getInt64("Qword"), 9007199254740993n);

    key.setMultiString("Multi", ["a", "b"]);
    equal(key.getMultiString("Multi").join(","), "a,b");

    key.setExpandString("Logs", "%USERPROFILE%\\logs");
    equal(key.getString("Logs"), "%USERPROFILE%\\logs");

    key.deleteValue("Theme");
    expectRegistryError(() => key.getString("Theme"));
  } finally {
    key.close();
    Registry.deleteKey(testKey);
  }
});

function expectRegistryError(fn: () => unknown): void {
  try {
    fn();
  } catch (error) {
    if (error instanceof RegistryError) return;
    throw error;
  }
  throw new Error("expected RegistryError");
}
