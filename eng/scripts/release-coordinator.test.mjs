import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultAreaRegistry,
  classifyChangedPaths,
  loadAreaRegistry,
  normalizeAreaRegistry,
  parseReleaseTag,
} from "./release-areas.mjs";
import {
  buildAreaGraph,
  buildMatrix,
  collectChangedPaths,
  coordinateRelease,
  crossAreaDependencyErrors,
  resolveReleaseAreas,
  validatePlanForAreas,
  writeCoordinatorArtifacts,
  writeGithubOutput,
} from "./release-coordinator.mjs";
import {
  discoverPackages,
  executePlan,
  resolvePublishAreas,
  validateExpectedPlan,
} from "./publish.mjs";

const VERSION = "0.1.0-alpha.0";
const OLD_TAG = "v2026.11.01-r.1";
const NEW_TAG = "v2026.11.14-r.1";

const REGISTRY = {
  areas: [
    { name: "std", legacyTagPrefixes: ["std/v", "js/v"] },
    { name: "os", legacyTagPrefixes: ["os/v"] },
  ],
  sharedPaths: ["eng", "docs", ".github", "package.json"],
};

test("std JSR dry runs resolve nested workspace imports without migrating pnpm config", () => {
  const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
  const config = JSON.parse(readFileSync(join(root, "std/deno.json"), "utf8"));
  assert.deepEqual(config.workspace, ["./jsr/*"]);
  assert.equal(config.nodeModulesDir, "auto");

  for (const pkg of ["env", "dotenv"]) {
    const result = spawnSync("deno", ["publish", "--dry-run", "--allow-dirty"], {
      cwd: join(root, "std/jsr", pkg),
      encoding: "utf8",
      timeout: 120_000,
    });
    assert.ifError(result.error);
    assert.equal(
      result.status,
      0,
      `${pkg} dry run failed:\n${result.stdout}\n${result.stderr}`,
    );
    assert.doesNotMatch(
      `${result.stdout}\n${result.stderr}`,
      /Migrated its workspace configuration|not a member of the workspace/,
    );
  }

  assert.equal(existsSync(join(root, "std/deno.jsonc")), false);
});

