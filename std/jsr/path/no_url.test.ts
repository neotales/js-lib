import { equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { join } from "./join.ts";
import { join as posixJoin } from "./posix/join.ts";
import { join as windowsJoin } from "./windows/join.ts";

// Mirror the path module's host detection without importing its isWindows
// constant: a mutation that makes the module select the wrong join must not
// change the test's expectation too. Node and Bun use process, Deno uses
// build.os, and browsers plus txiki.js use navigator.platform.
const runtime = globalThis as {
  Deno?: { build?: { os?: string } };
  navigator?: { platform?: string };
  process?: { platform?: string };
};

function hostPlatform(): "windows" | "posix" | "unknown" {
  if (
    runtime.process?.platform?.startsWith("win") ||
    runtime.Deno?.build?.os === "windows" ||
    runtime.navigator?.platform?.startsWith("Win")
  ) {
    return "windows";
  }
  if (
    runtime.process?.platform !== undefined ||
    runtime.Deno?.build?.os !== undefined ||
    runtime.navigator?.platform !== undefined
  ) {
    return "posix";
  }
  return "unknown";
}

test("path::string operations do not require a URL global", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "URL");
  try {
    ok(Reflect.deleteProperty(globalThis, "URL"));
    const platform = hostPlatform();
    const joined = join("a", "b");
    if (platform === "windows") {
      equal(joined, "a\\b");
    } else if (platform === "posix") {
      equal(joined, "a/b");
    } else {
      // No runtime reports a platform. Keep the separator-agnostic check,
      // and cover both concrete joins below.
      ok(/^a[\\/]b$/.test(joined), `unexpected platform join: ${joined}`);
    }
    // Exercise both separator implementations even when the host is known.
    equal(posixJoin("a", "b"), "a/b");
    equal(windowsJoin("a", "b"), "a\\b");
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "URL", descriptor);
  }
});
