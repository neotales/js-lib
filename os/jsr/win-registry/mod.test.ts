import { equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { isRegistryAvailable, Registry, RegistryError } from "@neotales/win-registry";
import { stringToWide, wideToString } from "./types.ts";

type Host = {
  Deno?: {
    build?: { os?: string };
    version?: { deno?: string; ende?: string };
  };
  process?: {
    platform?: string;
    versions?: { node?: string };
  };
  Bun?: unknown;
  tjs?: unknown;
  navigator?: { userAgentData?: { platform?: string } };
};

function host(): Host {
  return globalThis as Host;
}

function runtime(): "deno" | "ende" | "bun" | "tjs" | "node" | null {
  const current = host();
  if (current.Deno) return current.Deno.version?.ende ? "ende" : "deno";
  if (current.Bun) return "bun";
  if (current.tjs) return "tjs";
  if (current.process?.versions?.node) return "node";
  return null;
}

function windows(): boolean {
  const current = host();
  const os = current.Deno?.build?.os ?? current.process?.platform;
  return os === "windows" || os === "win32" ||
    current.navigator?.userAgentData?.platform === "Windows";
}

function expectRegistryError(fn: () => unknown): void {
  try {
    fn();
  } catch (error) {
    if (error instanceof RegistryError) return;
    throw error;
  }
  throw new Error("expected RegistryError");
}

test("registry string conversion roundtrips", (t) => {
  if (typeof TextEncoder === "undefined" || typeof TextDecoder === "undefined") {
    t.skip("TextEncoder and TextDecoder are not available");
  }
  equal(wideToString(stringToWide("registry")), "registry");
});

test("registry is unavailable outside Windows", (t) => {
  if (windows()) t.skip("this host runs on Windows");
  equal(isRegistryAvailable(), false);
  expectRegistryError(() => Registry.openKey("HKCU\\Software"));
});

test("registry availability matches a supported Windows FFI host", (t) => {
  if (!windows()) t.skip("not Windows");
  const current = runtime();
  // Ende, QuickJS-ng, workerd, ClearScript, and browsers have no registry
  // backend in this package. Node's FFI backend needs node:ffi.
  if (current === null || current === "ende") t.skip("no registry backend for this runtime");
  equal(isRegistryAvailable(), true);
});

test("registry reads Windows version values", (t) => {
  if (!windows() || !isRegistryAvailable()) t.skip("no Windows registry backend");
  const key = Registry.openKey(
    "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
  );
  try {
    ok(key.getString("ProductName"));
  } finally {
    key.close();
  }
});
