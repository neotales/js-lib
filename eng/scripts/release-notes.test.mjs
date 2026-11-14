import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  areaTagPrefixes,
  buildReleaseNotes,
  classifyCommitPaths,
  cleanText,
  codeSpan,
  escapeMarkdown,
  expectedPackagesForArea,
  generateReleaseNotes,
  modulePathsFromPlan,
  normalizePlan,
  parseConventionalCommit,
  selectBaseline,
} from "./release-notes.mjs";

const script = fileURLToPath(new URL("./release-notes.mjs", import.meta.url));
const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

function commit(sha, subject, modules = [], shared = false) {
  const parsed = parseConventionalCommit(subject);
  return {
    sha,
    subject,
    modules,
    shared,
    ...parsed,
  };
}

function planFixture() {
  return {
    areas: ["std"],
    jsr: [
      {
        area: "std",
        dir: "std/jsr/chars",
        name: "@neotales/chars",
        version: "0.1.0-alpha.0",
        action: "publish",
      },
      {
        area: "std",
        dir: "std/jsr/slices",
        name: "@neotales/slices",
        version: "0.1.0-alpha.0",
        action: "skip-existing",
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
      {
        area: "std",
        dir: "std/npm/slices",
        name: "@neotales/slices",
        version: "0.1.0-alpha.0",
        action: "publish",
        tag: "alpha",
      },
    ],
    errors: [],
  };
}

function notes(options = {}) {
  return buildReleaseNotes({
    tag: "std/v2026.11.14-r.1",
    area: "std",
    baseline: null,
    commits: [],
    plan: planFixture(),
    headSha: SHA_A,
    ...options,
  });
}

test("conventional types and module scopes parse without guessing", () => {
  const cases = [
    ["feat(js-chars): add a table", "feat", "feat", "js-chars", false],
    ["feature(js-slices): add tokens", "feature", "feat", "js-slices", false],
    ["fix(js-is-elevated): fall back", "fix", "fix", "js-is-elevated", false],
    ["perf(js-chars): speed up scan", "perf", "perf", "js-chars", false],
    ["refactor(js-lib): split the runner", "refactor", "refactor", "js-lib", false],
    ["docs(js-lib): document skipping", "docs", "docs", "js-lib", false],
    ["test(js-slices): cover empty input", "test", "test", "js-slices", false],
    ["build(js-lib): pin the runtime", "build", "build", "js-lib", false],
    ["ci(js-lib): run the notes test", "ci", "ci", "js-lib", false],
    ["chore(js-lib): remove a fixture", "chore", "chore", "js-lib", false],
    ["style(js-chars): align tables", "style", "style", "js-chars", false],
    ["revert(js-chars): restore the old fold", "revert", "revert", "js-chars", false],
    ["import(js-chars): import from js-libraries", "import", "import", "js-chars", false],
  ];
  for (const [subject, rawType, type, scope, breaking] of cases) {
    const parsed = parseConventionalCommit(subject);
    assert.equal(parsed.conventional, true, subject);
    assert.equal(parsed.rawType, rawType, subject);
    assert.equal(parsed.type, type, subject);
    assert.equal(parsed.scope, scope, subject);
    assert.equal(parsed.breaking, breaking, subject);
  }
});

test("breaking markers and unknown scopes do not throw", () => {
  const bang = parseConventionalCommit("feat(js-chars)!: remove an export");
  assert.equal(bang.breaking, true);
  assert.equal(bang.type, "breaking");
  assert.equal(bang.scope, "js-chars");

  const breaking = parseConventionalCommit("breaking(js-slices): change a default");
  assert.equal(breaking.breaking, true);
  assert.equal(breaking.type, "breaking");

  const nested = parseConventionalCommit("fix(js-chars/nested): keep the colon: here");
  assert.equal(nested.scope, "js-chars/nested");
  assert.equal(nested.description, "keep the colon: here");

  const noScope = parseConventionalCommit("ci: run the gate");
  assert.equal(noScope.scope, null);
  assert.equal(noScope.type, "ci");

  const plain = parseConventionalCommit("Merge branch dev into fix/node-lane-target");
  assert.equal(plain.conventional, false);
  assert.equal(plain.type, "other");
  assert.equal(plain.description, "Merge branch dev into fix/node-lane-target");
});

test("plan actions are normalized and any duplicate package is rejected", () => {
  const duplicated = normalizePlan({
    jsr: [
      { name: "@neotales/chars", version: "0.1.0-alpha.0", action: "publish", dir: "std/jsr/chars" },
      { name: "@neotales/chars", version: "0.1.0-alpha.0", action: "publish", dir: "std/jsr/chars" },
    ],
    npm: [],
    errors: [],
  });
  assert.deepEqual(duplicated.errors, []);
  assert.equal(duplicated.entries.length, 1);
  assert.match(duplicated.fatal.join("\n"), /duplicate jsr package @neotales\/chars/);

  const conflicting = normalizePlan({
    jsr: [
      { name: "@neotales/chars", version: "0.1.0-alpha.0", action: "publish" },
      { name: "@neotales/chars", version: "0.1.0-alpha.0", action: "skip-existing" },
    ],
    npm: [],
    errors: [],
  });
  assert.match(conflicting.fatal.join("\n"), /duplicate jsr package @neotales\/chars/);

  const invalid = normalizePlan({
    jsr: [
      { name: "@neotales/chars", version: "0.1.0-alpha.0", action: "upload" },
      { name: "@neotales/slices", version: "0.1.0-alpha.0", action: "publish", dir: "../outside" },
    ],
    npm: [],
    errors: ["network failed"],
  });
  assert.match(invalid.errors.join("\n"), /network failed/);
  assert.match(invalid.fatal.join("\n"), /action upload is not recognized/);
  assert.match(invalid.fatal.join("\n"), /must be relative/);
});

test("plan completeness comes from the checkout manifests, not hardcoded names", (t) => {
  const root = mkdtempSync(join(tmpdir(), "js-lib-notes-manifests-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  write(root, "std/jsr/alpha/deno.json", JSON.stringify({
    name: "@neotales/alpha",
    version: "9.9.9-alpha.0",
    exports: { ".": "./mod.ts" },
  }));
  write(root, "std/npm/alpha/package.json", JSON.stringify({
    name: "@neotales/alpha",
    version: "9.9.9-alpha.0",
  }));
  write(root, "std/jsr/hidden/deno.json", JSON.stringify({
    name: "@neotales/hidden",
    version: "9.9.9-alpha.0",
    publish: false,
  }));

  const expected = expectedPackagesForArea(root, "std");
  assert.deepEqual([...expected.jsr.keys()], ["@neotales/alpha"]);
  assert.deepEqual([...expected.npm.keys()], ["@neotales/alpha"]);

  const valid = {
    areas: ["std"],
    jsr: [{
      area: "std",
      dir: "std/jsr/alpha",
      name: "@neotales/alpha",
      version: "9.9.9-alpha.0",
      action: "publish",
    }],
    npm: [{
      area: "std",
      dir: "std/npm/alpha",
      name: "@neotales/alpha",
      version: "9.9.9-alpha.0",
      action: "publish",
      tag: "alpha",
    }],
    errors: [],
  };
  assert.deepEqual(normalizePlan(valid, "std", expected).fatal, []);

  const empty = { ...valid, jsr: [], npm: [] };
  assert.match(
    normalizePlan(empty, "std", expected).fatal.join("\n"),
    /plan\.jsr is missing publishable jsr package @neotales\/alpha/,
  );

  const fake = {
    ...valid,
    jsr: [{
      area: "std",
      dir: "std/jsr/is-elevated",
      name: "@neotales/is-elevated",
      version: "9.9.9-alpha.0",
      action: "publish",
    }],
  };
  const fakeFatal = normalizePlan(fake, "std", expected).fatal.join("\n");
  assert.match(fakeFatal, /@neotales\/is-elevated is not a publishable jsr package in std/);
  assert.match(fakeFatal, /plan\.jsr is missing publishable jsr package @neotales\/alpha/);

  const wrongVersion = {
    ...valid,
    jsr: [{ ...valid.jsr[0], version: "0.0.1-alpha.0" }],
  };
  assert.match(
    normalizePlan(wrongVersion, "std", expected).fatal.join("\n"),
    /is not manifest version 9\.9\.9-alpha\.0/,
  );

  const wrongDir = {
    ...valid,
    jsr: [{ ...valid.jsr[0], dir: "std/jsr/other" }],
  };
  assert.match(
    normalizePlan(wrongDir, "std", expected).fatal.join("\n"),
    /is not canonical directory std\/jsr\/alpha/,
  );

  const duplicate = {
    ...valid,
    jsr: [valid.jsr[0], { ...valid.jsr[0] }],
  };
  assert.match(
    normalizePlan(duplicate, "std", expected).fatal.join("\n"),
    /duplicate jsr package @neotales\/alpha/,
  );
});

