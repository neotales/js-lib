import { equal, throws } from "@neotales/assert";
import { test } from "@neotales/test";
import { isElevated, isElevatedAvailable } from "./mod.ts";

type Host = {
  Deno?: { build?: { os?: string }; euid?: () => number; uid?: () => number };
  process?: {
    platform?: string;
    env?: Record<string, string | undefined>;
    geteuid?: () => number;
    getuid?: () => number;
  };
};

function host(): Host {
  return globalThis as Host;
}

function windows(): boolean {
  const os = host().Deno?.build?.os ?? host().process?.platform;
  return os === "windows" || os === "win32";
}

function uid(): number | undefined {
  const current = host();
  if (current.process?.geteuid) return current.process.geteuid();
  if (current.process?.getuid) return current.process.getuid();
  if (current.Deno?.euid) return current.Deno.euid();
  if (current.Deno?.uid) return current.Deno.uid();
  return undefined;
}

// A CI lane that asked for FFI must not pass by skipping. Unix still answers
// with uid, so the requirement only applies to the Windows host.
function ffiRequired(): boolean {
  const env = host().process?.env;
  return env?.REQUIRE_NODE_FFI === "1" || env?.REQUIRE_KOFFI === "1";
}

if (windows()) {
  test.skip("isElevated matches effective uid semantics on Unix-like systems", "windows");
} else {
  test("isElevated matches effective uid semantics on Unix-like systems", (t) => {
    const id = uid();
    if (id === undefined) t.skip("no uid");
    equal(isElevated(false), id === 0);
  });
}

test("isElevated returns a boolean", (t) => {
  if (!isElevatedAvailable()) {
    if (windows() && ffiRequired()) {
      equal(isElevatedAvailable(), true);
      return;
    }
    t.skip("elevation is not available");
  }
  equal(typeof isElevated(), "boolean");
});

test("isElevatedAvailable is false without a host", (t) => {
  if ("process" in globalThis || "Deno" in globalThis || "Bun" in globalThis || "tjs" in globalThis) {
    t.skip("this host can answer");
  }
  equal(isElevatedAvailable(), false);
});

test("isElevatedAvailable returns a boolean", () => {
  equal(typeof isElevatedAvailable(), "boolean");
});

if (!windows() || isElevatedAvailable()) {
  test.skip("isElevated explains unavailable Windows FFI", "not an unavailable windows runtime");
} else {
  test("isElevated explains unavailable Windows FFI", () => {
    throws(() => isElevated());
  });
}
