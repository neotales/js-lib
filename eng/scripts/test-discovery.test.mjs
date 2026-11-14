import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
const bun = "bun";
const launcher = join(root, "eng/scripts/test-lane.ts");
const generated = join(root, ".build/bun/test/std/chars/main.ts");

function run(...args) {
  return spawnSync(bun, [launcher, ...args], { cwd: root, encoding: "utf8" });
}

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "js-lib-tests-"));
  writeFileSync(join(dir, "deno.json"), JSON.stringify({ workspace: ["./std/jsr/*"] }));
  mkdirSync(join(dir, "std/jsr/test"), { recursive: true });
  writeFileSync(join(dir, "std/jsr/test/mod.ts"), readFileSync(join(root, "std/jsr/test/mod.ts"), "utf8"));
  writeFileSync(join(dir, "std/jsr/test/deno.json"), JSON.stringify({ name: "@neotales/test", exports: { ".": "./mod.ts" } }));
  mkdirSync(join(dir, "test"));
  writeFileSync(join(dir, "test/run.ts"), readFileSync(join(root, "std/jsr/test/mod.ts"), "utf8"));
  return dir;
}

function moduleAt(dir, name, testSource) {
  const moduleDir = join(dir, "std/jsr", name);
  mkdirSync(moduleDir, { recursive: true });
  writeFileSync(join(moduleDir, "deno.json"), JSON.stringify({ name: `@neotales/${name}`, exports: "./mod.ts" }));
  writeFileSync(join(moduleDir, "mod.ts"), "export {};\n");
  if (testSource !== undefined) writeFileSync(join(moduleDir, "sample.test.ts"), testSource);
}

function runFixture(dir, ...args) {
  return spawnSync(bun, [launcher, ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PLAB_TEST_ROOT: dir },
  });
}

// A workspace module that reaches Node's createRequire. The browser bundle
// target replaces node:module with an empty stub, so this fixture fails when
// the Node lane is bundled as a browser graph. That is how both Node FFI
// backends of is-elevated disappeared on Windows.
function createRequireFixture() {
  const dir = fixture();
  moduleAt(dir, "probe");
  writeFileSync(
    join(dir, "std/jsr/probe/mod.ts"),
    [
      'import { createRequire } from "node:module";',
      "const require = createRequire(import.meta.url);",
      'const builtin = require("node:module");',
      'export const kinds = [typeof createRequire, typeof require, typeof builtin.createRequire].join(",");',
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(dir, "std/jsr/probe/probe.test.ts"),
    [
      'import { test } from "@neotales/test";',
      'import { kinds } from "./mod.ts";',
      'test("createRequire survives the Node bundle", () => {',
      '  if (kinds !== "function,function,function") throw new Error("createRequire was stubbed: " + kinds);',
      "});",
      "",
    ].join("\n"),
  );
  return dir;
}

test("discovery generates deterministic isolated module entrypoints", () => {
  const first = run("bun", "std/chars");
  assert.equal(first.status, 0, first.stderr);
  const source = readFileSync(generated, "utf8");
  const imports = source.split("\n").filter((line) => line.startsWith("import "));
  assert.deepEqual(imports, [...imports].sort((a, b) => a.localeCompare(b, "en")));
  assert.ok(source.includes('from "@neotales/test"'));
  assert.ok(imports.length > 1);
  const second = run("bun", "std/chars");
  assert.equal(second.status, 0, second.stderr);
  assert.equal(readFileSync(generated, "utf8"), source);
});

test("selection rejects unknown modules and modules without tests", () => {
  const unknown = run("bun", "std/not-a-module");
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /unknown module selection/);
  const dir = fixture();
  try {
    moduleAt(dir, "empty", undefined);
    const noTests = runFixture(dir, "bun", "std/empty");
    assert.notEqual(noTests.status, 0);
    assert.match(noTests.stderr, /no tests found for std\/empty/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("failures aggregate while later suites still execute", () => {
  const dir = fixture();
  try {
    moduleAt(dir, "alpha", 'import { test } from "@neotales/test"; test("fails", () => { throw new Error("expected fixture failure"); });\n');
    moduleAt(dir, "beta", 'import { test } from "@neotales/test"; console.log("LATER_SUITE_EXECUTED"); test("also fails", () => { throw new Error("second fixture failure"); });\n');
    const result = runFixture(dir, "bun");
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /LATER_SUITE_EXECUTED/);
    assert.match(result.stderr, /2 suite\(s\) failed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("empty workspace fails instead of silently succeeding", () => {
  const dir = mkdtempSync(join(tmpdir(), "js-lib-tests-"));
  try {
    writeFileSync(join(dir, "deno.json"), JSON.stringify({ workspace: [] }));
    const result = runFixture(dir, "bun");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no workspace modules discovered/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("node lane bundles a workspace graph for Node so createRequire survives", () => {
  const dir = createRequireFixture();
  try {
    const result = runFixture(dir, "node", "std/probe");
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /pass createRequire survives the Node bundle/);
    const bundle = readFileSync(join(dir, ".build/node/bundles/std_probe_main.ts.js"), "utf8");
    assert.match(bundle, /from "node:module"/);
    assert.doesNotMatch(bundle, /\{[^}]*createRequire[^}]*\}\s*=\s*\(\(\)\s*=>\s*\(\{\}\)\)/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Direct control, not launcher coverage: generated entries always import
// @neotales/test, so the launcher's `bun build` branch is unreachable (see the
// comment on that branch in test-lane.ts). This builds a graph with no
// workspace specifier using the same flags. Target node keeps createRequire
// callable; the browser target stubs it and the same entry fails under Node, so
// the control makes the regression above load-bearing.
test("node target keeps createRequire callable where the browser target stubs it", () => {
  const dir = mkdtempSync(join(tmpdir(), "js-lib-bundle-"));
  try {
    const entry = join(dir, "entry.js");
    writeFileSync(
      entry,
      [
        'import { createRequire } from "node:module";',
        'if (typeof createRequire !== "function") throw new Error("createRequire was stubbed");',
        "const require = createRequire(import.meta.url);",
        'require("node:module");',
        "",
      ].join("\n"),
    );
    for (const target of ["node", "browser"]) {
      const out = join(dir, `${target}.js`);
      const built = spawnSync(
        bun,
        ["build", entry, "--outfile", out, "--format", "esm", "--target", target],
        { cwd: dir, encoding: "utf8" },
      );
      assert.equal(built.status, 0, built.stderr);
      const ran = spawnSync(process.execPath, [out], { encoding: "utf8" });
      if (target === "node") {
        assert.equal(ran.status, 0, ran.stderr);
      } else {
        assert.notEqual(ran.status, 0, "the browser target unexpectedly kept node:module");
        assert.match(ran.stderr, /createRequire was stubbed/);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
