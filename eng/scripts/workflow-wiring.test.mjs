import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  LINUX_GATE,
  checkWorkflowPlatformGates,
  checkWorkflowShells,
  checkWorkflowTriggers,
  checkWorkflowTxikiBaseRefs,
  checkWorkflowWiring,
  githubGlobMatches,
  jsWorkflowPaths,
  normalizeGate,
  pushEventAllows,
  refFiltersAllow,
  satelliteRoot,
  workflowLayout,
  workflowWiringPaths,
} from "./check-workflow-wiring.mjs";

test("both js-cd workflow copies expose plan outputs to the publish matrix", () => {
  const paths = workflowWiringPaths();
  assert.ok(paths.length > 0, "no js-cd.yml workflow found");
  for (const path of paths) {
    const errors = checkWorkflowWiring(readFileSync(path, "utf8"), path);
    assert.deepEqual(errors, [], path);
  }
});

test("the wiring check rejects a missing plan outputs mapping", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    /    outputs:\n(?:      .*\n)+/,
    "",
  );
  assert.match(
    checkWorkflowWiring(text, "mutated/js-cd.yml").join("\n"),
    /plan job has no outputs/,
  );
});

test("the wiring check rejects an output mapped to the wrong step", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "steps.release_plan.outputs.has_areas",
    "steps.other.outputs.has_areas",
  );
  assert.match(
    checkWorkflowWiring(text, "mutated/js-cd.yml").join("\n"),
    /plan job output has_areas is not steps\.release_plan\.outputs\.has_areas/,
  );
});

test("the wiring check rejects a missing step id", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    /^        id: release_plan\n/m,
    "",
  );
  assert.match(
    checkWorkflowWiring(text, "mutated/js-cd.yml").join("\n"),
    /planner step has no id/,
  );
});

test("every js workflow passes the tag-trigger, Windows-shell and platform rules", () => {
  const paths = jsWorkflowPaths();
  assert.ok(paths.length >= 4, `expected the satellite workflows, found ${paths.length}`);
  for (const path of paths) {
    const text = readFileSync(path, "utf8");
    assert.deepEqual(checkWorkflowTriggers(text, path), [], path);
    assert.deepEqual(checkWorkflowShells(text, path), [], path);
    assert.deepEqual(checkWorkflowPlatformGates(text, path), [], path);
  }
});

test("a release tag cannot start the satellite branch CI", () => {
  const dir = dirname(workflowWiringPaths()[0]);
  for (const name of ["js-std-ci.yml", "js-os-ci.yml"]) {
    const path = join(dir, name);
    const text = readFileSync(path, "utf8");
    assert.match(text, /\n  push:\n    branches: \["\*\*"\]\n    paths:\n/, name);
    assert.equal(
      pushEventAllows(text, "refs/tags/v2026.11.14-r.1"),
      false,
      `${name} must not run for a tag push`,
    );
    assert.equal(
      pushEventAllows(text, "refs/heads/fix/node-lane-target"),
      true,
      `${name} must still run for a branch push`,
    );
  }
});

test("both js-cd copies still start on every release tag and not on a branch", () => {
  for (const path of workflowWiringPaths()) {
    const text = readFileSync(path, "utf8");
    for (const tag of [
      "v2026.11.14-r.1",
      "std/v2026.11.14-r.1",
      "js/v2026.11.14-r.1",
      "os/v2026.11.14-r.1",
    ]) {
      assert.equal(
        pushEventAllows(text, `refs/tags/${tag}`),
        true,
        `${path}: ${tag}`,
      );
    }
    assert.equal(
      pushEventAllows(text, "refs/heads/dev"),
      false,
      `${path}: a branch push must not publish`,
    );
  }
});

test("the trigger check rejects a CI workflow whose push filter lost branches", () => {
  const path = join(dirname(workflowWiringPaths()[0]), "js-std-ci.yml");
  const text = readFileSync(path, "utf8").replace(
    /^    branches: \["\*\*"\]\n/m,
    "",
  );
  assert.match(
    checkWorkflowTriggers(text, path).join("\n"),
    /push must declare branches; with only paths a tag push also starts CI/,
  );
});