function git(repo, args) {
  const result = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function write(repo, path, contents) {
  const file = join(repo, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

function commitAll(repo, message) {
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-q", "-m", message]);
}

function makeRepo() {
  const repo = mkdtempSync(join(tmpdir(), "js-lib-coordinator-"));
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.email", "coordinator@example.invalid"]);
  git(repo, ["config", "user.name", "Coordinator Test"]);
  git(repo, ["config", "commit.gpgsign", "false"]);
  return repo;
}

function writeRegistry(repo) {
  write(repo, "eng/release-areas.json", `${JSON.stringify(REGISTRY, null, 2)}\n`);
}

function writePackage(repo, area, name, imports = []) {
  write(
    repo,
    `${area}/jsr/${name}/deno.json`,
    `${JSON.stringify(
      {
        name: `@neotales/${name}`,
        version: VERSION,
        exports: { ".": "./mod.ts" },
        publish: { exclude: ["ende.json"] },
      },
      null,
      2,
    )}\n`,
  );
  write(
    repo,
    `${area}/jsr/${name}/mod.ts`,
    `${imports.map((specifier) => `import ${JSON.stringify(specifier)};`).join("\n")}\n` +
      `export const name = ${JSON.stringify(name)};\n`,
  );
  write(
    repo,
    `${area}/npm/${name}/package.json`,
    `${JSON.stringify(
      { name: `@neotales/${name}`, version: VERSION, type: "module" },
      null,
      2,
    )}\n`,
  );
  write(repo, `${area}/npm/${name}/index.js`, `export const name = ${JSON.stringify(name)};\n`);
}

function baseRepo() {
  const repo = makeRepo();
  writeRegistry(repo);
  writePackage(repo, "std", "chars");
  writePackage(repo, "std", "slices");
  writePackage(repo, "os", "is-elevated");
  commitAll(repo, "chore: initial packages");
  return repo;
}

function tagged(repo, name) {
  git(repo, ["tag", "-a", name, "-m", `release ${name}`]);
}

function emptyCommit(repo) {
  git(repo, ["commit", "--allow-empty", "-q", "-m", "chore: empty"]);
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function registryFetch({
  jsr = {},
  npm = {},
  status = 200,
  malformedJsr = false,
  npmBody,
  throwNetwork = false,
} = {}) {
  return async (url) => {
    if (throwNetwork) throw new Error("network down");
    if (status !== 200) return new Response("", { status });
    const jsrMatch = /^https:\/\/jsr\.io\/@([^/]+)\/([^/]+)\/meta\.json$/.exec(url);
    if (jsrMatch) {
      if (malformedJsr) return jsonResponse(null);
      const name = `@${jsrMatch[1]}/${jsrMatch[2]}`;
      const versions = jsr[name];
      if (!versions) return new Response("", { status: 404 });
      return jsonResponse({
        scope: jsrMatch[1],
        name: jsrMatch[2],
        versions: Object.fromEntries(versions.map((version) => [version, {}])),
      });
    }
    if (url.startsWith("https://registry.npmjs.org/")) {
      const rest = url.slice("https://registry.npmjs.org/".length);
      const slash = rest.lastIndexOf("/");
      const name = decodeURIComponent(rest.slice(0, slash));
      const version = decodeURIComponent(rest.slice(slash + 1));
      if (npmBody !== undefined) return jsonResponse(npmBody);
      if (!(npm[name] ?? []).includes(version)) {
        return new Response("", { status: 404 });
      }
      return jsonResponse({
        name,
        version,
        dist: {
          integrity: "sha512-test",
          tarball: "https://registry.npmjs.org/example.tgz",
        },
      });
    }
    throw new Error(`unexpected registry URL ${url}`);
  };
}

function present({ jsrVersions = {}, npmVersions = {} } = {}) {
  const jsr = {
    "@neotales/chars": [VERSION],
    "@neotales/slices": [VERSION],
    "@neotales/is-elevated": [VERSION],
    ...jsrVersions,
  };
  const npm = {
    "@neotales/chars": [VERSION],
    "@neotales/slices": [VERSION],
    "@neotales/is-elevated": [VERSION],
    ...npmVersions,
  };
  return registryFetch({ jsr, npm });
}

function absentFetch() {
  return registryFetch();
}

async function planFor({ root, areas }) {
  const { jsr, npm } = discoverPackages(root, areas);
  return {
    areas,
    jsr: jsr.map((entry) => ({ ...entry, action: "publish", files: [] })),
    npm: npm.map((entry) => ({ ...entry, action: "publish", tag: "alpha" })),
    errors: [],
  };
}

function resolveOptions(repo, extra = {}) {
  return {
    repo,
    root: repo,
    tag: NEW_TAG,
    registry: loadAreaRegistry(repo),
    fetchImpl: present(),
    ...extra,
  };
}

test("release tags are normal annotated tags or registered legacy tags", () => {
  assert.deepEqual(parseReleaseTag(NEW_TAG), {
    kind: "release",
    tag: NEW_TAG,
    date: "2026-11-14",
    revision: 1,
  });
  assert.equal(parseReleaseTag("std/v2026.11.14-r.2").kind, "legacy");
  assert.equal(parseReleaseTag("js/v2026.11.14-r.2").area, "std");
  assert.equal(parseReleaseTag("os/v2026.11.14-r.2").area, "os");

  for (const bad of [
    "v2026.11.14",
    "v2026.11.14-r.0",
    "v2026.11.14-r.01",
    "v2026.02.31-r.1",
    "2026.11.14-r.1",
    "release/v2026.11.14-r.1",
  ]) {
    assert.throws(() => parseReleaseTag(bad), /unsupported release tag|invalid/);
  }
});

test("the registry rejects duplicate areas and shared paths inside an area", () => {
  assert.throws(
    () =>
      normalizeAreaRegistry({
        areas: [{ name: "std" }, { name: "std" }],
        sharedPaths: ["eng"],
      }),
    /duplicate area std/,
  );
  assert.throws(
    () =>
      normalizeAreaRegistry({
        areas: [{ name: "std" }],
        sharedPaths: ["eng", "std"],
      }),
    /overlaps area std/,
  );
  assert.throws(
    () =>
      normalizeAreaRegistry({
        areas: [{ name: "std" }],
        sharedPaths: ["eng"],
        unknown: true,
      }),
    /unknown key unknown/,
  );
});

test("a directory with jsr or npm must be a registered area", (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writePackage(repo, "extra", "thing");
  commitAll(repo, "feat: add an unregistered area");
  assert.throws(() => loadAreaRegistry(repo), /unregistered area extra/);
});

test("path classification prefers the area, then shared paths, and is conservative otherwise", () => {
  const registry = defaultAreaRegistry();
  assert.deepEqual(
    classifyChangedPaths({ paths: ["std/jsr/chars/README.md"], registry }),
    {
      selected: ["std"],
      reasons: { std: ["path:std/jsr/chars/README.md"] },
      unlisted: [],
    },
  );
  assert.deepEqual(
    classifyChangedPaths({ paths: ["docs/publishing.md"], registry }).selected,
    ["std", "os"],
  );
  assert.deepEqual(
    classifyChangedPaths({ paths: ["os/jsr/is-elevated/mod.ts"], registry }).selected,
    ["os"],
  );
  assert.deepEqual(classifyChangedPaths({ paths: [], registry }).selected, []);
  const unlisted = classifyChangedPaths({ paths: ["scratch/new.txt"], registry });
  assert.deepEqual(unlisted.selected, ["std", "os"]);
  assert.deepEqual(unlisted.unlisted, ["scratch/new.txt"]);
});

test("monorepo-prefixed paths are classified relative to the satellite root", async (t) => {
  const repo = makeRepo();
  const root = join(repo, "js", "lib");
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  write(root, "eng/release-areas.json", `${JSON.stringify(REGISTRY, null, 2)}\n`);
  writePackage(repo, "js/lib/std", "chars");
  writePackage(repo, "js/lib/os", "is-elevated");
  commitAll(repo, "chore: monorepo packages");
  tagged(repo, OLD_TAG);
  write(repo, "js/lib/std/jsr/chars/change.ts", "export const change = 1;\n");
  commitAll(repo, "fix(chars): monorepo change");
  tagged(repo, NEW_TAG);

  const result = await resolveReleaseAreas({
    repo,
    root,
    tag: NEW_TAG,
    registry: loadAreaRegistry(root),
    fetchImpl: present(),
  });
  assert.deepEqual(result.selectedAreas, ["std"]);
  assert.ok(result.changedPaths.includes("std/jsr/chars/change.ts"));
  assert.ok(!result.changedPaths.some((path) => path.startsWith("js/lib/")));
});

test("the first normal release selects every registered area", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, NEW_TAG);

  const result = await resolveReleaseAreas(resolveOptions(repo));
  assert.equal(result.firstRelease, true);
  assert.equal(result.baseline, null);
  assert.deepEqual(result.selectedAreas, ["std", "os"]);
  assert.deepEqual(result.reasons, {
    std: ["first-release"],
    os: ["first-release"],
  });
});

test("a normal release after legacy area tags is still the first normal release", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, "std/v2026.11.01-r.1");
  write(repo, "std/jsr/chars/change.ts", "export const change = 1;\n");
  commitAll(repo, "fix(chars): a change");
  tagged(repo, NEW_TAG);

  const result = await resolveReleaseAreas(resolveOptions(repo));
  assert.equal(result.firstRelease, true);
  assert.equal(result.baseline, null);
  assert.deepEqual(result.selectedAreas, ["std", "os"]);
});

