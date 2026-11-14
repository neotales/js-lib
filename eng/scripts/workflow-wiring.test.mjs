import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  checkWorkflowWiring,
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
