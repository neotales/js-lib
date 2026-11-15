import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  checkWorkflowShells,
  checkWorkflowTriggers,
  checkWorkflowWiring,
  githubGlobMatches,
  jsWorkflowPaths,
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

test("every js workflow passes the tag-trigger and Windows-shell rules", () => {
  const paths = jsWorkflowPaths();
  assert.ok(paths.length >= 4, `expected the satellite workflows, found ${paths.length}`);
  for (const path of paths) {
    const text = readFileSync(path, "utf8");
    assert.deepEqual(checkWorkflowTriggers(text, path), [], path);
    assert.deepEqual(checkWorkflowShells(text, path), [], path);
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

test("the branch glob keeps GitHub's slash rule", () => {
  assert.equal(githubGlobMatches("**", "fix/node-lane-target"), true);
  assert.equal(githubGlobMatches("*", "fix/node-lane-target"), false);
  assert.equal(githubGlobMatches("plab-js-lib", "plab-js-lib"), true);
  assert.equal(githubGlobMatches("plab-js-lib", "dev"), false);
  assert.equal(githubGlobMatches("rt-*", "rt-txiki"), true);
  assert.equal(githubGlobMatches("rt-*", "rt/feature"), false);
});