test("a normal release tag must exist and point at HEAD unless it is a preview", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  await assert.rejects(
    () => resolveReleaseAreas(resolveOptions(repo)),
    /does not exist locally/,
  );
  const preview = await resolveReleaseAreas(
    resolveOptions(repo, { allowMissingTag: true }),
  );
  assert.equal(preview.firstRelease, true);

  tagged(repo, OLD_TAG);
  write(repo, "std/jsr/chars/change.ts", "export const change = 1;\n");
  commitAll(repo, "fix(chars): a change");
  tagged(repo, NEW_TAG);
  write(repo, "std/jsr/chars/change2.ts", "export const change2 = 1;\n");
  commitAll(repo, "fix(chars): another change");

  await assert.rejects(
    () => resolveReleaseAreas(resolveOptions(repo)),
    /points at .*, but HEAD is/,
  );
});

test("the baseline is the previous first-parent release tag, not a tag on a merged branch", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);

  git(repo, ["checkout", "-q", "-b", "side"]);
  write(repo, "os/jsr/is-elevated/side.ts", "export const side = 1;\n");
  commitAll(repo, "fix(os): side branch");
  tagged(repo, "v2026.11.05-r.1");
  git(repo, ["checkout", "-q", "main"]);
  git(repo, ["merge", "-q", "--no-ff", "side", "-m", "merge side"]);

  write(repo, "std/jsr/chars/change.ts", "export const change = 1;\n");
  commitAll(repo, "fix(std): main change");
  tagged(repo, NEW_TAG);

  const result = await resolveReleaseAreas(resolveOptions(repo));
  assert.equal(result.baseline.name, OLD_TAG);
  assert.deepEqual(result.selectedAreas, ["std", "os"]);
  assert.ok(result.changedPaths.includes("std/jsr/chars/change.ts"));
});

