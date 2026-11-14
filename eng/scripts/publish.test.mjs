import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  areasForTag,
  assertJsrPackageMeta,
  buildPlan,
  checkVersionPairs,
  denoPublishWasSkipped,
  distTag,
  executePlan,
  jsrPackageMeta,
  sameNpmArtifact,
  topoSort,
  versionInJsrMeta,
} from "./publish.mjs";
import { checkReleaseRef } from "./check-release-ref.mjs";

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("distTag maps only alpha, beta, and rc prereleases", () => {
  assert.equal(distTag("0.1.0"), "latest");
  assert.equal(distTag("0.1.0+build.7"), "latest");
  assert.equal(distTag("0.1.0-alpha.0"), "alpha");
  assert.equal(distTag("0.1.0-alpha.0+build.1"), "alpha");
  assert.equal(distTag("0.1.0-beta.2"), "beta");
  assert.equal(distTag("0.1.0-rc.1"), "rc");
});

test("distTag rejects every other prerelease instead of defaulting to latest", () => {
  for (const version of [
    "0.1.0-alpha",
    "0.1.0-alpha.0.1.0",
    "0.1.0-next.1",
    "0.1.0-preview.1",
    "0.1.0-rc",
    "0.1.0-ALPHA.0",
    "0.1",
  ]) {
    assert.throws(
      () => distTag(version),
      /unrecognized prerelease|not a SemVer/,
      version,
    );
  }
});

test("areasForTag preserves js/v* as std and adds os/v*", () => {
  assert.deepEqual(areasForTag("std/v2026.11.14-r.1"), ["std"]);
  assert.deepEqual(areasForTag("js/v2026.11.14-r.1"), ["std"]);
  assert.deepEqual(areasForTag("os/v2026.11.14-r.1"), ["os"]);
  assert.throws(() => areasForTag("bad/v1"), /unsupported release tag/);
});

test("topoSort puts a dependency before its dependent", () => {
  const packages = [{ name: "slices" }, { name: "chars" }, { name: "is-elevated" }];
  const dependenciesOf = (pkg) =>
    pkg.name === "slices" ? new Set(["chars"]) : new Set();
  assert.deepEqual(
    topoSort(packages, dependenciesOf).map((pkg) => pkg.name),
    ["chars", "is-elevated", "slices"],
  );
});

test("topoSort rejects a dependency cycle", () => {
  const packages = [{ name: "a" }, { name: "b" }];
  const dependenciesOf = (pkg) =>
    new Set([pkg.name === "a" ? "b" : "a"]);
  assert.throws(() => topoSort(packages, dependenciesOf), /dependency cycle/);
});

test("sameNpmArtifact requires an exact sha512 and fails closed", () => {
  const local = { sha512: "sha512-abc", shasum: "def" };
  assert.equal(sameNpmArtifact(local, { integrity: "sha512-abc" }), true);
  assert.equal(sameNpmArtifact(local, { integrity: "sha512-xyz" }), false);
  assert.throws(() => sameNpmArtifact(local, {}), /dist.integrity/);
});

test("checkVersionPairs requires a JSR source and the same version", () => {
  assert.deepEqual(
    checkVersionPairs(
      [{ name: "@neotales/chars", version: "0.1.0-alpha.0" }],
      [{ name: "@neotales/chars", version: "0.1.0-alpha.0" }],
    ),
    [],
  );
  assert.match(
    checkVersionPairs(
      [{ name: "@neotales/chars", version: "0.1.0-alpha.0" }],
      [{ name: "@neotales/chars", version: "0.1.0-alpha.1" }],
    ).join("\n"),
    /does not match/,
  );
  assert.match(
    checkVersionPairs([], [{ name: "@neotales/orphan", version: "0.1.0-alpha.0" }]).join("\n"),
    /has no JSR source/,
  );
});

test("JSR metadata rejects a 200 response without a valid versions object", () => {
  assert.throws(
    () => assertJsrPackageMeta({ scope: "neotales", name: "chars" }, "neotales", "chars"),
    /versions must be an object/,
  );
  assert.throws(
    () => assertJsrPackageMeta({ scope: "neotales", name: "chars", versions: [] }, "neotales", "chars"),
    /versions must be an object/,
  );
  assert.throws(
    () => assertJsrPackageMeta({ scope: "neotales", name: "chars", versions: null }, "neotales", "chars"),
    /versions must be an object/,
  );
  assert.throws(
    () => assertJsrPackageMeta({ scope: "neotales", name: "other", versions: {} }, "neotales", "chars"),
    /expected @neotales\/chars/,
  );
  assert.throws(
    () => assertJsrPackageMeta({ scope: "neotales", name: "chars", versions: { "0.1.0": null } }, "neotales", "chars"),
    /version 0.1.0 must be an object/,
  );
});

