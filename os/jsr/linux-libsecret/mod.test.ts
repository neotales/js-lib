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
import {
  Gio,
  isGioAvailable,
  isLinuxKeyringAvailable,
  Libsecret,
  LibsecretErrorHandle,
} from "./ffi.ts";
import { GCancellableHandle, LINUX, prepareLibsecretError, setLibsecretError } from "./types.ts";

type Host = {
  Deno?: { build?: { os?: string }; version?: { deno?: string; ende?: string } };
  process?: { platform?: string; versions?: { node?: string }; env?: Record<string, string> };
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

function dangerousMutations(): boolean {
  try {
    return host().process?.env?.TEST_DANGEROUS_OS_MUTATIONS === "true";
  } catch {
    // Deno throws when env access was not granted; that is not an opt-in.
    return false;
  }
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

test("linux-libsecret::availability reports booleans", () => {
  equal(typeof isAvailable(), "boolean");
  equal(typeof isGioAvailable(), "boolean");
  equal(typeof isLinuxKeyringAvailable(), "boolean");
});

test("linux-libsecret::error output handles bind, reset, and reject another runtime", () => {
  const errorOut = new LibsecretErrorHandle();
  equal(errorOut.error(), null);
  prepareLibsecretError(errorOut, "deno");
  setLibsecretError(errorOut, new Error("native failure"));
  equal(errorOut.error()?.message, "native failure");
  prepareLibsecretError(errorOut, "deno");
  equal(errorOut.error(), null);
  expectError(() => prepareLibsecretError(errorOut, "bun"), /different runtime/);
});

test("linux-libsecret::cancellable handles have an owned native lifecycle", (t) => {
  if (!isAvailable() || !isGioAvailable()) {
    t.skip("libsecret and GIO are not available in this runtime");
  }
  const schema = Libsecret.secretSchemaNew(
    "org.freedesktop.Secret.Generic",
    0,
    "service",
    0,
    "account",
    0,
    null,
  );
  if (schema === null) throw new Error("Failed to create libsecret schema.");
  const cancellable = Gio.cancellableNew();
  equal(cancellable instanceof GCancellableHandle, true);
  try {
    Gio.cancellableCancel(cancellable);
    const errorOut = new LibsecretErrorHandle();
    const password = Libsecret.secretPasswordLookupSync(
      schema,
      cancellable,
      errorOut,
      "service",
      "test",
      "account",
      "test",
      null,
    );
    equal(password, null);
    ok(/cancel/i.test(errorOut.error()?.message ?? ""), errorOut.error()?.message);
  } finally {
    Gio.cancellableRelease(cancellable);
  }
  expectError(() => Gio.cancellableCancel(cancellable), /released/);
});

test("linux-libsecret::Gio reports unavailable optional support", (t) => {
  if (!isAvailable() || isGioAvailable()) {
    t.skip("GIO is available or native libsecret is not loaded");
  }
  expectError(() => Gio.cancellableNew(), /GIO is unavailable/);
});

test("linux-libsecret::native FFI defers unsupported errors", (t) => {
  if (isAvailable()) t.skip("the native libsecret backend is available");
  expectError(() => Libsecret.secretSchemaNew("schema", 0, "service", 0, "account", 0, null));
});

test("linux-libsecret::unavailable root API throws on every platform", (t) => {
  if (isAvailable()) t.skip("the native libsecret backend is available");
  equal(isAvailable(), false);
  expectError(() => getSecret("service", "account"), /libsecret/i);
  expectError(() => getSecretString("service", "account"), /libsecret/i);
  expectError(() => removeSecret("service", "account"), /libsecret/i);
  expectError(() => listSecrets("service"), /libsecret/i);
  expectError(() => saveSecret("service", "account", "secret"), /libsecret/i);
});

test("linux-libsecret::empty service and account are rejected on every platform", () => {
  expectError(() => getSecret("", "account"), /service must not be empty/);
  expectError(() => getSecret("service", ""), /account must not be empty/);
  expectError(() => saveSecret("", "account", "secret"), /service must not be empty/);
  expectError(() => removeSecret("service", ""), /account must not be empty/);
  expectError(() => listSecrets(""), /service must not be empty/);
});

test("linux-libsecret::invalid text is rejected before any native call", (t) => {
  expectError(() => saveSecret("service", "account", "a\0b"), /NUL/);
  expectError(() => listSecrets("service\0"), /NUL/);
  expectError(() => getSecret("service\0", "account"), /NUL/);
  if (typeof TextDecoder === "undefined") {
    t.skip("TextDecoder is unavailable; byte-secret validation cannot run");
  }
  expectError(
    () => saveSecret("service", "account", new Uint8Array([0xff])),
    /valid UTF-8/,
  );
  expectError(
    () => saveSecret("service", "account", new Uint8Array([0x41, 0x00])),
    /NUL/,
  );
});

test("linux-libsecret::Deno without --allow-ffi reports the keyring as unavailable", (t) => {
  const current = host();
  if (runtime() !== "deno" || current.Deno?.build?.os !== "linux") {
    t.skip("this check runs on Deno for Linux only");
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
      `libsecret unexpectedly loaded without FFI permission: ${
        new TextDecoder().decode(output.stderr)
      }`,
    );
  }
});

test("linux-libsecret::set/get/list/delete roundtrip (dangerous)", (t) => {
  if (!LINUX || !dangerousMutations() || !isAvailable()) {
    t.skip("destructive keyring mutations are not enabled");
  }
  const service = "neotales-js-linux-libsecret-test";
  const account = `acct-${Date.now()}`;
  try {
    saveSecret(service, account, "top-secret");
    equal(getSecretString(service, account), "top-secret");
    equal(getSecret(service, account) instanceof Uint8Array, true);
    equal(listSecrets(service).some((record) => record.account === account), true);
    equal(removeSecret(service, account), true);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error);
    if (
      message.includes("libsecret") || message.includes("org.freedesktop") ||
      message.includes("dbus") || message.includes("collection") ||
      message.includes("unknown libsecret error")
    ) {
      t.skip(error instanceof Error ? error.message : String(error));
      return;
    }
    throw error;
  }
});