test("the current tag and aliases at HEAD are not used as the baseline", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  emptyCommit(repo);
  tagged(repo, NEW_TAG);
  tagged(repo, "v2026.11.14-r.2");

  const result = await resolveReleaseAreas(resolveOptions(repo));
  assert.equal(result.baseline.name, OLD_TAG);
});

test("a shared change selects every area, while packaged docs select only their area", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);

  write(repo, "docs/publishing.md", "shared\n");
  commitAll(repo, "docs: shared change");
  tagged(repo, NEW_TAG);
  const shared = await resolveReleaseAreas(resolveOptions(repo));
  assert.deepEqual(shared.selectedAreas, ["std", "os"]);

  const packaged = baseRepo();
  t.after(() => rmSync(packaged, { recursive: true, force: true }));
  tagged(packaged, OLD_TAG);
  write(packaged, "std/jsr/chars/README.md", "packaged\n");
  commitAll(packaged, "docs(chars): packaged change");
  tagged(packaged, NEW_TAG);
  const onlyStd = await resolveReleaseAreas(resolveOptions(packaged));
  assert.deepEqual(onlyStd.selectedAreas, ["std"]);
});

test("no changes and every version published selects no area and no matrix row runs", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  emptyCommit(repo);
  tagged(repo, NEW_TAG);

  const result = await resolveReleaseAreas(resolveOptions(repo));
  assert.deepEqual(result.selectedAreas, []);
  const matrix = buildMatrix({ areas: result.selectedAreas, graph: result.graph });
  assert.equal(matrix.include.length, 1);
  assert.equal(matrix.include[0].area, "none");
  assert.equal(matrix.include[0].skip, true);
});

test("a manifest version missing from JSR selects its area", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  emptyCommit(repo);
  tagged(repo, NEW_TAG);

  const result = await resolveReleaseAreas(
    resolveOptions(repo, {
      fetchImpl: present({ jsrVersions: { "@neotales/chars": [] } }),
    }),
  );
  assert.deepEqual(result.selectedAreas, ["std"]);
  assert.deepEqual(result.missingVersions, [
    { area: "std", registry: "jsr", name: "@neotales/chars", version: VERSION },
  ]);
  assert.match(result.reasons.std.join(" "), /registry-missing:jsr @neotales\/chars/);
});

