// The Playwright lanes must fail for the right reasons. A lane that cannot
// tell a passing suite from a failing one is worse than no lane, so these run
// the real launcher against fixture modules.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
const launcher = join(root, "eng/scripts/test-lane.ts");
const lanes = process.env.BROWSER_LANE ? [process.env.BROWSER_LANE] : ["firefox", "webkit"];
const selectedLane = lanes[0];
const required = process.env.REQUIRE_BROWSER_LANES === "1";

function installed(lane) {
  const code = `const pw = await import("playwright"); const fs = await import("node:fs");
if (!fs.existsSync(pw["${lane}"].executablePath())) process.exit(1);
const browser = await pw["${lane}"].launch({ headless: true, timeout: 10000 });
await browser.close();
process.exit(0);`;
  return spawnSync("bun", ["-e", code], { cwd: root, encoding: "utf8", timeout: 30000 }).status === 0;
}

const present = Object.fromEntries(lanes.map((lane) => [lane, installed(lane)]));

function requireBrowser(t, lane) {
  if (present[lane]) return true;
  if (required) {
    assert.fail(`${lane} is required by REQUIRE_BROWSER_LANES but Playwright could not launch it`);
  }
  t.skip(`${lane} is not available; run: pnpm exec playwright install ${lane}`);
  return false;
}

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "js-lib-browser-"));
  writeFileSync(join(dir, "deno.json"), JSON.stringify({ workspace: ["./std/jsr/*"] }));
  for (const name of ["test", "assert"]) {
    const moduleDir = join(dir, "std/jsr", name);
    mkdirSync(moduleDir, { recursive: true });
    writeFileSync(join(moduleDir, "deno.json"), JSON.stringify({ name: `@neotales/${name}`, exports: { ".": "./mod.ts" } }));
    writeFileSync(join(moduleDir, "mod.ts"), readFileSync(join(root, `std/jsr/${name}/mod.ts`), "utf8"));
  }
  return dir;
}

function moduleAt(dir, name, source) {
  const moduleDir = join(dir, "std/jsr", name);
  mkdirSync(moduleDir, { recursive: true });
  writeFileSync(join(moduleDir, "deno.json"), JSON.stringify({ name: `@neotales/${name}`, exports: "./mod.ts" }));
  writeFileSync(join(moduleDir, "mod.ts"), "export {};\n");
  writeFileSync(join(moduleDir, "sample.test.ts"), source);
}

function runLane(dir, lane, moduleName, env = {}, timeout = 60_000) {
  return spawnSync("bun", [launcher, lane, moduleName], {
    cwd: dir,
    encoding: "utf8",
    timeout,
    env: { ...process.env, PLAB_TEST_ROOT: dir, ...env },
  });
}

function executablePath(lane, browsersPath) {
  const code = `const pw = await import("playwright"); process.stdout.write(pw["${lane}"].executablePath());`;
  const env = browsersPath === undefined
    ? process.env
    : { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersPath };
  return spawnSync("bun", ["-e", code], { cwd: root, encoding: "utf8", env }).stdout.trim();
}

function combined(result) {
  return `${result.stdout}\n${result.stderr}`;
}

for (const lane of lanes) {
  test(`${lane} runs a suite that finishes after a top-level await`, (t) => {
    if (!requireBrowser(t, lane)) return;
    const dir = fixture();
    try {
      moduleAt(dir, "async", `import { test } from "@neotales/test";
await new Promise((resolve) => setTimeout(resolve, 25));
test("ran after an await", () => {});
`);
      const result = runLane(dir, lane, "std/async");
      assert.equal(result.status, 0, combined(result));
      assert.match(result.stdout, /pass ran after an await/);
      assert.match(result.stdout, /done 1 passed, 0 failed, 0 skipped/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test("an assertion failure fails the lane", (t) => {
  const dir = fixture();
  try {
    moduleAt(dir, "failing", `import { test } from "@neotales/test";
import { equal } from "@neotales/assert";
test("compares", () => { equal(1, 2); });
`);
    for (const lane of [selectedLane]) {
      if (!requireBrowser(t, lane)) continue;
      const result = runLane(dir, lane, "std/failing");
      assert.notEqual(result.status, 0);
      assert.match(combined(result), /reported 1 failed/);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an uncaught module error fails the lane", (t) => {
  const dir = fixture();
  try {
    moduleAt(dir, "throwing", `throw new Error("boom at import");\n`);
    for (const lane of [selectedLane]) {
      if (!requireBrowser(t, lane)) continue;
      const result = runLane(dir, lane, "std/throwing");
      assert.notEqual(result.status, 0);
      assert.match(combined(result), /fail uncaught boom at import/);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a missing browser is not a pass", () => {
  const dir = fixture();
  const browsers = mkdtempSync(join(tmpdir(), "js-lib-no-browsers-"));
  try {
    moduleAt(dir, "empty", `import { test } from "@neotales/test";\ntest("passes", () => {});\n`);
    const result = runLane(dir, "firefox", "std/empty", { PLAYWRIGHT_BROWSERS_PATH: browsers });
    assert.notEqual(result.status, 0);
    assert.match(combined(result), /not run firefox/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(browsers, { recursive: true, force: true });
  }
});

test("a failed launch stops the lane instead of hanging", (t) => {
  if (!requireBrowser(t, selectedLane)) return;
  const dir = fixture();
  const browsers = mkdtempSync(join(tmpdir(), "js-lib-broken-browser-"));
  try {
    moduleAt(dir, "empty", `import { test } from "@neotales/test";\ntest("passes", () => {});\n`);
    const executable = executablePath(selectedLane, browsers);
    assert.ok(executable, "Playwright did not report an executable path");
    // A directory where Playwright expects a file passes the existence check
    // and fails inside launch, after the lane has started its static server.
    mkdirSync(executable, { recursive: true });
    const result = runLane(dir, selectedLane, "std/empty", {
      PLAYWRIGHT_BROWSERS_PATH: browsers,
      PLAB_TEST_BROWSER_TIMEOUT: "2000",
    }, 20_000);
    assert.equal(result.error, undefined, `lane did not exit within its timeout: ${combined(result)}`);
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(combined(result), /not run (firefox|webkit)/);
    assert.match(combined(result), /suite std\/empty failed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(browsers, { recursive: true, force: true });
  }
});

test("a busy page fails on timeout", (t) => {
  if (!requireBrowser(t, selectedLane)) return;
  const dir = fixture();
  try {
    moduleAt(dir, "busy", `const until = Date.now() + 3000;
while (Date.now() < until) {}
`);
    const result = runLane(dir, selectedLane, "std/busy", { PLAB_TEST_BROWSER_TIMEOUT: "1000" }, 20_000);
    assert.equal(result.error, undefined, combined(result));
    assert.notEqual(result.status, 0);
    assert.match(combined(result), /Timeout 1000ms exceeded|timed out/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a suite that never finishes times out, fails, and keeps its output", (t) => {
  if (!requireBrowser(t, selectedLane)) return;
  const dir = fixture();
  try {
    moduleAt(dir, "slow", `import { test } from "@neotales/test";
console.log("before the hang");
await new Promise(() => {});
test("never runs", () => {});
`);
    const result = runLane(dir, selectedLane, "std/slow", { PLAB_TEST_BROWSER_TIMEOUT: "1500" }, 20_000);
    assert.equal(result.error, undefined, `lane did not exit within its timeout: ${combined(result)}`);
    assert.notEqual(result.status, 0);
    assert.match(combined(result), /before the hang/);
    assert.match(combined(result), /Timeout 1500ms exceeded|timed out/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
