import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  LINUX_GATE,
  checkWorkflowPlatformGates,
  checkWorkflowShells,
  checkWorkflowTriggers,
  checkWorkflowWiring,
  githubGlobMatches,
  jsWorkflowPaths,
  normalizeGate,
  pushEventAllows,
  refFiltersAllow,
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