test("module membership comes from changed paths, not scope text", () => {
  const modules = modulePathsFromPlan([
    { dir: "std/jsr/chars", moduleId: "chars" },
    { dir: "std/npm/chars", moduleId: "chars" },
    { dir: "std/jsr/slices", moduleId: "slices" },
    { dir: "std/npm/slices", moduleId: "slices" },
  ]);

  assert.deepEqual(
    classifyCommitPaths(
      ["js/lib/std/jsr/chars/mod.ts", "js/lib/std/npm/chars/package.json"],
      "std",
      modules,
      "js/lib",
    ),
    { touchesArea: true, shared: false, modules: ["chars"] },
  );
  assert.deepEqual(
    classifyCommitPaths(["js/lib/std/jsr/slices/mod.ts"], "std", modules, "js/lib"),
    { touchesArea: true, shared: false, modules: ["slices"] },
  );
  assert.deepEqual(
    classifyCommitPaths(["js/lib/docs/publishing.md"], "std", modules, "js/lib"),
    { touchesArea: true, shared: true, modules: [] },
  );
  assert.deepEqual(
    classifyCommitPaths(["js/lib/os/jsr/is-elevated/mod.ts"], "std", modules, "js/lib"),
    { touchesArea: false, shared: false, modules: [] },
  );
  assert.deepEqual(
    classifyCommitPaths(
      ["js/lib/std/jsr/chars/mod.ts", "js/lib/package.json"],
      "os",
      modules,
      "js/lib",
    ),
    { touchesArea: true, shared: true, modules: [] },
  );
  assert.deepEqual(
    classifyCommitPaths(
      ["js/lib/std/jsr/chars/mod.ts", "js/lib/os/jsr/is-elevated/mod.ts"],
      "os",
      modules,
      "js/lib",
    ),
    { touchesArea: true, shared: false, modules: [] },
  );
  assert.deepEqual(
    classifyCommitPaths(
      ["js/lib/std/jsr/chars/mod.ts", "js/lib/eng/scripts/shared.ts"],
      "std",
      modules,
      "js/lib",
    ),
    { touchesArea: true, shared: true, modules: ["chars"] },
  );
  assert.deepEqual(
    classifyCommitPaths(["js/lib/std/jsr/chars-and-slices/mod.ts"], "std", modules, "js/lib"),
    { touchesArea: true, shared: false, modules: [] },
  );
});