test("a manifest version missing from npm selects its area", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  emptyCommit(repo);
  tagged(repo, NEW_TAG);

  const result = await resolveReleaseAreas(
    resolveOptions(repo, {
      fetchImpl: present({ npmVersions: { "@neotales/is-elevated": [] } }),
    }),
  );
  assert.deepEqual(result.selectedAreas, ["os"]);
  assert.deepEqual(result.missingVersions, [
    {
      area: "os",
      registry: "npm",
      name: "@neotales/is-elevated",
      version: VERSION,
    },
  ]);
});

test("a registry error or malformed metadata fails closed before selection", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  emptyCommit(repo);
  tagged(repo, NEW_TAG);

  await assert.rejects(
    () => resolveReleaseAreas(resolveOptions(repo, { fetchImpl: registryFetch({ status: 500 }) })),
    /cannot read JSR/,
  );
  await assert.rejects(
    () => resolveReleaseAreas(resolveOptions(repo, { fetchImpl: registryFetch({ throwNetwork: true }) })),
    /cannot read JSR/,
  );
  await assert.rejects(
    () => resolveReleaseAreas(resolveOptions(repo, { fetchImpl: registryFetch({ malformedJsr: true }) })),
    /malformed JSR package metadata/,
  );
});

test("a legacy area tag selects only its area and does not inspect other areas", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, "std/v2026.11.14-r.1");

  const result = await resolveReleaseAreas(
    resolveOptions(repo, {
      tag: "std/v2026.11.14-r.1",
      fetchImpl: present({ npmVersions: { "@neotales/is-elevated": [] } }),
    }),
  );
  assert.equal(result.parsed.kind, "legacy");
  assert.deepEqual(result.selectedAreas, ["std"]);
  assert.deepEqual(result.inspectedAreas, ["std"]);
  assert.deepEqual(result.reasons.std, ["legacy-tag:std/v"]);
});

test("a normal release tag must be annotated", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  git(repo, ["tag", NEW_TAG]);

  await assert.rejects(
    () => resolveReleaseAreas(resolveOptions(repo)),
    /must be annotated/,
  );
});

test("a legacy area tag may be lightweight", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  git(repo, ["tag", "std/v2026.11.14-r.1"]);

  const result = await resolveReleaseAreas(
    resolveOptions(repo, { tag: "std/v2026.11.14-r.1" }),
  );
  assert.equal(result.parsed.kind, "legacy");
  assert.deepEqual(result.selectedAreas, ["std"]);
});

test("a malformed npm 200 fails closed during selection", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, NEW_TAG);

  const validDist = {
    integrity: "sha512-test",
    tarball: "https://registry.npmjs.org/example.tgz",
  };
  const badBodies = [
    null,
    {},
    { name: "@neotales/chars", version: VERSION },
    { name: "@neotales/chars", version: VERSION, dist: {} },
    { name: "@neotales/chars", version: VERSION, dist: { integrity: "sha512-test" } },
    {
      name: "@neotales/chars",
      version: VERSION,
      dist: { integrity: 5, tarball: "https://registry.npmjs.org/example.tgz" },
    },
    {
      name: "@neotales/other",
      version: VERSION,
      dist: validDist,
    },
    {
      name: "@neotales/chars",
      version: "9.9.9",
      dist: validDist,
    },
  ];

  for (const npmBody of badBodies) {
    await assert.rejects(
      () =>
        resolveReleaseAreas(
          resolveOptions(repo, {
            fetchImpl: registryFetch({ npmBody }),
          }),
        ),
      /cannot read npm .*malformed npm version metadata/,
      JSON.stringify(npmBody),
    );
  }
});

