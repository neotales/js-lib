// Check that js-cd.yml exposes the coordinator's plan outputs and that the
// publish matrix consumes them. A missing step id or job outputs mapping makes
// needs.plan.outputs.* empty and silently skips every publish job.
//
// The check reads the workflow as text. It is deliberately dependency-free so
// it runs in the same Node gate as the release scripts.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TAG_TRIGGERS = [
  "v[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]-r.[0-9]*",
  "std/v[0-9]*",
  "js/v[0-9]*",
  "os/v[0-9]*",
];

const OUTPUT_KEYS = ["has_areas", "matrix", "plan"];

export function workflowWiringPaths() {
  const satellite = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const satelliteWorkflow = join(satellite, ".github/workflows/js-cd.yml");
  const paths = [satelliteWorkflow];

  const root = spawnSync(
    "git",
    ["-C", satellite, "rev-parse", "--show-toplevel"],
    { encoding: "utf8" },
  );
  if (root.status === 0 && root.stdout.trim()) {
    const rootWorkflow = join(
      resolve(root.stdout.trim()),
      ".github/workflows/js-cd.yml",
    );
    if (rootWorkflow !== satelliteWorkflow) paths.push(rootWorkflow);
  }
  return paths.filter((path) => existsSync(path));
}

function jobBlock(lines, name) {
  const start = lines.findIndex((line) => line === `  ${name}:`);
  if (start === -1) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end);
}

function indentedMap(block, key, indent) {
  const start = block.findIndex((line) => line === `${indent}${key}:`);
  if (start === -1) return null;
  const map = new Map();
  for (let index = start + 1; index < block.length; index++) {
    const line = block[index];
    if (!line.startsWith(`${indent}  `)) break;
    const match = new RegExp(
      `^${indent}  ([A-Za-z0-9_-]+):\\s*(.*)$`,
    ).exec(line);
    if (match) map.set(match[1], match[2].trim());
  }
  return map;
}

function stepBlock(block, name) {
  const start = block.findIndex((line) => line.trim() === `- name: ${name}`);
  if (start === -1) return null;
  let end = block.length;
  for (let index = start + 1; index < block.length; index++) {
    if (block[index].startsWith("      - ")) {
      end = index;
      break;
    }
  }
  return block.slice(start, end);
}

function stepId(step) {
  for (const line of step) {
    const match = /^        id:\s*(\S+)\s*$/.exec(line);
    if (match) return match[1];
  }
  return null;
}

export function checkWorkflowWiring(text, label = "workflow") {
  const errors = [];
  const lines = text.split("\n");

  if (basename(label) !== "js-cd.yml") {
    errors.push(`${label}: expected a js-cd.yml workflow`);
  }
  if (!/^name: js cd$/m.test(text)) {
    errors.push(`${label}: workflow name must be js cd`);
  }
  for (const tag of TAG_TRIGGERS) {
    if (!lines.includes(`      - "${tag}"`)) {
      errors.push(`${label}: missing tag trigger ${tag}`);
    }
  }

  const plan = jobBlock(lines, "plan");
  const publish = jobBlock(lines, "publish");
  if (!plan) {
    errors.push(`${label}: plan job missing`);
    return errors;
  }
  if (!publish) {
    errors.push(`${label}: publish job missing`);
    return errors;
  }
  const planText = plan.join("\n");
  const publishText = publish.join("\n");

  if (!/permissions:\s*\n\s+contents:\s*read/.test(planText)) {
    errors.push(`${label}: plan job must request contents: read`);
  }
  if (/id-token:\s*write/.test(planText)) {
    errors.push(`${label}: plan job must not request id-token: write`);
  }
  if (!/environment:\s*production/.test(publishText)) {
    errors.push(`${label}: publish job must use environment production`);
  }
  if (!/id-token:\s*write/.test(publishText)) {
    errors.push(`${label}: publish job must request id-token: write`);
  }
  if (!/^\s{4}needs:\s*plan\s*$/m.test(publishText)) {
    errors.push(`${label}: publish job must need plan`);
  }
  if (!/needs\.plan\.outputs\.has_areas\s*==\s*'true'/.test(publishText)) {
    errors.push(`${label}: publish job must gate on needs.plan.outputs.has_areas`);
  }
  if (!/fromJson\(\s*needs\.plan\.outputs\.matrix/.test(publishText)) {
    errors.push(`${label}: publish matrix must use needs.plan.outputs.matrix`);
  }
  if (!/RELEASE_PLAN:\s*\$\{\{\s*needs\.plan\.outputs\.plan\s*\}\}/.test(publishText)) {
    errors.push(`${label}: publish job must receive needs.plan.outputs.plan`);
  }
  if (!/publish\.mjs publish --area .*--expect-plan/.test(publishText)) {
    errors.push(`${label}: publish step must use --area and --expect-plan`);
  }

  const outputs = indentedMap(plan, "outputs", "    ");
  const step = stepBlock(plan, "Plan the release (no upload)");
  const id = step ? stepId(step) : null;
  if (!step) errors.push(`${label}: planner step missing`);
  if (!id) errors.push(`${label}: planner step has no id`);
  if (!step || !step.some((line) => /release-coordinator\.mjs plan/.test(line))) {
    errors.push(`${label}: planner step does not run the coordinator`);
  }
  if (!outputs) {
    errors.push(`${label}: plan job has no outputs`);
  } else {
    for (const key of OUTPUT_KEYS) {
      const value = outputs.get(key);
      if (!value) {
        errors.push(`${label}: plan job output ${key} is missing`);
      } else if (id && !value.includes(`steps.${id}.outputs.${key}`)) {
        errors.push(
          `${label}: plan job output ${key} is not steps.${id}.outputs.${key}`,
        );
      } else if (!id && !/^steps\.[A-Za-z0-9_-]+\.outputs\./.test(value)) {
        errors.push(`${label}: plan job output ${key} has no step reference`);
      }
    }
  }
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const paths = (args.length > 0 ? args : workflowWiringPaths()).map((path) =>
    resolve(path),
  );
  if (paths.length === 0) {
    console.error("no js-cd.yml workflow found");
    process.exit(1);
  }
  let failed = 0;
  for (const path of paths) {
    const errors = checkWorkflowWiring(readFileSync(path, "utf8"), path);
    for (const error of errors) console.error(error);
    failed += errors.length;
  }
  if (failed > 0) process.exit(1);
  console.log(
    `workflow wiring ok (${paths.length} file${paths.length === 1 ? "" : "s"})`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
