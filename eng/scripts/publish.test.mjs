import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  areasForTag,
  assertJsrPackageMeta,
  assertNpmVersionMetadata,
  buildPlan,
  checkVersionPairs,
  denoPublishSkipKind,
  denoPublishWasSkipped,
  distTag,
  executePlan,
  jsrPackageMeta,
  npmVersionState,
  sameNpmArtifact,
  serializePlan,
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

async function captureConsoleLogs(run) {
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(" "));
  try {
    await run();
  } finally {
    console.log = original;
  }
  return lines;
}

function jsrMetaFetch(existing = {}) {
  return async (url) => {
    const match = /jsr\.io\/@([^/]+)\/([^/]+)\/meta\.json/.exec(url);
    assert.ok(match, `unexpected JSR URL: ${url}`);
    const name = `@${match[1]}/${match[2]}`;
    if (!Object.prototype.hasOwnProperty.call(existing, name)) {
      return new Response("", { status: 404 });
    }
    return jsonResponse({
      scope: match[1],
      name: match[2],
      versions: existing[name],
    });
  };
}

function absentByName(url) {
  const match = /jsr\.io\/@([^/]+)\/([^/]+)\/meta\.json/.exec(url);
  assert.ok(match, `unexpected JSR URL: ${url}`);
  return jsonResponse({ scope: match[1], name: match[2], versions: {} });
}

