import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import * as env from "./core.ts";
import { globals, WINDOWS } from "./globals.ts";

const nope = (value: unknown, message?: string) => ok(!value, message);

// The imported tests used Node's matcher forms. The satellite assert exposes
// only a message, so this keeps the original call shape locally.
function expectThrows(fn: () => unknown, matcher?: string | RegExp | (new (...args: never[]) => Error)): void {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (matcher instanceof RegExp) ok(matcher.test(message), `expected ${matcher}, got ${message}`);
    else if (typeof matcher === "string") ok(message.includes(matcher), `expected "${matcher}", got ${message}`);
    else if (typeof matcher === "function") ok(error instanceof matcher, `expected ${matcher.name}, got ${message}`);
    return;
  }
  throw new Error("expected an error");
}

function canRunCommands(): boolean {
  const globals = globalThis as {
    Deno?: { Command?: unknown };
    Bun?: { spawnSync?: unknown };
    process?: { getBuiltinModule?: unknown };
    WebSocketPair?: unknown;
  };
  // workerd exposes a node:child_process shim whose spawnSync throws.
  if (typeof globals.WebSocketPair === "function") return false;
  if (globals.Deno) return typeof globals.Deno.Command === "function";
  if (globals.Bun) return typeof globals.Bun.spawnSync === "function";
  return typeof globals.process?.getBuiltinModule === "function";
}

function testCommand(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!canRunCommands()) t.skip("this runtime exposes no synchronous command execution");
    fn();
  });
}

test("env::get", () => {
  env.set("DENO_TEST_1", "value");
  equal(env.get("DENO_TEST_1"), "value");
});

test("env::expand", () => {
  env.set("NAME", "Alice");
  equal(
    env.expand("Hello, ${NAME}! You are ${AGE:-30} years old."),
    "Hello, Alice! You are 30 years old.",
  );
  equal(env.expand("HELLO, %NAME%!", { windowsExpansion: true }), "HELLO, Alice!");

  env.expand("${AGE_NEXT:=30}");
  equal(env.get("AGE_NEXT"), "30");

  expectThrows(() => {
    env.expand("${AGE_NEXT2:?Missing environment variable AGE_NEXT2}");
  }, /Missing environment variable AGE_NEXT2/);
});

test("env::has", () => {
  env.set("DENO_TEST_2", "value");
  ok(env.has("DENO_TEST_2"));
  nope(env.has("NOT_SET"));
});

test("env::remove", () => {
  env.set("DENO_TEST_2_1", "value");
  ok(env.has("DENO_TEST_2_1"));
  env.remove("DENO_TEST_2_1");
  nope(env.has("DENO_TEST_2_1"));
});

test("env::merge", () => {
  env.set("DENO_TEST_3", "value");
  env.merge({ DENO_TEST_4: "value", DENO_TEST_3: undefined });
  nope(env.has("DENO_TEST_3"));
  ok(env.has("DENO_TEST_4"));
});

test("env::union", () => {
  env.union({ DENO_TEST_32: "value", DENO_TEST_33: undefined });
  ok(env.proxy["DENO_TEST_32"] === "value");
  ok(env.proxy["DENO_TEST_33"] === undefined);
});

test("env::toObject", () => {
  env.set("DENO_TEST_6", "value");
  const obj = env.toObject();
  ok(obj.DENO_TEST_6 === "value");
});

test("env::set", () => {
  env.set("DENO_TEST_7", "value");
  ok(env.has("DENO_TEST_7"));
});

test("env::appendPath", () => {
  env.appendPath("/deno_test_append");
  ok(env.hasPath("/deno_test_append"));
  const paths = env.splitPath();
  equal(paths[paths.length - 1], "/deno_test_append");
  env.removePath("/deno_test_append");
  nope(env.hasPath("/deno_test_append"));
});

test("env::prependPath", () => {
  env.prependPath("/deno_test_prepend");
  ok(env.hasPath("/deno_test_prepend"));
  const paths = env.splitPath();
  equal(paths[0], "/deno_test_prepend");
  env.removePath("/deno_test_prepend");
  nope(env.hasPath("/deno_test_prepend"));
});

test("env::removePath", () => {
  env.appendPath("/deno_test_remove");
  ok(env.hasPath("/deno_test_remove"));
  env.removePath("/deno_test_remove");
  nope(env.hasPath("/deno_test_remove"));
});

test("env::replacePath", () => {
  env.appendPath("/test_replace");
  ok(env.hasPath("/test_replace"));
  env.replacePath("/test_replace", "/test2");
  nope(env.hasPath("/test_replace"));
  ok(env.hasPath("/test2"));
  env.removePath("/test2");
});

test("env::splitPath", () => {
  env.appendPath("/deno_test12");
  const paths = env.splitPath();
  ok(paths.length > 0);
  ok(paths.some((p) => p === "/deno_test12"));
});

test("env::hasPath", () => {
  env.appendPath("/deno_test14");
  ok(env.hasPath("/deno_test14"));
  nope(env.hasPath("/deno_test15"));
});

test("env::getPath", () => {
  env.appendPath("/deno_test16");
  ok(env.getPath().includes("/deno_test16"));
});

test("env::path aliases getPath", () => {
  const current = env.getPath();
  try {
    env.setPath("/neotales-env-path");
    equal(env.path(), env.getPath());
  } finally {
    env.setPath(current);
  }
});

test("env::proxy supports property reads, writes, and enumeration", () => {
  env.proxy.NEOTALES_ENV_PROXY = "value";
  equal(env.get("NEOTALES_ENV_PROXY"), "value");
  ok("NEOTALES_ENV_PROXY" in env.proxy);
  equal({ ...env.proxy }.NEOTALES_ENV_PROXY, "value");
  delete env.proxy.NEOTALES_ENV_PROXY;
});

test("env::setPath", () => {
  const p = env.getPath();
  try {
    env.appendPath("/deno_test17");

    env.setPath("/deno_test18");
    equal(env.getPath(), "/deno_test18");
  } finally {
    env.setPath(p);
  }
});

test("env::env.joinPath", () => {
  const paths = ["/deno_test20", "/deno_test21"];
  const joined = env.joinPath(paths);
  ok(joined.includes("/deno_test20"));
  ok(joined.includes("/deno_test21"));
});

testCommand("env::expand with command substitution", () => {
  const tpl = `The value is: $(echo "test")`;
  const result = env.expand(tpl, { commands: { enabled: true, shell: true } });
  equal(result, "The value is: test");
});
