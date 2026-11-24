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
import { DarwinKeychain, isDarwinKeychainAvailable, Keychain } from "./ffi.ts";
import { DARWIN } from "./types.ts";

type Host = {
  Deno?: {
    build?: { os?: string };
    version?: { deno?: string; ende?: string };
  };
  process?: { platform?: string; versions?: { node?: string } };
  Bun?: unknown;
  tjs?: unknown;
  navigator?: { platform?: string; userAgentData?: { platform?: string } };
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

test("darwin-keychain::availability reports a boolean", () => {
  equal(typeof isAvailable(), "boolean");
  equal(typeof isDarwinKeychainAvailable(), "boolean");
});

test("darwin-keychain::native entry points defer unsupported errors", (t) => {
  if (isDarwinKeychainAvailable()) t.skip("native backend is available on this host");
  expectError(() => DarwinKeychain.getSecretBytes("service", "account"));
  expectError(() => Keychain.SecKeychainFindGenericPassword("service", "account"));
});

test("darwin-keychain::unavailable root API throws on every platform", (t) => {
  if (isAvailable()) t.skip("the native Keychain backend is available");
  equal(isAvailable(), false);
  expectError(() => getSecret("service", "account"), /macOS Keychain/);
  expectError(() => getSecretString("service", "account"), /macOS Keychain/);
  expectError(() => listSecrets("service"), /macOS Keychain/);
  expectError(() => removeSecret("service", "account"), /macOS Keychain/);
  expectError(() => saveSecret("service", "account", "secret"), /macOS Keychain/);
});

test("darwin-keychain::empty service and account are rejected on every platform", () => {
  expectError(() => getSecret("", "account"), /service must not be empty/);
  expectError(() => getSecret("service", ""), /account must not be empty/);
  expectError(() => saveSecret("", "account", "secret"), /service must not be empty/);
  expectError(() => removeSecret("service", ""), /account must not be empty/);
  expectError(() => listSecrets(""), /service must not be empty/);
});

test("darwin-keychain::Deno without --allow-ffi reports Keychain as unavailable", (t) => {
  const current = host();
  if (runtime() !== "deno" || current.Deno?.build?.os !== "darwin") {
    t.skip("this check runs on Deno for macOS only");
  }
  const DenoRuntime = current.Deno as unknown as {
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
      `Keychain unexpectedly loaded without FFI permission: ${
        new TextDecoder().decode(output.stderr)
      }`,
    );
  }
});