test("area tag prefixes keep std and js together and os separate", () => {
  assert.deepEqual(areaTagPrefixes("std"), ["std/v", "js/v"]);
  assert.deepEqual(areaTagPrefixes("os"), ["os/v"]);
});

test("baseline selects the nearest area tag and excludes the current tag and aliases at HEAD", () => {
  const tags = [
    { name: "std/v2026.11.14-r.1", sha: SHA_B, distance: 0 },
    { name: "js/v2026.11.14-r.1", sha: SHA_B, distance: 0 },
    { name: "std/v2026.11.01-r.1", sha: SHA_A, distance: 4 },
    { name: "js/v2026.10.01-r.1", sha: "c".repeat(40), distance: 10 },
  ];
  assert.deepEqual(
    selectBaseline(tags, "std/v2026.11.14-r.1", SHA_B),
    { name: "std/v2026.11.01-r.1", sha: SHA_A, distance: 4 },
  );
  assert.equal(selectBaseline([], "std/v2026.11.14-r.1", SHA_B), null);
  assert.equal(
    selectBaseline(
      [{ name: "std/v2026.11.14-r.1", sha: SHA_B, distance: 0 }],
      "std/v2026.11.14-r.1",
      SHA_B,
    ),
    null,
  );
});

test("a tie prefers the current tag prefix", () => {
  const tags = [
    { name: "js/v2026.11.01-r.1", sha: SHA_A, distance: 3 },
    { name: "std/v2026.11.01-r.1", sha: SHA_A, distance: 3 },
  ];
  assert.equal(
    selectBaseline(tags, "std/v2026.11.14-r.1", SHA_B).name,
    "std/v2026.11.01-r.1",
  );
});