test("JSR version existence distinguishes absent, present, and 404", () => {
  assert.equal(versionInJsrMeta(null, "0.1.0-alpha.0"), false);
  assert.equal(
    versionInJsrMeta(
      { scope: "neotales", name: "chars", versions: { "0.1.0-alpha.0": { createdAt: "x" } } },
      "0.1.0-alpha.0",
    ),
    true,
  );
  assert.equal(
    versionInJsrMeta(
      { scope: "neotales", name: "chars", versions: { "0.0.0": { createdAt: "x" } } },
      "0.1.0-alpha.0",
    ),
    false,
  );
});

test("denoPublishWasSkipped detects Deno's silent skip and duplicate upload", () => {
  assert.equal(
    denoPublishWasSkipped("Warning: Skipping, already published @neotales/chars@0.1.0-alpha.0"),
    true,
  );
  assert.equal(
    denoPublishWasSkipped("Already uploaded, waiting for publishing @neotales/chars@0.1.0-alpha.0"),
    true,
  );
  assert.equal(
    denoPublishWasSkipped("Successfully published @neotales/chars@0.1.0-alpha.0"),
    false,
  );
});

test("jsrPackageMeta distinguishes HTTP 404 from a 200 JSON null", async () => {
  assert.equal(
    await jsrPackageMeta(
      "@neotales/chars",
      async () => new Response("", { status: 404 }),
    ),
    null,
  );
  await assert.rejects(
    () =>
      jsrPackageMeta(
        "@neotales/chars",
        async () => new Response("null", { status: 200 }),
      ),
    /expected an object/,
  );
  assert.deepEqual(
    await jsrPackageMeta(
      "@neotales/chars",
      async () =>
        jsonResponse({ scope: "neotales", name: "chars", versions: {} }),
    ),
    { scope: "neotales", name: "chars", versions: {} },
  );
});

test("executePlan fails when Deno silently skips a version", async () => {
  const plan = {
    jsr: [{ action: "publish", name: "@neotales/chars", version: "0.1.0-alpha.0", dir: "." }],
    npm: [],
    errors: [],
  };
  const fetchImpl = async () =>
    jsonResponse({ scope: "neotales", name: "chars", versions: {} });
  await assert.rejects(
    () =>
      executePlan(plan, {
        fetchImpl,
        runJsr: () => "Warning: Skipping, already published @neotales/chars@0.1.0-alpha.0",
      }),
    /plan is stale/,
  );
});

test("executePlan fails when Deno reports a duplicate upload", async () => {
  const plan = {
    jsr: [{ action: "publish", name: "@neotales/chars", version: "0.1.0-alpha.0", dir: "." }],
    npm: [],
    errors: [],
  };
  const fetchImpl = async () =>
    jsonResponse({ scope: "neotales", name: "chars", versions: {} });
  await assert.rejects(
    () =>
      executePlan(plan, {
        fetchImpl,
        runJsr: () => "Already uploaded, waiting for publishing @neotales/chars@0.1.0-alpha.0",
      }),
    /existing or duplicate upload/,
  );
});

test("executePlan fails before upload on a 200 JSR JSON null", async () => {
  const plan = {
    jsr: [{ action: "publish", name: "@neotales/chars", version: "0.1.0-alpha.0", dir: "." }],
    npm: [],
    errors: [],
  };
  let called = false;
  await assert.rejects(
    () =>
      executePlan(plan, {
        fetchImpl: async () => new Response("null", { status: 200 }),
        runJsr: () => {
          called = true;
          return "Successfully published";
        },
      }),
    /expected an object/,
  );
  assert.equal(called, false);
});

