import { test, testAsync } from "@neotales/test";
import { deepEqual, ok, strictEqual, throws } from "@neotales/assert";
import { args } from "./args.ts";
import { cwd } from "./cwd.ts";
import { pid } from "./pid.ts";
import { ppid } from "./ppid.ts";
import { ChangeDirectoryError, chdir } from "./chdir.ts";
import { exit } from "./exit.ts";
import { execPath } from "./exec_path.ts";
import { popd } from "./popd.ts";
import { pushd } from "./pushd.ts";
import { stdin, stdout, stderr } from "./streams.ts";
import { globals } from "./_globals.ts";
import { history } from "./history.ts";
import { createNodeStdinReader } from "./internal/node_stdin.ts";
import * as publicApi from "./mod.ts";

test("runtime metadata has safe values and stable types", () => {
  ok(Array.isArray(args));
  ok(Number.isInteger(pid) && pid >= 0);
  ok(Number.isInteger(ppid) && ppid >= 0);
  strictEqual(pid, globals.Deno?.pid ?? globals.process?.pid ?? globals.tjs?.pid ?? globals.os?.getpid() ?? 0);
  strictEqual(ppid, globals.Deno?.ppid ?? globals.process?.ppid ?? globals.tjs?.ppid ?? 0);
  strictEqual(execPath(), globals.Deno?.execPath() ?? globals.process?.execPath ?? globals.tjs?.exePath ?? (globals.os ? globals.os.exePath() : "") ?? "");
  if (Array.isArray(globals.scriptArgs) && !globals.Deno && !globals.process) {
    deepEqual(args, globals.scriptArgs.slice(1));
  }
  ok(typeof execPath() === "string");
});

test("argument metadata is an array of strings", () => {
  ok(Array.isArray(args));
  for (const argument of args) ok(typeof argument === "string");
  if (
    Array.isArray(globals.scriptArgs) &&
    globals.scriptArgs.includes("neotales-qjs-arg-one")
  ) {
    deepEqual(args, ["neotales-qjs-arg-one", "neotales-qjs-arg-two"]);
  }
  if (globals.tjs?.args.includes("neotales-tjs-arg-one")) {
    deepEqual(args, ["neotales-tjs-arg-one", "neotales-tjs-arg-two"]);
  }
});

test("module exports all documented public APIs", () => {
  for (const name of [
    "args",
    "chdir",
    "cwd",
    "execPath",
    "exit",
    "pid",
    "ppid",
    "popd",
    "pushd",
    "stdin",
    "stdout",
    "stderr",
  ]) {
    ok(name in publicApi, `missing public export: ${name}`);
  }
});

test("cwd reports host directory or explicit unsupported error", () => {
  if (globals.window && !globals.Deno && !globals.process) {
    ok(typeof cwd() === "string");
    return;
  }
  if (!globals.Deno && !globals.process && !globals.tjs && !globals.os) {
    throws(() => cwd());
    throws(() => chdir("."));
    return;
  }
  ok(typeof cwd() === "string");
});

test("chdir maps invalid directory errors and preserves current directory", () => {
  if (globals.Deno) {
    // The Deno test lane intentionally omits read/write permissions required by chdir.
    throws(() => chdir("."));
    return;
  }
  if (globals.window && !globals.Deno && !globals.process) {
    chdir("ignored-browser-directory");
    return;
  }
  if (!globals.Deno && !globals.process && !globals.tjs && !globals.os) {
    throws(() => chdir("."));
    return;
  }
  const initial = cwd();
  chdir(".");
  strictEqual(cwd(), initial);
  throws(() => chdir("/a/path/that/does/not/exist/process-test"));
});

test("ChangeDirectoryError preserves its type, name, and cause", () => {
  const cause = new Error("host failure");
  const error = new ChangeDirectoryError("directory change failed", { cause });
  strictEqual(error.name, "ChangeDirectoryError");
  strictEqual(error.cause, cause);
});