test("scheduled packages are publish actions; skips keep their limitation", () => {
  const markdown = notes({
    commits: [commit(SHA_A, "feat(js-chars): add chars", ["chars"])],
  });
  const scheduled = markdown.split("## Existing versions skipped")[0];
  assert.match(scheduled, /@neotales\/chars/);
  assert.match(scheduled, /@neotales\/slices/);
  // The JSR chars publish and npm slices publish are scheduled. Their skip
  // twins are not.
  assert.match(scheduled, /\| JSR \| `@neotales\/chars` \|/);
  assert.match(scheduled, /\| npm \| `@neotales\/slices` \|/);
  assert.doesNotMatch(scheduled, /`skip-existing`/);

  assert.match(markdown, /`skip-existing`: content is not verified/);
  assert.match(markdown, /`verified-skip`: the registry sha512 matches the local tarball/);
  assert.match(markdown, /A JSR skip is not a content check/);
});

test("non-conventional commits use calculated module and shared labels", () => {
  const markdown = notes({
    commits: [commit(SHA_A, "Merge branch dev into the release", ["chars"], true)],
  });
  const line = markdown.split("\n").find((value) => value.includes("Merge branch"));
  assert.ok(line, markdown);
  assert.match(line, /— `chars`, `area` \(`aaaaaaa`\)$/);
});

test("a pipe in a plan field cannot add a table column", () => {
  const plan = {
    areas: ["std"],
    jsr: [
      {
        area: "std",
        dir: "std/jsr/chars",
        name: "@neotales/chars|x",
        version: "0.1.0-alpha.0|y",
        action: "publish",
      },
    ],
    npm: [],
    errors: [],
  };
  const markdown = notes({ plan });
  const row = markdown.split("\n").find((line) => line.includes("chars\\|x"));
  assert.ok(row, markdown);
  assert.equal(row.split(/(?<!\\)\|/).length, 6);
});test("a plan from another area is rejected before output", () => {
  const osPlan = {
    areas: ["os"],
    jsr: [
      {
        area: "os",
        dir: "os/jsr/is-elevated",
        name: "@neotales/is-elevated",
        version: "0.1.0-alpha.0",
        action: "publish",
      },
    ],
    npm: [],
    errors: [],
  };
  const normalized = normalizePlan(osPlan, "std");
  assert.match(normalized.fatal.join("\n"), /plan\.areas \["os"\] does not match tag area std/);
  assert.throws(
    () => notes({ plan: osPlan }),
    /release plan does not match std[\s\S]*does not match tag area std/,
  );
});