test("cross-area dependencies fail before upload unless the dependency is already published", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeRegistry(repo);
  writePackage(repo, "os", "is-elevated");
  writePackage(repo, "std", "consumer", ["@neotales/is-elevated"]);
  commitAll(repo, "feat: cross-area dependency");

  const graph = buildAreaGraph({ root: repo, areas: ["std", "os"] });
  assert.deepEqual([...graph.areaDependencies.get("std")], ["os"]);

  const plan = {
    jsr: [
      {
        area: "std",
        dir: join(repo, "std/jsr/consumer"),
        name: "@neotales/consumer",
        version: VERSION,
        action: "publish",
      },
    ],
    npm: [],
  };
  const missing = {
    std: { jsr: [], npm: [] },
    os: {
      jsr: [
        { name: "@neotales/is-elevated", version: VERSION, exists: false },
      ],
      npm: [],
    },
  };
  const errors = crossAreaDependencyErrors({
    graph,
    registryState: missing,
    plan,
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /publish os first/);

  const published = {
    ...missing,
    os: {
      jsr: [
        { name: "@neotales/is-elevated", version: VERSION, exists: true },
      ],
      npm: [],
    },
  };
  assert.deepEqual(
    crossAreaDependencyErrors({ graph, registryState: published, plan }),
    [],
  );
});

test("a publish worker needs its area for a normal tag and keeps legacy tags", () => {
  const registry = defaultAreaRegistry();
  assert.deepEqual(
    resolvePublishAreas({ tag: NEW_TAG, area: "std", registry }),
    ["std"],
  );
  assert.deepEqual(
    resolvePublishAreas({ tag: "std/v2026.11.14-r.1", registry }),
    ["std"],
  );
  assert.deepEqual(
    resolvePublishAreas({ tag: "js/v2026.11.14-r.1", registry }),
    ["std"],
  );
  assert.throws(
    () => resolvePublishAreas({ tag: NEW_TAG, registry }),
    /pass --area/,
  );
  assert.throws(
    () => resolvePublishAreas({ tag: NEW_TAG, area: "none", registry }),
    /unknown area/,
  );
  assert.throws(
    () =>
      resolvePublishAreas({
        tag: "std/v2026.11.14-r.1",
        area: "os",
        registry,
      }),
    /selects std, not os/,
  );
});

test("the expected coordinator plan permits action changes but not package changes", () => {
  const expected = {
    areas: ["std"],
    jsr: [
      {
        area: "std",
        dir: "std/jsr/chars",
        name: "@neotales/chars",
        version: VERSION,
        action: "publish",
      },
    ],
    npm: [
      {
        area: "std",
        dir: "std/npm/chars",
        name: "@neotales/chars",
        version: VERSION,
        action: "publish",
        tag: "alpha",
      },
    ],
    errors: [],
  };
  const fresh = {
    areas: ["std"],
    jsr: [{ ...expected.jsr[0], action: "skip-existing" }],
    npm: [{ ...expected.npm[0], action: "verified-skip" }],
    errors: [],
  };
  assert.deepEqual(validateExpectedPlan(expected, fresh, "std"), []);

  const changedVersion = {
    ...fresh,
    jsr: [{ ...fresh.jsr[0], version: "0.1.0-alpha.1" }],
  };
  assert.match(
    validateExpectedPlan(expected, changedVersion, "std").join(" "),
    /does not match checkout/,
  );
  assert.match(
    validateExpectedPlan({ ...expected, areas: ["os"] }, fresh, "std").join(" "),
    /does not include area std/,
  );
});