test("the trigger check rejects a branches filter on js-cd for the right reason", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "  push:\n    tags:\n",
    '  push:\n    branches: ["**"]\n    tags:\n',
  );
  const errors = checkWorkflowTriggers(text, path).join("\n");
  // branches+tags still runs for a tag; it adds branch-triggered releases.
  assert.match(errors, /push must not declare branches; a branch push would run the release/);
  assert.doesNotMatch(errors, /stops tag releases/);
  assert.equal(pushEventAllows(text, "refs/tags/v2026.11.14-r.1"), true);
});

test("the trigger check requires a push trigger on branch CI", () => {
  const path = join(dirname(workflowWiringPaths()[0]), "js-std-ci.yml");
  const text = readFileSync(path, "utf8").replace(/^  push:\n(?:    .*\n)+/m, "");
  assert.match(
    checkWorkflowTriggers(text, path).join("\n"),
    /push trigger missing; branch CI must run on a branch push/,
  );
});

test("the trigger check rejects a branch filter that excludes everything", () => {
  const path = join(dirname(workflowWiringPaths()[0]), "js-std-ci.yml");
  const text = readFileSync(path, "utf8").replace(
    /^    branches: \["\*\*"\]$/m,
    '    branches: ["**", "!**"]',
  );
  assert.match(
    checkWorkflowTriggers(text, path).join("\n"),
    /push branches exclude every representative branch/,
  );
});

test("the trigger check applies ordered negation", () => {
  const path = join(dirname(workflowWiringPaths()[0]), "js-std-ci.yml");
  const text = readFileSync(path, "utf8").replace(
    /^    branches: \["\*\*"\]$/m,
    '    branches: ["**", "!dev"]',
  );
  assert.match(
    checkWorkflowTriggers(text, path).join("\n"),
    /push branches do not admit dev/,
  );

  assert.equal(refFiltersAllow(["**", "!dev"], "dev"), false);
  assert.equal(refFiltersAllow(["**", "!dev"], "rt-txiki"), true);
  // A later positive pattern re-includes a branch an earlier `!` removed.
  assert.equal(refFiltersAllow(["!dev", "**"], "dev"), true);
  assert.equal(refFiltersAllow(["**", "!**"], "dev"), false);
  assert.equal(refFiltersAllow(["!dev"], "dev"), false);
});

test("a paths-only push matches both branches and tags", () => {
  const pathsOnly = 'on:\n  push:\n    paths:\n      - "std/**"\n';
  assert.equal(pushEventAllows(pathsOnly, "refs/heads/dev"), true);
  assert.equal(
    pushEventAllows(pathsOnly, "refs/tags/v2026.11.14-r.1"),
    true,
    "GitHub ignores path filters for a tag push",
  );

  const tagsOnly = 'on:\n  push:\n    tags:\n      - "v*"\n';
  assert.equal(pushEventAllows(tagsOnly, "refs/tags/v2026.11.14-r.1"), true);
  assert.equal(pushEventAllows(tagsOnly, "refs/heads/dev"), false);

  const branchesOnly = 'on:\n  push:\n    branches: ["**"]\n';
  assert.equal(pushEventAllows(branchesOnly, "refs/heads/dev"), true);
  assert.equal(pushEventAllows(branchesOnly, "refs/tags/v2026.11.14-r.1"), false);

  const both = 'on:\n  push:\n    branches: ["**"]\n    tags:\n      - "v*"\n';
  assert.equal(pushEventAllows(both, "refs/heads/dev"), true);
  assert.equal(
    pushEventAllows(both, "refs/tags/v2026.11.14-r.1"),
    true,
    "branches alongside tags does not disable tag runs",
  );
});

test("the shell check accepts shell: bash after the run block", () => {
  const path = workflowWiringPaths()[0];
  let text = readFileSync(path, "utf8");
  text = text.replace(
    "      - name: Check the tag\n        shell: bash\n",
    "      - name: Check the tag\n",
  );
  text = text.replace("          esac\n", "          esac\n        shell: bash\n");
  assert.deepEqual(checkWorkflowShells(text, path), []);
});

test("the shell check rejects the tag guard without shell: bash", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "      - name: Check the tag\n        shell: bash\n",
    "      - name: Check the tag\n",
  );
  assert.match(
    checkWorkflowShells(text, path).join("\n"),
    /step "Check the tag" in Windows job "test" needs shell: bash/,
  );
});