test("executePlan fails before upload on malformed JSR metadata", async () => {
  const plan = {
    jsr: [{ action: "publish", name: "@neotales/chars", version: "0.1.0-alpha.0", dir: "." }],
    npm: [],
    errors: [],
  };
  const fetchImpl = async () =>
    jsonResponse({ scope: "neotales", name: "chars" });
  let called = false;
  await assert.rejects(
    () =>
      executePlan(plan, {
        fetchImpl,
        runJsr: () => {
          called = true;
          return "Successfully published";
        },
      }),
    /versions must be an object/,
  );
  assert.equal(called, false);
});

test("executePlan publishes a JSR version that the registry says is absent", async () => {
  const plan = {
    jsr: [{ action: "publish", name: "@neotales/chars", version: "0.1.0-alpha.0", dir: "." }],
    npm: [],
    errors: [],
  };
  const fetchImpl = async () =>
    jsonResponse({ scope: "neotales", name: "chars", versions: { "0.0.0": { createdAt: "x" } } });
  let published = false;
  await executePlan(plan, {
    fetchImpl,
    runJsr: () => {
      published = true;
      return "Successfully published @neotales/chars@0.1.0-alpha.0";
    },
  });
  assert.equal(published, true);
});

test("checkReleaseRef accepts only the exact triggering tag commit", () => {
  const base = {
    refType: "tag",
    refName: "std/v2026.11.14-r.1",
    ref: "refs/tags/std/v2026.11.14-r.1",
    expectedSha: "abc123",
    headSha: "abc123",
    tagSha: "abc123",
  };
  assert.deepEqual(checkReleaseRef(base), []);
  assert.match(
    checkReleaseRef({ ...base, refType: "branch" }).join("\n"),
    /trigger is not a tag/,
  );
  assert.match(
    checkReleaseRef({ ...base, refName: "std/other" }).join("\n"),
    /is not refs\/tags/,
  );
  assert.match(
    checkReleaseRef({ ...base, headSha: "def456" }).join("\n"),
    /checked-out HEAD/,
  );
  assert.match(
    checkReleaseRef({ ...base, tagSha: "def456" }).join("\n"),
    /points at def456/,
  );
});

function jsrPlanFixture() {
  const root = mkdtempSync(join(tmpdir(), "js-lib-plan-"));
  const dir = join(root, "std/jsr/chars");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "deno.json"),
    JSON.stringify({
      name: "@neotales/chars",
      version: "0.1.0-alpha.0",
      exports: { ".": "./mod.ts" },
    }),
  );
  writeFileSync(join(dir, "mod.ts"), "export const x = 1;\n");
  const tempRoot = join(root, "tmp");
  mkdirSync(tempRoot);
  return {
    root,
    dir,
    tempRoot,
    dryRunDeno: () => ({
      status: 0,
      stdout: `   ${pathToFileURL(join(dir, "mod.ts")).href} (1KB)\n`,
      stderr: "",
    }),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("buildPlan rejects malformed JSR metadata before planning a publish", async (t) => {
  const fixture = jsrPlanFixture();
  t.after(fixture.cleanup);
  await assert.rejects(
    () =>
      buildPlan({
        root: fixture.root,
        areas: ["std"],
        tempRoot: fixture.tempRoot,
        fetchImpl: async () => jsonResponse({ scope: "neotales", name: "chars" }),
        dryRunDeno: fixture.dryRunDeno,
      }),
    /versions must be an object/,
  );
});

test("buildPlan rejects a 200 JSR JSON null", async (t) => {
  const fixture = jsrPlanFixture();
  t.after(fixture.cleanup);
  await assert.rejects(
    () =>
      buildPlan({
        root: fixture.root,
        areas: ["std"],
        tempRoot: fixture.tempRoot,
        fetchImpl: async () => new Response("null", { status: 200 }),
        dryRunDeno: fixture.dryRunDeno,
      }),
    /expected an object/,
  );
});

test("buildPlan fails closed on an existing JSR version", async (t) => {
  const fixture = jsrPlanFixture();
  t.after(fixture.cleanup);
  const plan = await buildPlan({
    root: fixture.root,
    areas: ["std"],
    tempRoot: fixture.tempRoot,
    fetchImpl: async () =>
      jsonResponse({
        scope: "neotales",
        name: "chars",
        versions: { "0.1.0-alpha.0": { createdAt: "x" } },
      }),
    dryRunDeno: fixture.dryRunDeno,
  });
  assert.equal(plan.jsr[0].action, "blocked");
  assert.match(plan.errors.join("\n"), /automated recovery is not supported/);
});