test("mixed packages and a multi-area plan are rejected before output", () => {
  const mixed = {
    areas: ["std"],
    jsr: [
      {
        area: "std",
        dir: "std/jsr/chars",
        name: "@neotales/chars",
        version: "0.1.0-alpha.0",
        action: "publish",
      },
      {
        area: "os",
        dir: "os/jsr/is-elevated",
        name: "@neotales/is-elevated",
        version: "0.1.0-alpha.0",
        action: "publish",
      },
    ],
    npm: [],
    errors: [],
  };
  const normalized = normalizePlan(mixed, "std");
  assert.match(normalized.fatal.join("\n"), /plan\.jsr\[1\]\.area os is not std/);
  assert.match(normalized.fatal.join("\n"), /plan\.jsr\[1\]\.dir os\/jsr\/is-elevated is outside std\//);
  assert.throws(() => notes({ plan: mixed }), /release plan does not match std/);

  const multi = { ...mixed, areas: ["std", "os"] };
  assert.match(
    normalizePlan(multi, "std").fatal.join("\n"),
    /plan\.areas \["std","os"\] does not match tag area std/,
  );
});

test("shared paths are included for the target area even with other-area modules", () => {
  const markdown = notes({
    commits: [
      commit(
        SHA_A,
        "fix(js-lib): share the lane and adjust the other area",
        [],
        true,
      ),
    ],
  });
  assert.match(markdown, /share the lane and adjust the other area/);
  assert.match(markdown, /— `area`/);

  const both = notes({
    commits: [
      commit(SHA_A, "fix(js-chars): change the module and shared eng", ["chars"], true),
    ],
  });
  assert.match(both, /— `chars`, `area`/);
});

test("preflight errors schedule nothing and say so", () => {
  const markdown = notes({ plan: { ...planFixture(), errors: ["network failed"] } });
  assert.match(markdown, /## Preflight failed/);
  assert.match(markdown, /Nothing is scheduled to publish/);
  assert.doesNotMatch(markdown, /## Packages scheduled to publish/);
  assert.match(markdown, /network failed/);
});

test("a module scope does not claim a module that the paths did not touch", () => {
  const markdown = notes({
    commits: [commit(SHA_A, "fix(js-chars): only docs changed", [])],
  });
  assert.match(markdown, /fix\(js-chars\)/);
  assert.match(markdown, /only docs changed — `area`/);
});

test("no matching commits is stated, not left blank", () => {
  const markdown = notes();
  assert.match(
    markdown,
    /No commits in this range touched the `std` area\. The package plan above is the release\./,
  );
  assert.doesNotMatch(markdown, /## Changes\n\n###/);
});

test("duplicate commits render once", () => {
  const one = commit(SHA_A, "fix(js-chars): one fix", ["chars"]);
  const markdown = notes({ commits: [one, { ...one }] });
  assert.equal(markdown.split("one fix").length - 1, 1);
  assert.match(markdown, /Commits touching this area: 1/);
});

test("malicious commit text cannot inject HTML, table cells, or commands", () => {
  const markdown = notes({
    commits: [
      commit(
        SHA_A,
        "fix(js-chars): <img src=x onerror=alert(1)> ::set-output name=x::y | `boom`",
        ["chars"],
      ),
    ],
  });
  assert.doesNotMatch(markdown, /<img/);
  assert.match(markdown, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(markdown, /\\\|/);
  assert.match(markdown, /\\`boom\\`/);
  assert.equal(markdown.split("\n").some((line) => line.startsWith("::")), false);
});

test("the feature type heading covers feat and feature", () => {
  const markdown = notes({
    commits: [
      commit(SHA_A, "feat(js-chars): a new export", ["chars"]),
      commit(SHA_B, "feature(js-slices): another export", ["slices"]),
    ],
  });
  const features = markdown.split("### Features")[1].split("###")[0];
  assert.match(features, /feat\(js-chars\)/);
  assert.match(features, /feature\(js-slices\)/);
});

test("buildReleaseNotes strips terminal escapes before escaping markdown", () => {
  assert.equal(
    escapeMarkdown("<b>|`x`</b>"),
    "&lt;b&gt;\\|\\`x\\`&lt;/b&gt;",
  );
  assert.equal(cleanText("\u001b[32mCheck\u001b[0m mod.ts"), "Check mod.ts");
  assert.equal(codeSpan("plain"), "`plain`");
  assert.equal(codeSpan("a`b"), "`` a`b ``");
  assert.equal(codeSpan("a```b"), "```` a```b ````");
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
  const repo = mkdtempSync(join(tmpdir(), "js-lib-notes-"));
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.email", "release-notes@example.invalid"]);
  git(repo, ["config", "user.name", "Release Notes Test"]);
  git(repo, ["config", "commit.gpgsign", "false"]);
  return repo;
}

function writeStdManifests(repo) {
  for (const name of ["chars", "slices"]) {
    write(
      repo,
      `std/jsr/${name}/deno.json`,
      JSON.stringify({
        name: `@neotales/${name}`,
        version: "0.1.0-alpha.0",
        exports: { ".": "./mod.ts" },
      }),
    );
    write(
      repo,
      `std/npm/${name}/package.json`,
      JSON.stringify({
        name: `@neotales/${name}`,
        version: "0.1.0-alpha.0",
      }),
    );
  }
}

function integrationPlan() {
  return {
    areas: ["std"],
    jsr: [
      { area: "std", dir: "std/jsr/chars", name: "@neotales/chars", version: "0.1.0-alpha.0", action: "publish" },
      { area: "std", dir: "std/jsr/slices", name: "@neotales/slices", version: "0.1.0-alpha.0", action: "skip-existing" },
    ],
    npm: [
      { area: "std", dir: "std/npm/chars", name: "@neotales/chars", version: "0.1.0-alpha.0", action: "verified-skip", tag: "alpha" },
      { area: "std", dir: "std/npm/slices", name: "@neotales/slices", version: "0.1.0-alpha.0", action: "publish", tag: "alpha" },
    ],
    errors: [],
  };
}

test("integration: tags bound the range and the CLI writes a file and summary", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  writeStdManifests(repo);
  commitAll(repo, "feat(js-chars): initial chars");
  git(repo, ["tag", "std/v2026.11.01-r.1"]);

  write(repo, "std/jsr/slices/tokens.ts", "export const x = 1;\n");
  commitAll(repo, "fix(js-slices): keep an empty token");

  write(repo, "docs/publishing.md", "notes\n");
  commitAll(repo, "docs(js-lib): describe the release notes");

  write(repo, "std/jsr/chars/evil.ts", "x\n");
  commitAll(
    repo,
    "feat(js-chars): <script>alert(1)</script> ::set-output name=x::y",
  );
  const tag = "std/v2026.11.14-r.1";
  git(repo, ["tag", tag]);

  const planPath = join(repo, "plan.json");
  writeFileSync(planPath, `${JSON.stringify(integrationPlan(), null, 2)}\n`);
  const output = join(repo, ".build/release-notes.md");
  const summary = join(repo, "step-summary.md");
  writeFileSync(summary, "");

  const result = spawnSync(
    process.execPath,
    [
      script,
      "--plan",
      planPath,
      "--output",
      output,
      "--tag",
      tag,
      "--repo",
      repo,
      "--root",
      repo,
    ],
    {
      encoding: "utf8",
      env: { ...process.env, GITHUB_STEP_SUMMARY: summary },
    },
  );
  assert.equal(result.status, 0, result.stderr);

  const markdown = readFileSync(output, "utf8");
  assert.match(markdown, /Previous `std` tag `std\/v2026\.11\.01-r\.1`/);
  assert.match(markdown, /fix\(js-slices\)/);
  assert.match(markdown, /keep an empty token/);
  assert.match(markdown, /docs\(js-lib\)/);
  assert.match(markdown, /describe the release notes/);
  assert.doesNotMatch(markdown, /initial chars/);
  assert.match(markdown, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(markdown, /<script>/);
  assert.equal(readFileSync(summary, "utf8"), markdown);

  // The command output must not carry commit text into workflow-command parsing.
  assert.doesNotMatch(result.stdout, /<script>/);
  assert.doesNotMatch(result.stdout, /::set-output/);
  assert.match(result.stdout, /baseline std\/v2026\.11\.01-r\.1/);
});

test("integration: no matching commits in the range is explicit", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  writeStdManifests(repo);
  commitAll(repo, "build(js-lib): add the publishable manifests");
  git(repo, ["tag", "std/v2026.11.01-r.1"]);

  write(repo, "os/jsr/is-elevated/mod.ts", "export const x = 1;\n");
  commitAll(repo, "fix(js-slices): only the other area changed");
  const tag = "std/v2026.11.14-r.1";
  git(repo, ["tag", tag]);

  const result = generateReleaseNotes({
    repo,
    root: repo,
    tag,
    plan: integrationPlan(),
  });
  assert.equal(result.commitCount, 0);
  assert.equal(result.baseline.name, "std/v2026.11.01-r.1");
  assert.match(result.markdown, /No commits in this range touched the `std` area/);
});

test("integration: an empty or fake plan is rejected against the checkout", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeStdManifests(repo);
  write(repo, "std/jsr/chars/a.ts", "a\n");
  commitAll(repo, "feat(js-chars): first");
  const tag = "std/v2026.11.14-r.1";
  git(repo, ["tag", tag]);

  const empty = { areas: ["std"], jsr: [], npm: [], errors: [] };
  assert.throws(
    () => generateReleaseNotes({ repo, root: repo, tag, plan: empty }),
    /plan\.jsr is missing publishable jsr package @neotales\/chars[\s\S]*plan\.npm is missing publishable npm package @neotales\/chars/,
  );

  const fake = {
    areas: ["std"],
    jsr: [{
      area: "std",
      dir: "std/jsr/is-elevated",
      name: "@neotales/is-elevated",
      version: "0.1.0-alpha.0",
      action: "publish",
    }],
    npm: [{
      area: "std",
      dir: "std/npm/is-elevated",
      name: "@neotales/is-elevated",
      version: "0.1.0-alpha.0",
      action: "publish",
      tag: "alpha",
    }],
    errors: [],
  };
  let message = "";
  assert.throws(
    () => generateReleaseNotes({ repo, root: repo, tag, plan: fake }),
    (error) => {
      message = error.message;
      return true;
    },
  );
  assert.match(message, /@neotales\/is-elevated is not a publishable jsr package in std/);
  assert.match(message, /@neotales\/is-elevated is not a publishable npm package in std/);
  assert.match(message, /plan\.jsr is missing publishable jsr package @neotales\/chars/);
});

test("integration: a duplicate tag at HEAD is not used as the baseline", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  writeStdManifests(repo);
  write(repo, "std/jsr/chars/a.ts", "a\n");
  commitAll(repo, "feat(js-chars): first");
  git(repo, ["tag", "std/v2026.11.01-r.1"]);

  write(repo, "std/jsr/chars/b.ts", "b\n");
  commitAll(repo, "fix(js-chars): second");
  const current = "std/v2026.11.14-r.1";
  git(repo, ["tag", current]);
  git(repo, ["tag", "js/v2026.11.14-r.1"]);

  const result = generateReleaseNotes({
    repo,
    root: repo,
    tag: current,
    plan: integrationPlan(),
  });
  assert.equal(result.baseline.name, "std/v2026.11.01-r.1");
  assert.match(result.markdown, /fix\(js-chars\)/);
  assert.match(result.markdown, /second/);
  assert.doesNotMatch(result.markdown, /first/);
});

test("integration: the CLI refuses a missing tag unless it is acknowledged", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeStdManifests(repo);
  write(repo, "std/jsr/chars/a.ts", "a\n");
  commitAll(repo, "feat(js-chars): first");
  const planPath = join(repo, "plan.json");
  writeFileSync(planPath, `${JSON.stringify(integrationPlan(), null, 2)}\n`);

  const strict = spawnSync(
    process.execPath,
    [
      script,
      "--plan",
      planPath,
      "--output",
      join(repo, "out.md"),
      "--tag",
      "std/v2026.11.14-r.1",
      "--repo",
      repo,
      "--root",
      repo,
    ],
    { encoding: "utf8" },
  );
  assert.notEqual(strict.status, 0);
  assert.match(strict.stderr, /does not exist locally/);

  const allowed = spawnSync(
    process.execPath,
    [
      script,
      "--plan",
      planPath,
      "--output",
      join(repo, "out.md"),
      "--tag",
      "std/v2026.11.14-r.1",
      "--repo",
      repo,
      "--root",
      repo,
      "--allow-missing-tag",
    ],
    { encoding: "utf8" },
  );
  assert.equal(allowed.status, 0, allowed.stderr);
});

test("integration: the CLI rejects a plan for the other area before writing output", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  writeStdManifests(repo);
  write(repo, "std/jsr/chars/a.ts", "a\n");
  commitAll(repo, "feat(js-chars): first");

  const planPath = join(repo, "os-plan.json");
  writeFileSync(
    planPath,
    `${JSON.stringify({
      areas: ["os"],
      jsr: [
        {
          area: "os",
          dir: "os/jsr/is-elevated",
          name: "@neotales/is-elevated",
          version: "0.1.0-alpha.0",
          action: "publish",
        },
      ],
      npm: [],
      errors: [],
    }, null, 2)}\n`,
  );
  const output = join(repo, "out.md");
  const result = spawnSync(
    process.execPath,
    [
      script,
      "--plan",
      planPath,
      "--output",
      output,
      "--tag",
      "std/v2026.11.14-r.1",
      "--repo",
      repo,
      "--root",
      repo,
      "--allow-missing-tag",
    ],
    { encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release plan does not match std/);
  assert.equal(existsSync(output), false);
});

test("integration: a shared change that also touches os is in std notes", (t) => {
  const repo = makeRepo();
  t.after(() => rmSync(repo, { recursive: true, force: true }));

  writeStdManifests(repo);
  commitAll(repo, "build(js-lib): add the publishable manifests");
  git(repo, ["tag", "std/v2026.11.01-r.1"]);

  write(repo, "eng/scripts/shared.ts", "export const x = 1;\n");
  write(repo, "os/jsr/is-elevated/mod.ts", "export const y = 1;\n");
  commitAll(repo, "fix(js-lib): share the lane and adjust os");

  write(repo, "os/jsr/is-elevated/only.ts", "export const z = 1;\n");
  commitAll(repo, "fix(js-lib): os only");

  const tag = "std/v2026.11.14-r.1";
  git(repo, ["tag", tag]);
  const result = generateReleaseNotes({
    repo,
    root: repo,
    tag,
    plan: integrationPlan(),
  });
  assert.equal(result.commitCount, 1);
  assert.match(result.markdown, /share the lane and adjust os/);
  assert.match(result.markdown, /— `area`/);
  assert.doesNotMatch(result.markdown, /os only/);
});