test("both js-cd copies keep the reviewed Linux gate in a three-OS test job", () => {
  const paths = workflowWiringPaths();
  assert.ok(paths.length >= 1, "no js-cd.yml workflow found");
  for (const path of paths) {
    const text = readFileSync(path, "utf8");
    const step =
      /- name: Refuse a package that still contains tests\n(?:.*\n)*?        run: node eng\/scripts\/check-publish\.mjs\n/.exec(
        text,
      );
    assert.ok(step, `${path}: package preflight step missing`);
    const condition = /^\s*if: (.*)$/m.exec(step[0]);
    assert.ok(condition, `${path}: package preflight step has no if:`);
    assert.equal(
      normalizeGate(condition[1]),
      normalizeGate(LINUX_GATE),
      `${path}: package preflight must keep the reviewed Linux gate`,
    );
    assert.match(text, /^    runs-on: \$\{\{ matrix\.os \}\}$/m, path);
    assert.match(
      text,
      /^        os: \[ubuntu-24\.04, macos-latest, windows-latest\]$/m,
      path,
    );
    assert.deepEqual(checkWorkflowPlatformGates(text, path), [], path);
  }
});

test("the platform check accepts equivalent whitespace in the reviewed gate", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "if: ${{ !cancelled() && runner.os == 'Linux' }}",
    "if: ${{!cancelled()&&runner.os=='Linux'}}",
  );
  assert.deepEqual(checkWorkflowPlatformGates(text, path), []);
});

test("the platform check rejects an ungated package preflight in a Windows job", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "        if: ${{ !cancelled() && runner.os == 'Linux' }}\n",
    "",
  );
  const errors = checkWorkflowPlatformGates(text, path).join("\n");
  assert.match(
    errors,
    /step "Refuse a package that still contains tests" in job "test" must gate the package preflight with exactly/,
  );
  assert.match(errors, /got no if:/);
});

test("the platform check rejects a gate that excludes Linux", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "runner.os == 'Linux'",
    "runner.os != 'Linux'",
  );
  assert.match(
    checkWorkflowPlatformGates(text, path).join("\n"),
    /got if: \$\{\{ !cancelled\(\) && runner\.os != 'Linux' \}\}/,
  );
});

test("the platform check rejects an unknown github.ref_name inequality", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "        if: ${{ !cancelled() && runner.os == 'Linux' }}\n",
    "        if: ${{ github.ref_name != 'v2026.11.14-r.2' }}\n",
  );
  const errors = checkWorkflowPlatformGates(text, path).join("\n");
  assert.match(errors, /must gate the package preflight with exactly/);
  assert.match(errors, /github\.ref_name != 'v2026\.11\.14-r\.2'/);
});

test("the platform check rejects a folded if: block as unsupported", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "        if: ${{ !cancelled() && runner.os == 'Linux' }}\n",
    "        if: >-\n          !cancelled() &&\n          runner.os == 'Linux'\n",
  );
  const errors = checkWorkflowPlatformGates(text, path).join("\n");
  assert.match(errors, /must gate the package preflight with exactly/);
  assert.match(errors, /got if: >-/);
});

test("the platform check rejects a changed matrix label", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "os: [ubuntu-24.04, macos-latest, windows-latest]",
    "os: [ubuntu-22.04, macos-latest, windows-latest]",
  );
  assert.match(
    checkWorkflowPlatformGates(text, path).join("\n"),
    /must keep ubuntu-24\.04, macos-latest, windows-latest in its os matrix; found ubuntu-22\.04, macos-latest, windows-latest/,
  );
});

test("the platform check rejects matrix.exclude that could drop the Linux leg", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "        os: [ubuntu-24.04, macos-latest, windows-latest]\n",
    "        os: [ubuntu-24.04, macos-latest, windows-latest]\n        exclude:\n          - os: ubuntu-24.04\n",
  );
  assert.match(
    checkWorkflowPlatformGates(text, path).join("\n"),
    /must not use matrix\.exclude; the package preflight needs all of ubuntu-24\.04, macos-latest, windows-latest/,
  );
});

