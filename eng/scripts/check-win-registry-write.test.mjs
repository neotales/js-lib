import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  REQUIRED_ENV,
  REQUIRED_PASS,
  requireEnv,
  requireMarkers,
} from "./check-win-registry-write.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const wrapper = join(root, "eng/scripts/check-win-registry-write.mjs");
const launcher = join(root, "eng/scripts/test-lane.ts");
const bun = "bun";

function withoutRequiredEnv() {
  const env = { ...process.env };
  for (const name of REQUIRED_ENV) delete env[name];
  return env;
}

function withRequiredEnv() {
  return {
    ...withoutRequiredEnv(),
    WIN_REGISTRY_WRITE_TESTS: "1",
    REQUIRE_WIN_REGISTRY_FFI: "1",
  };
}

test("requireEnv requires both opt-in variables", () => {
  assert.throws(() => requireEnv({}), /WIN_REGISTRY_WRITE_TESTS/);
  assert.throws(
    () => requireEnv({ WIN_REGISTRY_WRITE_TESTS: "1" }),
    /REQUIRE_WIN_REGISTRY_FFI/,
  );
  requireEnv({
    WIN_REGISTRY_WRITE_TESTS: "1",
    REQUIRE_WIN_REGISTRY_FFI: "1",
  });
});

test("requireMarkers accepts exact pass lines and rejects skips/missing lines", () => {
  const pass = REQUIRED_PASS.map((name) => `pass ${name}`).join("\n");
  requireMarkers(pass);
  assert.throws(
    () => requireMarkers(pass.replace(/^pass /m, "skip ")),
    /skipped/,
  );
  assert.throws(() => requireMarkers("done 0 passed, 0 failed, 0 skipped"), /did not pass/);
  assert.throws(() => requireMarkers("not run txiki: tjs is not on PATH"), /not run/);
});

test("wrapper rejects a missing environment before spawning", () => {
  const result = spawnSync(bun, [wrapper], {
    cwd: root,
    encoding: "utf8",
    env: withoutRequiredEnv(),
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required environment/);
});

test("wrapper rejects Node instead of Bun", () => {
  const result = spawnSync(process.execPath, [wrapper], {
    cwd: root,
    encoding: "utf8",
    env: withRequiredEnv(),
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /run this wrapper under Bun/);
});

test("wrapper rejects a non-Windows host", { skip: process.platform === "win32" }, () => {
  const result = spawnSync(bun, [wrapper], {
    cwd: root,
    encoding: "utf8",
    env: withRequiredEnv(),
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires Windows/);
});

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "js-lib-win-registry-"));
  writeFileSync(join(dir, "deno.json"), JSON.stringify({ workspace: ["./std/jsr/*"] }));
  mkdirSync(join(dir, "std/jsr/test"), { recursive: true });
  writeFileSync(
    join(dir, "std/jsr/test/mod.ts"),
    readFileSync(join(root, "std/jsr/test/mod.ts"), "utf8"),
  );
  writeFileSync(
    join(dir, "std/jsr/test/deno.json"),
    JSON.stringify({ name: "@neotales/test", exports: { ".": "./mod.ts" } }),
  );
  const moduleDir = join(dir, "std/jsr/probe");
  mkdirSync(moduleDir, { recursive: true });
  writeFileSync(
    join(moduleDir, "deno.json"),
    JSON.stringify({ name: "@neotales/probe", exports: "./mod.ts" }),
  );
  writeFileSync(join(moduleDir, "mod.ts"), "export {};\n");
  return { dir, moduleDir };
}

function runFixture(dir) {
  return spawnSync(bun, [launcher, "bun", "std/probe"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, PLAB_TEST_ROOT: dir },
  });
}

test("marker formatting matches the real runner output", () => {
  const { dir, moduleDir } = fixture();
  try {
    writeFileSync(
      join(moduleDir, "probe.test.ts"),
      [
        'import { test } from "@neotales/test";',
        ...REQUIRED_PASS.map((name) => `test(${JSON.stringify(name)}, () => {});`),
        "",
      ].join("\n"),
    );
    const passed = runFixture(dir);
    assert.equal(passed.status, 0, passed.stdout + passed.stderr);
    requireMarkers(passed.stdout);

    writeFileSync(
      join(moduleDir, "probe.test.ts"),
      [
        'import { test } from "@neotales/test";',
        ...REQUIRED_PASS.map(
          (name) => `test.skip(${JSON.stringify(name)}, "fixture skip");`,
        ),
        "",
      ].join("\n"),
    );
    const skipped = runFixture(dir);
    assert.equal(skipped.status, 0, skipped.stdout + skipped.stderr);
    assert.throws(() => requireMarkers(skipped.stdout), /skipped/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