function makeJsrWorkspace(packages) {
  const root = mkdtempSync(join(tmpdir(), "js-lib-plan-"));
  for (const pkg of packages) {
    const dir = join(root, "std/jsr", pkg.name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "deno.json"),
      JSON.stringify({
        name: `@neotales/${pkg.name}`,
        version: pkg.version,
        exports: { ".": "./mod.ts" },
      }),
    );
    const importLine = pkg.imports
      ? `import "@neotales/${pkg.imports}";\n`
      : "";
    writeFileSync(join(dir, "mod.ts"), `${importLine}export const x = 1;\n`);
  }
  const tempRoot = join(root, "tmp");
  mkdirSync(tempRoot);
  return {
    root,
    tempRoot,
    dir: join(root, "std/jsr", packages[0].name),
    dryRunDeno: (pkg) => ({
      status: 0,
      stdout: `   ${pathToFileURL(join(pkg.dir, "mod.ts")).href} (1KB)\n`,
      stderr: "",
    }),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function jsrExecutePlan(name, version = "0.1.0-alpha.0") {
  return {
    jsr: [{ action: "publish", name, version, dir: "." }],
    npm: [],
    errors: [],
  };
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

test("serializePlan exposes relative package directories and no temp tarballs", () => {
  const root = "/tmp/js-lib-root";
  const plan = {
    areas: ["std"],
    jsr: [
      {
        area: "std",
        dir: "/tmp/js-lib-root/std/jsr/chars",
        name: "@neotales/chars",
        version: "0.1.0-alpha.0",
        action: "publish",
        files: ["/tmp/js-lib-root/std/jsr/chars/mod.ts"],
      },
    ],
    npm: [
      {
        area: "std",
        dir: "/tmp/js-lib-root/std/npm/chars",
        name: "@neotales/chars",
        version: "0.1.0-alpha.0",
        action: "verified-skip",
        tag: "alpha",
        tarball: "/tmp/js-lib-publish-123/chars.tgz",
        integrity: "sha512-abc",
      },
    ],
    errors: [],
  };
  assert.deepEqual(serializePlan(plan, root), {
    areas: ["std"],
    jsr: [
      {
        area: "std",
        dir: "std/jsr/chars",
        name: "@neotales/chars",
        version: "0.1.0-alpha.0",
        action: "publish",
      },
    ],
    npm: [
      {
        area: "std",
        dir: "std/npm/chars",
        name: "@neotales/chars",
        version: "0.1.0-alpha.0",
        action: "verified-skip",
        tag: "alpha",
      },
    ],
    errors: [],
  });
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

test("denoPublishWasSkipped distinguishes skips from success and errors", () => {
  assert.equal(
    denoPublishWasSkipped("Warning: Skipping, already published @neotales/chars@0.1.0-alpha.0"),
    true,
  );
  assert.equal(
    denoPublishWasSkipped("Already uploaded, waiting for publishing @neotales/chars@0.1.0-alpha.0"),
    true,
  );
  assert.equal(
    denoPublishWasSkipped("Success All packages are already published"),
    true,
  );
  assert.equal(
    denoPublishWasSkipped("Successfully published @neotales/chars@0.1.0-alpha.0"),
    false,
  );
  assert.equal(denoPublishWasSkipped("error: failed to fetch https://jsr.io"), false);
  assert.equal(denoPublishSkipKind("Warning: Skipping, already published @x/y@1.0.0"), "already-published");
  assert.equal(denoPublishSkipKind("Already uploaded, waiting for publishing @x/y@1.0.0"), "in-progress");
  assert.equal(denoPublishSkipKind("Successfully published @x/y@1.0.0"), null);
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

test("npm version metadata requires the exact name, version, integrity and tarball", async () => {
  const name = "@neotales/chars";
  const version = "0.1.0-alpha.0";
  const valid = {
    name,
    version,
    dist: {
      integrity: "sha512-abc",
      tarball: "https://registry.npmjs.org/example.tgz",
    },
  };
  assert.equal(assertNpmVersionMetadata(valid, name, version), valid);
  assert.deepEqual(
    await npmVersionState(name, version, async () => jsonResponse(valid)),
    { exists: true, dist: valid.dist },
  );
  assert.deepEqual(
    await npmVersionState(name, version, async () => new Response("", { status: 404 })),
    { exists: false },
  );

  const bad = [
    null,
    [],
    {},
    { ...valid, name: "@neotales/other" },
    { ...valid, version: "9.9.9" },
    { name, version },
    { name, version, dist: {} },
    { name, version, dist: { integrity: "sha512-abc" } },
    { name, version, dist: { integrity: 5, tarball: "https://example.tgz" } },
    { name, version, dist: { integrity: "md5-abc", tarball: "https://example.tgz" } },
  ];
  for (const value of bad) {
    assert.throws(
      () => assertNpmVersionMetadata(value, name, version),
      /malformed npm version metadata/,
      JSON.stringify(value),
    );
  }
  await assert.rejects(
    () => npmVersionState(name, version, async () => jsonResponse({})),
    /malformed npm version metadata/,
  );
  await assert.rejects(
    () => npmVersionState(name, version, async () => new Response("null", { status: 200 })),
    /malformed npm version metadata/,
  );
});

test("executePlan logs an existing JSR version and does not upload it", async () => {
  const plan = {
    jsr: [{
      action: "skip-existing",
      name: "@neotales/chars",
      version: "0.1.0-alpha.0",
      dir: ".",
    }],
    npm: [],
    errors: [],
  };
  let called = false;
  const lines = await captureConsoleLogs(() =>
    executePlan(plan, {
      fetchImpl: async () => {
        throw new Error("a skipped package must not be looked up again");
      },
      runJsr: () => {
        called = true;
        return "Successfully published";
      },
    })
  );
  assert.equal(called, false);
  assert.ok(lines.some((line) => /skip existing jsr: @neotales\/chars@0\.1\.0-alpha\.0/.test(line)));
  assert.ok(lines.some((line) => /not verified/.test(line)));
});

test("executePlan continues from a planned JSR skip to the remaining publish", async () => {
  const plan = {
    jsr: [
      { action: "skip-existing", name: "@neotales/chars", version: "0.1.0-alpha.0", dir: "." },
      { action: "publish", name: "@neotales/slices", version: "0.1.0-alpha.0", dir: "." },
    ],
    npm: [],
    errors: [],
  };
  const published = [];
  const lines = await captureConsoleLogs(() =>
    executePlan(plan, {
      fetchImpl: absentByName,
      runJsr: (pkg) => {
        published.push(pkg.name);
        return `Successfully published ${pkg.name}@${pkg.version}`;
      },
    })
  );
  assert.deepEqual(published, ["@neotales/slices"]);
  assert.ok(lines.some((line) => /skip existing jsr: @neotales\/chars/.test(line)));
  assert.ok(lines.some((line) => /publishing @neotales\/slices/.test(line)));
});

test("executePlan skips a JSR version that appeared after the plan", async () => {
  const plan = jsrExecutePlan("@neotales/chars");
  let called = false;
  const lines = await captureConsoleLogs(() =>
    executePlan(plan, {
      fetchImpl: async () =>
        jsonResponse({
          scope: "neotales",
          name: "chars",
          versions: { "0.1.0-alpha.0": { createdAt: "x" } },
        }),
      runJsr: () => {
        called = true;
        return "Successfully published";
      },
    })
  );
  assert.equal(called, false);
  assert.ok(lines.some((line) => /appeared after the plan/.test(line)));
  assert.ok(lines.some((line) => /not verified/.test(line)));
});

test("executePlan logs Deno's zero-exit already-published skip and continues", async () => {
  const plan = {
    jsr: [
      { action: "publish", name: "@neotales/chars", version: "0.1.0-alpha.0", dir: "." },
      { action: "publish", name: "@neotales/slices", version: "0.1.0-alpha.0", dir: "." },
    ],
    npm: [],
    errors: [],
  };
  const outputs = [
    "Warning: Skipping, already published @neotales/chars@0.1.0-alpha.0",
    "Successfully published @neotales/slices@0.1.0-alpha.0",
  ];
  let index = 0;
  const lines = await captureConsoleLogs(() =>
    executePlan(plan, {
      fetchImpl: absentByName,
      runJsr: () => outputs[index++],
    })
  );
  assert.equal(index, 2);
  assert.ok(lines.some((line) => /already-published/.test(line)));
  assert.ok(lines.some((line) => /not verified/.test(line)));
});

test("executePlan logs an in-progress duplicate when Deno exits zero", async () => {
  const plan = jsrExecutePlan("@neotales/chars");
  const lines = await captureConsoleLogs(() =>
    executePlan(plan, {
      fetchImpl: absentByName,
      runJsr: () =>
        "Already uploaded, waiting for publishing @neotales/chars@0.1.0-alpha.0\n" +
        "Successfully published @neotales/chars@0.1.0-alpha.0",
    })
  );
  assert.ok(lines.some((line) => /in-progress/.test(line)));
  assert.ok(lines.some((line) => /not verified/.test(line)));
});

test("executePlan fails when Deno exits non-zero after reporting an in-progress duplicate", async () => {
  const plan = jsrExecutePlan("@neotales/chars");
  await assert.rejects(
    () =>
      executePlan(plan, {
        fetchImpl: absentByName,
        runJsr: () => ({
          status: 1,
          output:
            "Already uploaded, waiting for publishing @neotales/chars@0.1.0-alpha.0\n" +
            "error: publish task failed",
        }),
      }),
    /deno publish failed with exit 1[\s\S]*publish task failed/,
  );
});

test("executePlan fails when Deno prints a skip message but exits non-zero", async () => {
  const plan = jsrExecutePlan("@neotales/chars");
  await assert.rejects(
    () =>
      executePlan(plan, {
        fetchImpl: absentByName,
        runJsr: () => ({
          status: 1,
          output:
            "Warning: Skipping, already published @neotales/chars@0.1.0-alpha.0\n" +
            "error: provenance failed",
        }),
      }),
    /deno publish failed with exit 1[\s\S]*provenance failed/,
  );
});

test("executePlan fails on a generic Deno non-zero exit", async () => {
  const plan = jsrExecutePlan("@neotales/chars");
  await assert.rejects(
    () =>
      executePlan(plan, {
        fetchImpl: absentByName,
        runJsr: () => ({ status: 1, output: "error: network down" }),
      }),
    /deno publish failed with exit 1[\s\S]*network down/,
  );
});

test("executePlan fails closed on a JSR network error before upload", async () => {
  const plan = jsrExecutePlan("@neotales/chars");
  let called = false;
  await assert.rejects(
    () =>
      executePlan(plan, {
        fetchImpl: async () => {
          throw new Error("network down");
        },
        runJsr: () => {
          called = true;
          return "Successfully published";
        },
      }),
    /network down/,
  );
  assert.equal(called, false);
});

test("executePlan fails before upload on a 200 JSR JSON null", async () => {
  const plan = jsrExecutePlan("@neotales/chars");
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
  const plan = jsrExecutePlan("@neotales/chars");
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
  const plan = jsrExecutePlan("@neotales/chars");
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

test("executePlan keeps the npm verified-skip path and publishes the rest", async () => {
  const plan = {
    jsr: [],
    npm: [
      { action: "verified-skip", name: "@neotales/chars", version: "0.1.0-alpha.0", dir: ".", tag: "alpha" },
      { action: "publish", name: "@neotales/slices", version: "0.1.0-alpha.0", dir: ".", tag: "alpha" },
    ],
    errors: [],
  };
  const calls = [];
  const lines = await captureConsoleLogs(() =>
    executePlan(plan, {
      fetchImpl: async () => {
        throw new Error("npm-only plan must not fetch JSR");
      },
      runJsr: () => {
        throw new Error("npm-only plan must not publish JSR");
      },
      runNpm: (command, args) => calls.push([command, ...args]),
    })
  );
  assert.equal(calls.length, 1);
  assert.match(calls[0].join(" "), /pnpm --dir \. publish --access public --tag alpha/);
  assert.ok(lines.some((line) => /verified skip: @neotales\/chars/.test(line)));
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

function twoPackageFixture() {
  return makeJsrWorkspace([
    { name: "chars", version: "0.1.0-alpha.0" },
    { name: "slices", version: "0.1.0-alpha.0", imports: "chars" },
  ]);
}

test("buildPlan rejects malformed JSR metadata before planning a publish", async (t) => {
  const fixture = makeJsrWorkspace([{ name: "chars", version: "0.1.0-alpha.0" }]);
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
  const fixture = makeJsrWorkspace([{ name: "chars", version: "0.1.0-alpha.0" }]);
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

test("buildPlan propagates a JSR network error instead of skipping the package", async (t) => {
  const fixture = makeJsrWorkspace([{ name: "chars", version: "0.1.0-alpha.0" }]);
  t.after(fixture.cleanup);
  await assert.rejects(
    () =>
      buildPlan({
        root: fixture.root,
        areas: ["std"],
        tempRoot: fixture.tempRoot,
        fetchImpl: async () => {
          throw new Error("network down");
        },
        dryRunDeno: fixture.dryRunDeno,
      }),
    /network down/,
  );
});

test("buildPlan logs and skips an existing JSR version without an error", async (t) => {
  const fixture = makeJsrWorkspace([{ name: "chars", version: "0.1.0-alpha.0" }]);
  t.after(fixture.cleanup);
  const plan = await buildPlan({
    root: fixture.root,
    areas: ["std"],
    tempRoot: fixture.tempRoot,
    fetchImpl: jsrMetaFetch({
      "@neotales/chars": { "0.1.0-alpha.0": { createdAt: "x" } },
    }),
    dryRunDeno: fixture.dryRunDeno,
  });
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.jsr[0].action, "skip-existing");
});

test("buildPlan mixes an existing JSR package with a new one in dependency order", async (t) => {
  const fixture = twoPackageFixture();
  t.after(fixture.cleanup);
  const plan = await buildPlan({
    root: fixture.root,
    areas: ["std"],
    tempRoot: fixture.tempRoot,
    fetchImpl: jsrMetaFetch({
      "@neotales/chars": { "0.1.0-alpha.0": { createdAt: "x" } },
    }),
    dryRunDeno: fixture.dryRunDeno,
  });
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(
    plan.jsr.map((pkg) => [pkg.name, pkg.action]),
    [
      ["@neotales/chars", "skip-existing"],
      ["@neotales/slices", "publish"],
    ],
  );
});

test("buildPlan skips every JSR package when all versions exist", async (t) => {
  const fixture = twoPackageFixture();
  t.after(fixture.cleanup);
  const plan = await buildPlan({
    root: fixture.root,
    areas: ["std"],
    tempRoot: fixture.tempRoot,
    fetchImpl: jsrMetaFetch({
      "@neotales/chars": { "0.1.0-alpha.0": { createdAt: "x" } },
      "@neotales/slices": { "0.1.0-alpha.0": { createdAt: "x" } },
    }),
    dryRunDeno: fixture.dryRunDeno,
  });
  assert.deepEqual(plan.errors, []);
  assert.deepEqual(
    plan.jsr.map((pkg) => pkg.action),
    ["skip-existing", "skip-existing"],
  );
});

test("buildPlan treats a 404 as an unpublished package", async (t) => {
  const fixture = makeJsrWorkspace([{ name: "chars", version: "0.1.0-alpha.0" }]);
  t.after(fixture.cleanup);
  const plan = await buildPlan({
    root: fixture.root,
    areas: ["std"],
    tempRoot: fixture.tempRoot,
    fetchImpl: jsrMetaFetch(),
    dryRunDeno: fixture.dryRunDeno,
  });
  assert.deepEqual(plan.errors, []);
  assert.equal(plan.jsr[0].action, "publish");
});