test("pushd/popd retain a restoration point and empty-stack behavior", () => {
  if (globals.Deno) {
    const originalLength = history.length;
    throws(() => pushd("."));
    strictEqual(history.length, originalLength);
    return;
  }
  if (!globals.Deno && !globals.process && !globals.tjs && !globals.os && !globals.window) {
    const originalLength = history.length;
    throws(() => pushd("."));
    strictEqual(history.length, originalLength);
    strictEqual(popd(), undefined);
    return;
  }
  if (globals.window && !globals.Deno && !globals.process) {
    pushd(".");
    strictEqual(popd(), undefined);
    return;
  }
  const initial = cwd();
  pushd(".");
  strictEqual(history[history.length - 1], initial);
  strictEqual(popd(), initial);
  strictEqual(popd(), initial);
  strictEqual(cwd(), initial);
});

test("streams expose the expected stream methods", () => {
  ok(typeof stdin.read === "function");
  ok(typeof stdin.readSync === "function");
  ok(typeof stdin.isTerm === "function");
  ok(typeof stdin.close === "function");
  ok(typeof stdout.write === "function");
  ok(typeof stdout.writeSync === "function");
  ok(typeof stdout.isTerm === "function");
  ok(typeof stdout.close === "function");
  ok(typeof stderr.write === "function");
  ok(typeof stderr.writeSync === "function");
  ok(typeof stderr.isTerm === "function");
  ok(typeof stderr.close === "function");
  ok(typeof stdin.isTerm() === "boolean");
  ok(typeof stdout.isTerm() === "boolean");
  ok(typeof stderr.isTerm() === "boolean");
  ok(stdout.writeSync(new Uint8Array(0)) >= 0);
  ok(stdin.readSync(new Uint8Array(0)) === null || stdin.readSync(new Uint8Array(0)) === 0);
});

function nodeStdinWithAsyncError(error: Error) {
  return createNodeStdinReader(
    0,
    (_fd, _buffer, _offset, _length, _position, callback) => callback(error, 0),
    () => {
      throw error;
    },
    () => false,
  );
}

testAsync("public Node stdin.read maps EAGAIN and EOF to null", async () => {
  const again = nodeStdinWithAsyncError(Object.assign(new Error("again"), { code: "EAGAIN" }));
  const eof = nodeStdinWithAsyncError(Object.assign(new Error("end"), { code: "EOF" }));
  strictEqual(await again.read(new Uint8Array(8)), null);
  strictEqual(await eof.read(new Uint8Array(8)), null);
});

testAsync("public Node stdin.read rejects unrelated errors unchanged", async () => {
  const failure = Object.assign(new Error("permission denied"), { code: "EACCES" });
  const reader = nodeStdinWithAsyncError(failure);
  let caught: unknown;
  try {
    await reader.read(new Uint8Array(8));
  } catch (error) {
    caught = error;
  }
  strictEqual(caught, failure);
});

test("public Node stdin.readSync maps EAGAIN/EOF and preserves other errors", () => {
  for (const code of ["EAGAIN", "EOF"]) {
    const reader = createNodeStdinReader(
      0,
      () => {},
      () => {
        throw Object.assign(new Error(code), { code });
      },
      () => false,
    );
    strictEqual(reader.readSync(new Uint8Array(8)), null);
  }

  const failure = Object.assign(new Error("permission denied"), { code: "EACCES" });
  const reader = createNodeStdinReader(0, () => {}, () => {
    throw failure;
  }, () => false);
  let caught: unknown;
  try {
    reader.readSync(new Uint8Array(8));
  } catch (error) {
    caught = error;
  }
  strictEqual(caught, failure);
});

testAsync("portable stream writers resolve with the byte count", async () => {
  strictEqual(await stdout.write(new Uint8Array(0)), 0);
  strictEqual(await stderr.write(new Uint8Array(0)), 0);
});

test("exit throws instead of pretending to exit unsupported hosts", () => {
  if (globals.Deno || globals.process || globals.tjs || globals.std) return;
  throws(() => exit());
});