test("the coordinator persists the plan, notes, rationale and matrix", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  write(repo, "std/jsr/chars/change.ts", "export const change = 1;\n");
  commitAll(repo, "fix(chars): a change");
  tagged(repo, NEW_TAG);

  const result = await coordinateRelease({
    repo,
    root: repo,
    tag: NEW_TAG,
    fetchImpl: present(),
    buildPlanImpl: planFor,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.plan.areas, ["std"]);
  assert.deepEqual(result.rationale.selectedAreas, ["std"]);
  assert.equal(result.rationale.baseline.name, OLD_TAG);
  assert.ok(result.rationale.changedPaths.includes("std/jsr/chars/change.ts"));
  assert.match(result.notes, /# Release notes: `v2026\.11\.14-r\.1`/);
  assert.match(result.notes, /## Area: `std`/);
  assert.match(result.notes, /`@neotales\/chars`/);

  const out = mkdtempSync(join(tmpdir(), "js-lib-artifacts-"));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const paths = {
    planJson: join(out, "release-plan.json"),
    notes: join(out, "release-notes.md"),
    rationale: join(out, "release-rationale.json"),
    matrix: join(out, "release-matrix.json"),
  };
  writeCoordinatorArtifacts({ ...paths, result });
  for (const path of Object.values(paths)) assert.equal(existsSync(path), true, path);

  const plan = JSON.parse(readFileSync(paths.planJson, "utf8"));
  assert.deepEqual(plan.areas, ["std"]);
  const rationale = JSON.parse(readFileSync(paths.rationale, "utf8"));
  assert.deepEqual(rationale.selectedAreas, ["std"]);
  assert.equal(rationale.baseline.name, OLD_TAG);
  assert.deepEqual(rationale.reasons.std, ["path:std/jsr/chars/change.ts"]);
  const matrix = JSON.parse(readFileSync(paths.matrix, "utf8"));
  assert.deepEqual(matrix.include, [{ area: "std", jsr: 2, npm: 2, packages: 4 }]);
});

test("a multi-area release writes one notes section per area and two matrix rows", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  write(repo, "docs/publishing.md", "shared\n");
  commitAll(repo, "docs: shared change");
  tagged(repo, NEW_TAG);

  const result = await coordinateRelease({
    repo,
    root: repo,
    tag: NEW_TAG,
    fetchImpl: present(),
    buildPlanImpl: planFor,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.plan.areas, ["std", "os"]);
  assert.deepEqual(
    result.matrix.include.map((entry) => entry.area),
    ["std", "os"],
  );
  assert.match(result.notes, /## Area: `std`/);
  assert.match(result.notes, /## Area: `os`/);
  assert.match(result.notes, /`@neotales\/is-elevated`/);
});

test("an invalid plan writes failure notes and never starts a publish job", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  write(repo, "std/jsr/chars/change.ts", "export const change = 1;\n");
  commitAll(repo, "fix(chars): a change");
  tagged(repo, NEW_TAG);

  const result = await coordinateRelease({
    repo,
    root: repo,
    tag: NEW_TAG,
    fetchImpl: present(),
    buildPlanImpl: async ({ areas }) => ({ areas, jsr: [], npm: [], errors: [] }),
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /missing publishable jsr package @neotales\/chars/);
  assert.match(result.notes, /Preflight failed/);
});

test("notes report existing versions as skips, not as shipments", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  tagged(repo, OLD_TAG);
  write(repo, "std/jsr/chars/change.ts", "export const change = 1;\n");
  commitAll(repo, "fix(chars): a change");
  tagged(repo, NEW_TAG);

  const result = await coordinateRelease({
    repo,
    root: repo,
    tag: NEW_TAG,
    fetchImpl: present(),
    buildPlanImpl: async ({ root, areas }) => {
      const { jsr, npm } = discoverPackages(root, areas);
      return {
        areas,
        jsr: jsr.map((entry) => ({ ...entry, action: "skip-existing", files: [] })),
        npm: npm.map((entry) => ({ ...entry, action: "verified-skip", tag: "alpha" })),
        errors: [],
      };
    },
  });
  assert.equal(result.ok, true);
  assert.match(result.notes, /No package is scheduled to publish/);
  assert.match(result.notes, /Existing versions skipped/);
  assert.match(result.notes, /content is not verified/);
  assert.doesNotMatch(result.notes, /Packages scheduled to publish\n\n\|/);
});

test("a missing cross-area dependency fails the coordinated plan", async (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeRegistry(repo);
  writePackage(repo, "os", "is-elevated");
  writePackage(repo, "std", "consumer", ["@neotales/is-elevated"]);
  commitAll(repo, "feat: cross-area dependency");
  tagged(repo, OLD_TAG);
  write(repo, "std/jsr/consumer/change.ts", "export const change = 1;\n");
  commitAll(repo, "fix(consumer): change");
  tagged(repo, NEW_TAG);

  const result = await coordinateRelease({
    repo,
    root: repo,
    tag: NEW_TAG,
    fetchImpl: present({
      jsrVersions: { "@neotales/is-elevated": [] },
      npmVersions: { "@neotales/is-elevated": [] },
    }),
    buildPlanImpl: planFor,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /publish os first/);
});

test("one area's publish failure does not prevent another area from publishing", async (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const graph = buildAreaGraph({ root: repo, areas: ["std", "os"] });
  const std = graph.jsr.find((entry) => entry.area === "std" && entry.name === "@neotales/chars");
  const os = graph.jsr.find((entry) => entry.area === "os");
  const fetchImpl = absentFetch();

  await assert.rejects(
    () =>
      executePlan(
        {
          areas: ["std"],
          jsr: [{ ...std, action: "publish" }],
          npm: [],
          errors: [],
        },
        {
          fetchImpl,
          runJsr: () => ({ status: 1, output: "boom" }),
        },
      ),
    /deno publish failed/,
  );

  await executePlan(
    {
      areas: ["os"],
      jsr: [{ ...os, action: "publish" }],
      npm: [],
      errors: [],
    },
    {
      fetchImpl,
      runJsr: () => ({ status: 0, output: "published" }),
    },
  );
});

test("validatePlanForAreas rejects an area mismatch and a missing package", (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const plan = {
    areas: ["std"],
    jsr: [
      {
        area: "std",
        dir: "std/jsr/chars",
        name: "@neotales/chars",
        version: VERSION,
        action: "publish",
      },
    ],
    npm: [],
    errors: [],
  };
  const errors = validatePlanForAreas({ root: repo, plan, areas: ["std"] });
  assert.ok(errors.some((error) => /plan\.jsr is missing publishable jsr package @neotales\/slices/.test(error)));
  assert.ok(errors.some((error) => /plan\.npm is missing publishable npm package @neotales\/chars/.test(error)));
  assert.ok(
    validatePlanForAreas({ root: repo, plan, areas: ["os"] }).some((error) =>
      /does not match selected areas/.test(error),
    ),
  );
});

test("GitHub outputs are single-line and include a non-empty sentinel matrix", (t) => {
  const out = mkdtempSync(join(tmpdir(), "js-lib-output-"));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const path = join(out, "github-output");
  writeFileSync(path, "");
  const matrix = buildMatrix({ areas: [], graph: { jsr: [], npm: [] } });
  writeGithubOutput(path, {
    has_areas: "false",
    matrix: JSON.stringify(matrix),
    selected_areas: "",
  });
  const text = readFileSync(path, "utf8");
  assert.match(text, /^has_areas=false$/m);
  assert.match(text, /^matrix=\{"include":\[\{"area":"none"/m);
  assert.throws(
    () => writeGithubOutput(path, { matrix: "two\nlines" }),
    /single line/,
  );
});

test("collectChangedPaths reports the renamed pair rather than hiding the old path", (t) => {
  const repo = baseRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  write(repo, "std/jsr/chars/moved.ts", "export const moved = 1;\n");
  commitAll(repo, "feat(chars): add moved");
  const before = git(repo, ["rev-parse", "HEAD"]);
  git(repo, ["mv", "std/jsr/chars/moved.ts", "std/jsr/chars/after.ts"]);
  commitAll(repo, "refactor(chars): rename moved");
  const paths = collectChangedPaths({
    repo,
    fromSha: before,
    headSha: git(repo, ["rev-parse", "HEAD"]),
  });
  assert.deepEqual(paths, [
    "std/jsr/chars/after.ts",
    "std/jsr/chars/moved.ts",
  ]);
});
