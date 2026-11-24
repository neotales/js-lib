import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  getSecret,
  getSecretString,
  isAvailable,
  listSecrets,
  removeSecret,
  saveSecret,
} from "./mod.ts";
import { isWinCredAvailable, WinCred } from "./ffi.ts";
import { CredEnumerateFlags, CredType } from "./types.ts";

type Host = {
  Deno?: { build?: { os?: string }; version?: { deno?: string; ende?: string } };
  process?: { platform?: string; versions?: { node?: string } };
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

function expectError(fn: () => unknown, pattern?: RegExp): void {
  try {
    fn();
  } catch (error) {
    ok(error instanceof Error);
    if (pattern) ok(pattern.test(error.message), error.message);
    return;
  }
  throw new Error("expected an error");
}

test("win-cred::availability reports a boolean", () => {
  equal(typeof isAvailable(), "boolean");
  equal(typeof isWinCredAvailable(), "boolean");
});

test("win-cred::native entry point defers unsupported errors", (t) => {
  if (isWinCredAvailable()) t.skip("native backend is available on this host");
  expectError(() => WinCred.enumerate(null, 0), /Windows Credential API is only available on Windows/);
});

test("win-cred::native backend reads a missing target without touching a secret", (t) => {
  if (!windows()) t.skip("this host is not Windows");
  if (!isWinCredAvailable()) t.skip("the native Windows backend is not available");
  const missing = `neotales-js-missing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  equal(WinCred.read(missing, CredType.GENERIC), null);
  equal(WinCred.enumerate(`${missing}*`, CredEnumerateFlags.NONE), []);
});

test("win-cred::unavailable root API throws on every platform", (t) => {
  if (isAvailable()) t.skip("the native Credential Manager backend is available");
  equal(isAvailable(), false);
  expectError(() => getSecret("service", "account"), /Windows Credential/);
  expectError(() => getSecretString("service", "account"), /Windows Credential/);
  expectError(() => removeSecret("service", "account"), /Windows Credential/);
  expectError(() => listSecrets("service"), /Windows Credential/);
  expectError(() => saveSecret("service", "account", "secret"), /Windows Credential/);
});

test("win-cred::empty service and account are rejected on every platform", () => {
  expectError(() => getSecret("", "account"), /service must not be empty/);
  expectError(() => getSecret("service", ""), /account must not be empty/);
  expectError(() => saveSecret("", "account", "secret"), /service must not be empty/);
  expectError(() => removeSecret("service", ""), /account must not be empty/);
  expectError(() => listSecrets(""), /service must not be empty/);
});

test("win-cred::Deno without --allow-ffi reports Credential Manager as unavailable", (t) => {
  const current = host();
  if (runtime() !== "deno" || !windows()) {
    t.skip("this check runs on Deno for Windows only");
  }
  const DenoRuntime = current.Deno as unknown as {
    build: { os: string };
    Command: new (
      command: string,
      options: { args: string[] },
    ) => { outputSync(): { success: boolean; stderr: Uint8Array } };
    execPath(): string;
    permissions?: {
      querySync(descriptor: { name: string }): { state: string };
    };
  };
  const module = new URL("./mod.ts", import.meta.url).href;
  const ffiState = DenoRuntime.permissions?.querySync?.({ name: "ffi" })?.state;
  if (ffiState === "granted") {
    t.skip("this Deno grants FFI without --allow-ffi, so the denial check cannot run");
  }
  const script =
    `import { isAvailable } from ${JSON.stringify(module)}; if (isAvailable()) Deno.exit(1);`;
  {
    const output = new DenoRuntime.Command(DenoRuntime.execPath(), {
      args: ["eval", "--allow-read", script],
    }).outputSync();
    ok(
      output.success,
      `Credential Manager unexpectedly loaded without FFI permission: ${
        new TextDecoder().decode(output.stderr)
      }`,
    );
  }
});