test("the platform check rejects an inline matrix.exclude too", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "        os: [ubuntu-24.04, macos-latest, windows-latest]\n",
    "        os: [ubuntu-24.04, macos-latest, windows-latest]\n        exclude: [{os: ubuntu-24.04}]\n",
  );
  assert.match(
    checkWorkflowPlatformGates(text, path).join("\n"),
    /must not use matrix\.exclude; the package preflight needs all of ubuntu-24\.04, macos-latest, windows-latest/,
  );
});

test("the platform check rejects a test job that does not run on matrix.os", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    "    runs-on: ${{ matrix.os }}",
    "    runs-on: windows-latest",
  );
  assert.match(
    checkWorkflowPlatformGates(text, path).join("\n"),
    /must run on \$\{\{ matrix\.os \}\} so the Linux gate is a real runner/,
  );
});

test("the platform check refuses a release that dropped the package preflight", () => {
  const path = workflowWiringPaths()[0];
  const text = readFileSync(path, "utf8").replace(
    /- name: Refuse a package that still contains tests\n(?:.*\n)*?        run: node eng\/scripts\/check-publish\.mjs\n/,
    "",
  );
  assert.doesNotMatch(text, /check-publish\.mjs/);
  assert.match(
    checkWorkflowPlatformGates(text, path).join("\n"),
    /must run node eng\/scripts\/check-publish\.mjs on the ubuntu-24\.04 leg/,
  );
});

test("the branch glob keeps GitHub's slash rule", () => {
  assert.equal(githubGlobMatches("**", "fix/node-lane-target"), true);
  assert.equal(githubGlobMatches("*", "fix/node-lane-target"), false);
  assert.equal(githubGlobMatches("plab-js-lib", "plab-js-lib"), true);
  assert.equal(githubGlobMatches("plab-js-lib", "dev"), false);
  assert.equal(githubGlobMatches("rt-*", "rt-txiki"), true);
  assert.equal(githubGlobMatches("rt-*", "rt/feature"), false);
});

test("the Linux txiki steps capture the wrapper path and prepend its directory", () => {
  const paths = jsWorkflowPaths().filter((path) =>
    /js-(?:std|os)-ci\.yml$/.test(path)
  );
  assert.ok(paths.length >= 2, "expected std and os CI workflows");
  for (const path of paths) {
    const text = readFileSync(path, "utf8");
    assert.match(
      text,
      /TXIKI_BIN="\$\(eng\/scripts\/build-txiki\.sh\)"/,
      `${path}: wrapper call missing`,
    );
    assert.match(
      text,
      /echo "TXIKI_BIN=\$TXIKI_BIN" >> "\$GITHUB_ENV"/,
      `${path}: env export missing`,
    );
    assert.match(
      text,
      /PATH="\$\(dirname "\$TXIKI_BIN"\):\$PATH"/,
      `${path}: binary directory missing from PATH`,
    );
    assert.doesNotMatch(
      text,
      /PATH="\$TXIKI_BIN:/,
      `${path}: the binary path must not be used as a directory`,
    );
  }
});

test("the Linux txiki build and test steps include the pull-request base ref", () => {
  const paths = jsWorkflowPaths().filter((path) => /js-(?:std|os)-ci\.yml$/.test(path));
  assert.ok(paths.length >= 2, "expected std and os CI workflows");
  for (const path of paths) {
    assert.deepEqual(
      checkWorkflowTxikiBaseRefs(readFileSync(path, "utf8"), path),
      [],
      path,
    );
  }
});

// True when this checkout keeps the root copies beside the published prefix
// instead of being the prefix itself.
function inMonorepo() {
  const root = spawnSync(
    "git",
    ["-C", satelliteRoot(), "rev-parse", "--show-toplevel"],
    { encoding: "utf8" },
  );
  return root.status === 0 && resolve(root.stdout.trim()) !== satelliteRoot();
}

test("a workflow is classified by the prefix layout, not by a path substring", () => {
  const satelliteWorkflows = join(satelliteRoot(), ".github", "workflows");
  assert.equal(
    workflowLayout(join(satelliteWorkflows, "js-std-ci.yml")),
    "satellite",
  );

  // A second `js/lib` inside the prefix is not the prefix's own workflow
  // directory, so it is the root copy in either checkout layout.
  assert.equal(
    workflowLayout(
      join(satelliteRoot(), "js", "lib", ".github", "workflows", "js-std-ci.yml"),
    ),
    "root",
  );

  const layouts = [...new Set(jsWorkflowPaths().map(workflowLayout))].sort();
  // The monorepo has its own copies beside the prefix; a flattened satellite
  // has only the prefix, which now sits at the repository root.
  const monorepo = inMonorepo();
  assert.deepEqual(layouts, monorepo ? ["root", "satellite"] : ["satellite"]);
  assert.equal(workflowWiringPaths().length, monorepo ? 2 : 1);
});

test("the txiki base-ref check rejects a satellite copy that drops dev", () => {
  const path = join(satelliteRoot(), ".github", "workflows", "js-std-ci.yml");
  const text = readFileSync(path, "utf8").replaceAll(
    " || github.base_ref == 'dev'",
    "",
  );
  assert.match(
    checkWorkflowTxikiBaseRefs(text, path).join("\n"),
    /must include the pull-request base ref github\.base_ref == 'dev'/,
  );
});

// Rewrite the satellite ref list to the root list, so the root rule can be
// checked from a satellite checkout where the root copies do not exist.
function rootShaped(text) {
  return text
    .replaceAll(
      "github.ref_name == 'dev' || github.head_ref == 'dev' || github.base_ref == 'dev' ||\n",
      "",
    )
    .replaceAll(
      "github.ref_name == 'rt-txiki' || github.head_ref == 'rt-txiki' || github.base_ref == 'rt-txiki'\n",
      "",
    )
    .replaceAll(
      "github.ref_name == 'plab-js-lib' || github.head_ref == 'plab-js-lib' || github.base_ref == 'plab-js-lib' ||\n",
      "github.ref_name == 'plab-js-lib' || github.head_ref == 'plab-js-lib' || github.base_ref == 'plab-js-lib'\n",
    );
}

test("the txiki base-ref check rejects a root copy that widens to dev", () => {
  const path = join(satelliteRoot(), ".github", "workflows", "js-std-ci.yml");
  // Start from a root-shaped copy: only the monorepo branch, no satellite
  // branches. Then widen it and prove the satellite refs are refused.
  const shaped = rootShaped(readFileSync(path, "utf8"));
  assert.deepEqual(checkWorkflowTxikiBaseRefs(shaped, path, "root"), []);

  const widened = shaped.replaceAll(
    "github.base_ref == 'plab-js-lib'",
    "github.base_ref == 'plab-js-lib' || github.base_ref == 'dev' || github.base_ref == 'rt-txiki'",
  );
  const errors = checkWorkflowTxikiBaseRefs(widened, path, "root").join("\n");
  assert.match(
    errors,
    /root copy step .* must not include github\.base_ref == 'dev'/,
  );
  assert.match(
    errors,
    /root copy step .* must not include github\.base_ref == 'rt-txiki'/,
  );
});

test("the txiki base-ref check rejects a missing plab-js-lib base ref", () => {
  const path = join(satelliteRoot(), ".github", "workflows", "js-os-ci.yml");
  const text = readFileSync(path, "utf8").replaceAll(
    " || github.base_ref == 'plab-js-lib'",
    "",
  );
  assert.match(
    checkWorkflowTxikiBaseRefs(text, path, "satellite").join("\n"),
    /must include the pull-request base ref github\.base_ref == 'plab-js-lib'/,
  );
});

test("the txiki base-ref check rejects a ref disabled with && false", () => {
  const path = join(satelliteRoot(), ".github", "workflows", "js-std-ci.yml");
  const text = readFileSync(path, "utf8").replaceAll(
    "github.base_ref == 'dev'",
    "github.base_ref == 'dev' && false",
  );
  assert.match(
    checkWorkflowTxikiBaseRefs(text, path).join("\n"),
    /unsupported syntax in its if: condition/,
  );
});

test("the txiki base-ref check rejects && false on the root branch", () => {
  const path = join(satelliteRoot(), ".github", "workflows", "js-os-ci.yml");
  const text = rootShaped(readFileSync(path, "utf8")).replaceAll(
    "github.base_ref == 'plab-js-lib'",
    "github.base_ref == 'plab-js-lib' && false",
  );
  assert.match(
    checkWorkflowTxikiBaseRefs(text, path, "root").join("\n"),
    /unsupported syntax in its if: condition/,
  );
});

test("the txiki base-ref check does not count a comment inside the condition", () => {
  const path = join(satelliteRoot(), ".github", "workflows", "js-std-ci.yml");
  const text = readFileSync(path, "utf8").replaceAll(
    "github.base_ref == 'dev'",
    "# github.base_ref == 'dev'",
  );
  assert.match(
    checkWorkflowTxikiBaseRefs(text, path).join("\n"),
    /unsupported syntax in its if: condition/,
  );
});

test("the txiki base-ref check does not count a comment above the condition", () => {
  const path = join(satelliteRoot(), ".github", "workflows", "js-std-ci.yml");
  const missing = readFileSync(path, "utf8").replaceAll(
    " || github.base_ref == 'dev'",
    "",
  );
  const text = missing.replace(
    /(- name: Build pinned txiki\.js [^\n]+ for Linux\n)(\s+)(if: >-)/,
    "$1$2# github.base_ref == 'dev'\n$2$3",
  );
  assert.match(
    checkWorkflowTxikiBaseRefs(text, path).join("\n"),
    /must include the pull-request base ref github\.base_ref == 'dev'/,
  );
});

test("the txiki base-ref check does not count a root comment either", () => {
  const path = join(satelliteRoot(), ".github", "workflows", "js-std-ci.yml");
  const shaped = rootShaped(readFileSync(path, "utf8")).replaceAll(
    " || github.base_ref == 'plab-js-lib'",
    "",
  );
  const text = shaped.replace(
    /(- name: Build pinned txiki\.js [^\n]+ for Linux\n)(\s+)(if: >-)/,
    "$1$2# github.base_ref == 'plab-js-lib'\n$2$3",
  );
  assert.match(
    checkWorkflowTxikiBaseRefs(text, path, "root").join("\n"),
    /must include the pull-request base ref github\.base_ref == 'plab-js-lib'/,
  );
});

// A flattened satellite is the published prefix at the repository root: the
// js workflows and the scripts that check them. Only the layout matters, so
// the copy leaves out the rest of the tree and has no .git directory.
function copyFlattenedCheckout(root) {
  mkdirSync(join(root, ".github"), { recursive: true });
  cpSync(
    join(satelliteRoot(), ".github", "workflows"),
    join(root, ".github", "workflows"),
    { recursive: true },
  );
  const scripts = join(root, "eng", "scripts");
  mkdirSync(scripts, { recursive: true });
  for (const entry of readdirSync(join(satelliteRoot(), "eng", "scripts"))) {
    if (!entry.endsWith(".mjs")) continue;
    copyFileSync(
      join(satelliteRoot(), "eng", "scripts", entry),
      join(scripts, entry),
    );
  }
}

test("the wiring test passes in a flattened satellite checkout", (t) => {
  if (process.env.PLAB_WORKFLOW_WIRING_SIMULATION === "1") {
    t.skip("inner run of the flattened checkout simulation");
    return;
  }

  const root = mkdtempSync(join(tmpdir(), "plab-js-lib-satellite-"));
  try {
    copyFlattenedCheckout(root);
    // A test file runs with NODE_TEST_CONTEXT=child-v8. Strip it so the nested
    // runner starts the file as an ordinary `node --test`, not as a child of
    // the runner that is already executing this one.
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(
      process.execPath,
      ["--test", join("eng", "scripts", "workflow-wiring.test.mjs")],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...env,
          // The temporary tree is not a git checkout. Stop git from finding
          // an enclosing repository above it and treating that as the root.
          GIT_CEILING_DIRECTORIES: root,
          PLAB_WORKFLOW_WIRING_SIMULATION: "1",
          PLAB_WORKFLOW_WIRING_LAYOUT: "satellite",
        },
      },
    );
    assert.equal(
      result.status,
      0,
      `flattened checkout failed\n${result.stdout}\n${result.stderr}`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the checkout under test reports the layout the harness expects", () => {
  const expected = process.env.PLAB_WORKFLOW_WIRING_LAYOUT;
  if (!expected) return;
  const paths = workflowWiringPaths();
  assert.equal(
    paths.length,
    expected === "satellite" ? 1 : 2,
    `${expected} layout must discover the expected number of js-cd copies`,
  );
  for (const path of paths) {
    assert.equal(workflowLayout(path), expected, path);
  }
});
