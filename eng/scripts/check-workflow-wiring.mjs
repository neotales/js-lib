// Check the js workflows. The wiring check proves js-cd.yml exposes the
// coordinator's plan outputs and that the publish matrix consumes them: a
// missing step id or job outputs mapping makes needs.plan.outputs.* empty and
// silently skips every publish job. The trigger check proves a release tag
// starts js-cd.yml only. The shell check proves a Windows job's `run:` block
// asks for bash instead of the default PowerShell. The platform check proves
// the npm package preflight carries the one reviewed Linux gate inside a
// three-OS matrix, because spawnSync("npm") is ENOENT on Windows where npm is
// npm.cmd. The base-ref check proves the Linux txiki steps also run for a pull
// request, which selects a workflow with github.base_ref rather than
// github.ref_name.
//
// The check reads the workflow as text. It is deliberately dependency-free so
// it runs in the same Node gate as the release scripts.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TAG_TRIGGERS = [
  "v[0-9][0-9][0-9][0-9].[0-9][0-9].[0-9][0-9]-r.[0-9]*",
  "std/v[0-9]*",
  "js/v[0-9]*",
  "os/v[0-9]*",
];

const OUTPUT_KEYS = ["has_areas", "matrix", "plan"];

// One sample per tag family js-cd.yml accepts. A tag starts the release and
// must not start a branch workflow.
const TAG_SAMPLES = [
  "v2026.11.14-r.1",
  "std/v2026.11.14-r.1",
  "js/v2026.11.14-r.1",
  "os/v2026.11.14-r.1",
];

// Shell syntax that PowerShell parses differently. On a Windows runner the
// default shell is PowerShell, so a block scalar or one of these constructs
// needs an explicit `shell: bash`.
const BASH_ISMS = /set -euo pipefail|\bcase\s+[^\n]*\bin\b|\besac\b|\[\[|(^|[\s;])fi([\s;]|$)/;

// The package preflight shells out to npm, which is npm.cmd on Windows and is
// not resolved without a shell, so spawnSync("npm") is ENOENT there. Package
// contents do not depend on the runner OS. The reviewed gate is the exact
// expression js-std-ci.yml and js-os-ci.yml already use, and the test job
// keeps a three-OS matrix so the Linux leg is always present. This checker
// compares that one expression and matrix; it does not interpret GitHub
// expressions, so a rewrite must be reviewed here rather than guessed at.
const PACKAGE_PREFLIGHT = "node eng/scripts/check-publish.mjs";
export const LINUX_GATE = "${{ !cancelled() && runner.os == 'Linux' }}";
const REQUIRED_MATRIX_OS = ["ubuntu-24.04", "macos-latest", "windows-latest"];

// Branch names a CI push filter must admit. `fix/...` proves `**` and `*`
// differ; `rt-*` is the runtime-branch convention; `dev` and `plab-js-lib` are
// the integration names. The root copies are intentionally scoped to
// plab-js-lib only, so they are checked against that one name.
const REPRESENTATIVE_BRANCHES = [
  "dev",
  "plab-js-lib",
  "rt-txiki",
  "fix/node-lane-target",
];
const ROOT_REPRESENTATIVE_BRANCHES = ["plab-js-lib"];

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

// Every js workflow in the satellite and, when this checkout is the monorepo,
// the root copy that publishes and tests js/lib.
export function jsWorkflowPaths() {
  const satellite = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const dirs = [join(satellite, ".github/workflows")];
  const root = spawnSync(
    "git",
    ["-C", satellite, "rev-parse", "--show-toplevel"],
    { encoding: "utf8" },
  );
  if (root.status === 0 && root.stdout.trim()) {
    dirs.push(join(resolve(root.stdout.trim()), ".github/workflows"));
  }
  const seen = new Set();
  const paths = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (!/^js-.*\.ya?ml$/.test(entry)) continue;
      const path = join(dir, entry);
      if (seen.has(path)) continue;
      seen.add(path);
      paths.push(path);
    }
  }
  return paths.sort();
}

function indentOf(line) {
  return line.length - line.trimStart().length;
}

// The header line and everything more indented than parentIndent.
function sectionAfter(lines, index, parentIndent) {
  const out = [lines[index]];
  for (let cursor = index + 1; cursor < lines.length; cursor++) {
    const line = lines[cursor];
    if (line.trim() === "") {
      out.push(line);
      continue;
    }
    if (indentOf(line) <= parentIndent) break;
    out.push(line);
  }
  return out;
}

// A `branches:` or `tags:` list, inline or block form.
function filterList(section, key) {
  const start = section.findIndex((line) => {
    const trimmed = line.trimStart();
    return indentOf(line) === 4 && trimmed.startsWith(`${key}:`);
  });
  if (start === -1) return null;
  const rest = section[start].trimStart().slice(key.length + 1).trim();
  const unquote = (value) =>
    value.trim().replace(/^["']/, "").replace(/["']$/, "");
  if (rest.startsWith("[")) {
    return rest
      .replace(/^\[/, "")
      .replace(/\]\s*$/, "")
      .split(",")
      .map(unquote)
      .filter(Boolean);
  }
  if (rest) return [unquote(rest.replace(/\s+#.*$/, ""))];
  const values = [];
  for (let index = start + 1; index < section.length; index++) {
    const line = section[index];
    if (line.trim() === "") continue;
    if (indentOf(line) <= 4) break;
    const match = /^\s*-\s*(.+)$/.exec(line);
    if (match) values.push(unquote(match[1].replace(/\s+#.*$/, "")));
  }
  return values;
}

// GitHub ref glob: `*` and `?` stop at `/`, `**` crosses it, `[...]` is a
// character class. Used to prove a branch filter never matches a tag name.
export function githubGlobMatches(pattern, value) {
  let source = "^";
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index];
    if (char === "*") {
      if (pattern[index + 1] === "*") {
        source += ".*";
        index++;
      } else {
        source += "[^/]*";
      }
    } else if (char === "?") {
      source += "[^/]";
    } else if (char === "[") {
      const end = pattern.indexOf("]", index + 1);
      if (end === -1) {
        source += "\\[";
      } else {
        source += pattern.slice(index, end + 1);
        index = end;
      }
    } else {
      source += char.replace(/[.+^${}()|\\]/g, "\\$&");
    }
  }
  return new RegExp(`${source}$`).test(value);
}

// Ordered branch/tag filter: a positive match includes, a later `!` match
// excludes, and a still later positive match includes again. A list with no
// positive pattern selects nothing, so `["**", "!**"]` excludes every ref.
export function refFiltersAllow(patterns, name) {
  let allowed = false;
  for (const pattern of patterns) {
    if (pattern.startsWith("!")) {
      if (githubGlobMatches(pattern.slice(1), name)) allowed = false;
    } else if (githubGlobMatches(pattern, name)) {
      allowed = true;
    }
  }
  return allowed;
}

// Would a push event with this `on.push` block start the workflow for ref?
// GitHub matches `branches` against branch names and `tags` against tag names.
// If only one is defined, the other ref type does not trigger at all. With
// neither, a `paths` filter alone matches branches and tags.
export function pushEventAllows(text, ref) {
  const lines = text.split("\n");
  const onIndex = lines.findIndex((line) => line === "on:");
  if (onIndex === -1) return false;
  const onSection = sectionAfter(lines, onIndex, 0);
  const pushIndex = onSection.findIndex(
    (line) => indentOf(line) === 2 && line.trim() === "push:",
  );
  if (pushIndex === -1) return false;
  const push = sectionAfter(onSection, pushIndex, 2);
  const branches = filterList(push, "branches");
  const tags = filterList(push, "tags");
  // A paths-only push declares no ref filter at all. GitHub then starts the
  // workflow for branch and tag pushes, and a tag push ignores `paths`
  // entirely. That is why a CI workflow needs an explicit `branches`.
  if (!branches && !tags) return true;
  const isTag = ref.startsWith("refs/tags/");
  const name = ref.replace(/^refs\/(tags|heads)\//, "");
  if (isTag) {
    if (!tags) return false;
    return refFiltersAllow(tags, name);
  }
  if (!branches) return false;
  return refFiltersAllow(branches, name);
}

// The published prefix root: `js/lib` in the monorepo, the repository root in
// a flattened satellite checkout. Derived from this module's own location, so
// a copy of the prefix classifies itself correctly.
export function satelliteRoot() {
  return resolve(fileURLToPath(new URL("../..", import.meta.url)));
}

// Which copy a workflow is. The published prefix keeps its own workflows in
// `<prefix>/.github/workflows`; the monorepo root keeps the copies that build
// and publish `js/lib` in `<repo>/.github/workflows`. The prefix root comes
// from this module's own location, so in a flattened satellite checkout the
// repository root is the prefix root and its workflows are still the
// satellite's. A substring test such as `includes("js/lib/.github")` is false
// there and misclassifies every satellite workflow as the root copy.
export function workflowLayout(label) {
  const rel = relative(
    join(satelliteRoot(), ".github", "workflows"),
    resolve(label),
  );
  const inside =
    rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
  return inside ? "satellite" : "root";
}

function satelliteCopy(label) {
  return workflowLayout(label) === "satellite";
}

// Trigger regression: a release tag must start js-cd.yml only. Every other js
// workflow that pushes must declare `branches`, because `paths` alone also
// matches tags. js-cd.yml must keep `tags` and must not declare `branches`.
export function checkWorkflowTriggers(text, label = "workflow") {
  const errors = [];
  const name = basename(label);
  const lines = text.split("\n");
  const onIndex = lines.findIndex((line) => line === "on:");
  if (onIndex === -1) {
    errors.push(`${label}: no on: triggers`);
    return errors;
  }
  const onSection = sectionAfter(lines, onIndex, 0);
  const pushIndex = onSection.findIndex(
    (line) => indentOf(line) === 2 && line.trim() === "push:",
  );
  const push = pushIndex === -1 ? null : sectionAfter(onSection, pushIndex, 2);
  const isCd = name === "js-cd.yml";
  const branchCi = name === "js-std-ci.yml" || name === "js-os-ci.yml";

  if (isCd) {
    if (!push) {
      errors.push(`${label}: js-cd.yml must trigger on tag pushes`);
      return errors;
    }
    const tags = filterList(push, "tags");
    const branches = filterList(push, "branches");
    if (!tags) {
      errors.push(`${label}: push must declare tags; js-cd.yml releases only from a tag`);
    } else {
      for (const tag of TAG_TRIGGERS) {
        if (!tags.includes(tag)) {
          errors.push(`${label}: missing tag trigger ${tag}`);
        }
      }
    }
    if (branches) {
      errors.push(
        `${label}: push must not declare branches; a branch push would run the release`,
      );
    }
    for (const tag of TAG_SAMPLES) {
      const ref = `refs/tags/${tag}`;
      if (!pushEventAllows(text, ref)) {
        errors.push(`${label}: ${ref} must start the release`);
      }
    }
    if (pushEventAllows(text, "refs/heads/dev")) {
      errors.push(`${label}: a branch push must not start the release`);
    }
    return errors;
  }

  if (branchCi && !push) {
    errors.push(
      `${label}: push trigger missing; branch CI must run on a branch push`,
    );
  }
  if (push) {
    const branches = filterList(push, "branches");
    const tags = filterList(push, "tags");
    if (tags) {
      errors.push(`${label}: push must not declare tags; tags release through js-cd.yml`);
    }
    if (!branches) {
      errors.push(`${label}: push must declare branches; with only paths a tag push also starts CI`);
    } else if (!branches.some((pattern) => !pattern.startsWith("!"))) {
      errors.push(
        `${label}: push branches need at least one positive pattern; a negated-only list selects nothing`,
      );
    } else {
      const required = satelliteCopy(label)
        ? REPRESENTATIVE_BRANCHES
        : ROOT_REPRESENTATIVE_BRANCHES;
      const missing = required.filter(
        (branch) => !refFiltersAllow(branches, branch),
      );
      if (missing.length === required.length) {
        errors.push(
          `${label}: push branches exclude every representative branch (${required.join(", ")}); an ordered negation can cancel an earlier match`,
        );
      } else if (missing.length > 0) {
        errors.push(
          `${label}: push branches do not admit ${missing.join(", ")}`,
        );
      }
    }
    for (const tag of TAG_SAMPLES) {
      const ref = `refs/tags/${tag}`;
      if (pushEventAllows(text, ref)) {
        errors.push(`${label}: ${ref} must not start CI; it releases through js-cd.yml`);
      }
    }
  }
  if (
    (name === "js-std-ci.yml" || name === "js-os-ci.yml") &&
    !onSection.some((line) => indentOf(line) === 2 && line.trim() === "pull_request:")
  ) {
    errors.push(`${label}: pull_request trigger missing`);
  }
  return errors;
}

function findStepStart(lines, runIndex, lowerBound) {
  const runIndent = indentOf(lines[runIndex]);
  for (let index = runIndex - 1; index >= lowerBound; index--) {
    const match = /^(\s*)-\s/.exec(lines[index]);
    if (match && match[1].length < runIndent) return index;
  }
  return -1;
}

// The whole step, including keys that follow its `run:` block. `shell:` may
// legally come after `run:` in YAML, and that still selects bash.
function findStepEnd(lines, stepIndex, upperBound) {
  const stepIndent = indentOf(lines[stepIndex]);
  for (let index = stepIndex + 1; index < upperBound; index++) {
    const match = /^(\s*)-\s/.exec(lines[index]);
    if (match && match[1].length <= stepIndent) return index;
  }
  return upperBound;
}

function stepName(step) {
  const nameLine = step.find((line) => /^\s*-\s*name:/.test(line)) ?? "";
  return (
    nameLine.replace(/^\s*-\s*name:\s*/, "").replace(/^["']|["']$/g, "") ||
    "unnamed step"
  );
}

// The single-line `if:` value of a step, or null when it has none. A folded or
// literal block scalar is not unfolded: the gate is one reviewed line, and a
// block form is refused like any other unproven expression.
function stepIf(step) {
  const line = step.find((entry) => /^\s*if:/.test(entry));
  if (line === undefined) return null;
  return line.trimStart().slice("if:".length).trim();
}

// Shell regression: in a job whose matrix runs windows-latest, a multi-line
// `run` block, or one using bash-only syntax, must set `shell: bash`.
// Otherwise Windows runs it under PowerShell and the parser fails before the
// first command.
export function checkWorkflowShells(text, label = "workflow") {
  const errors = [];
  const lines = text.split("\n");
  const jobsIndex = lines.findIndex((line) => line === "jobs:");
  if (jobsIndex === -1) return [`${label}: no jobs:`];
  const headers = [];
  for (let index = jobsIndex + 1; index < lines.length; index++) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[index])) headers.push(index);
  }
  headers.push(lines.length);
  for (let header = 0; header < headers.length - 1; header++) {
    const start = headers[header];
    const end = headers[header + 1];
    const jobText = lines.slice(start, end).join("\n");
    if (!/windows-latest/.test(jobText)) continue;
    const jobName = lines[start].trim().replace(/:$/, "");
    for (let index = start; index < end; index++) {
      const match = /^(\s*)run:\s*(.*)$/.exec(lines[index]);
      if (!match) continue;
      const stepStart = findStepStart(lines, index, start);
      if (stepStart === -1) continue;
      const step = lines.slice(stepStart, findStepEnd(lines, stepStart, end));
      if (step.some((line) => /^\s*shell:\s*bash\s*$/.test(line))) continue;
      const value = match[2].trim();
      const blockScalar = /^[|>][+-]?$/.test(value);
      if (!blockScalar && !BASH_ISMS.test(value)) continue;
      errors.push(
        `${label}: step "${stepName(step)}" in Windows job "${jobName}" needs shell: bash; the Windows default is PowerShell`,
      );
    }
  }
  return errors;
}

// Collapse whitespace around the operators of the one gate expression so
// `${{!cancelled()&&runner.os=='Linux'}}` matches the reviewed form, while
// anything else (a different operator, path, operand, or a block scalar) does
// not. Returning null means the value is not a `${{ ... }}` expression.
export function normalizeGate(condition) {
  if (condition === null) return null;
  const wrapped = /^\$\{\{([\s\S]*)\}\}$/.exec(condition);
  if (!wrapped) return null;
  return wrapped[1]
    .trim()
    .replace(/\s*(&&|\|\||==|!=)\s*/g, "$1")
    .replace(/\s*([!()])\s*/g, "$1");
}

const LINUX_GATE_NORMALIZED = normalizeGate(LINUX_GATE);

// The inline os list of a job matrix, or null.
function matrixOs(job) {
  const line = job.find((entry) => /^\s+os:\s*\[.*\]\s*(?:#.*)?$/.test(entry));
  if (line === undefined) return null;
  return line
    .replace(/^\s*os:\s*\[/, "")
    .replace(/\]\s*(?:#.*)?$/, "")
    .split(",")
    .map((value) => value.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

// An `exclude:` can drop a required leg without changing the os list, so the
// required matrix refuses the key whatever its value: a block list, an inline
// flow list, or a single mapping. `include:` is not supported either, but it
// can only add legs, so it is not refused here.
function matrixExcludes(job) {
  if (/matrix:[^\n]*\bexclude\s*:/.test(job.join("\n"))) return true;
  const matrixIndex = job.findIndex((line) => /^\s+matrix:\s*$/.test(line));
  if (matrixIndex === -1) return false;
  const indent = indentOf(job[matrixIndex]);
  for (let index = matrixIndex + 1; index < job.length; index++) {
    const line = job[index];
    if (line.trim() === "") continue;
    if (indentOf(line) <= indent) break;
    if (/^\s*exclude\s*:/.test(line)) return true;
  }
  return false;
}

// Platform regression: the package preflight must carry exactly the reviewed
// Linux gate, in a job that really runs on the three-OS matrix. Refusing
// anything not provably equivalent is deliberate: there is no expression
// interpreter here to disagree with GitHub.
export function checkWorkflowPlatformGates(text, label = "workflow") {
  const errors = [];
  const lines = text.split("\n");
  const jobsIndex = lines.findIndex((line) => line === "jobs:");
  if (jobsIndex === -1) return [`${label}: no jobs:`];
  const headers = [];
  for (let index = jobsIndex + 1; index < lines.length; index++) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[index])) headers.push(index);
  }
  headers.push(lines.length);

  let linuxLeg = 0;
  for (let header = 0; header < headers.length - 1; header++) {
    const start = headers[header];
    const end = headers[header + 1];
    const job = lines.slice(start, end);
    const jobName = lines[start].trim().replace(/:$/, "");
    for (let index = start; index < end; index++) {
      const run = /^(\s*)run:\s*(.*)$/.exec(lines[index]);
      if (!run || !run[2].includes("check-publish.mjs")) continue;
      const stepStart = findStepStart(lines, index, start);
      if (stepStart === -1) continue;
      const step = lines.slice(stepStart, findStepEnd(lines, stepStart, end));
      const name = stepName(step);

      const condition = stepIf(step);
      if (normalizeGate(condition) !== LINUX_GATE_NORMALIZED) {
        errors.push(
          `${label}: step "${name}" in job "${jobName}" must gate the package preflight with exactly ${LINUX_GATE}; got ${condition === null ? "no if:" : `if: ${condition}`}`,
        );
      }

      if (!/^    runs-on:\s*\$\{\{\s*matrix\.os\s*\}\}\s*$/m.test(job.join("\n"))) {
        errors.push(
          `${label}: job "${jobName}" must run on \${{ matrix.os }} so the Linux gate is a real runner`,
        );
      }
      if (matrixExcludes(job)) {
        errors.push(
          `${label}: job "${jobName}" must not use matrix.exclude; the package preflight needs all of ${REQUIRED_MATRIX_OS.join(", ")}`,
        );
      }
      const os = matrixOs(job);
      const missing = REQUIRED_MATRIX_OS.filter((entry) => !os?.includes(entry));
      if (missing.length > 0) {
        errors.push(
          `${label}: job "${jobName}" must keep ${REQUIRED_MATRIX_OS.join(", ")} in its os matrix; found ${os === null ? "none" : os.join(", ")}`,
        );
      } else {
        linuxLeg++;
      }
    }
  }

  if (basename(label) === "js-cd.yml" && linuxLeg === 0) {
    errors.push(
      `${label}: the release must run ${PACKAGE_PREFLIGHT} on the ubuntu-24.04 leg of the ${REQUIRED_MATRIX_OS.join("/")} matrix`,
    );
  }
  return errors;
}

// The Linux txiki steps are selected by branch. A pull request is selected by
// github.base_ref, not github.ref_name or github.head_ref, so a copy that
// omitted it would skip the job on every pull request. The root copy serves
// the monorepo's plab-js-lib branch only. The published satellite serves dev,
// plab-js-lib and rt-txiki.
export const TXIKI_LINUX_BASE_REFS = {
  root: ["plab-js-lib"],
  satellite: ["dev", "plab-js-lib", "rt-txiki"],
};

const TXIKI_REF_FIELDS = ["ref_name", "head_ref", "base_ref"];
const TXIKI_KNOWN_BRANCHES = new Set(
  Object.values(TXIKI_LINUX_BASE_REFS).flat(),
);

// The step names this check owns. The build version is free; the rest of the
// name is exact.
const TXIKI_STEP_NAMES = {
  build: /^Build pinned txiki\.js .+ for Linux$/,
  test: /^Test on txiki\.js \(Linux source build\)$/,
};
const TXIKI_STEP_PATTERNS = Object.values(TXIKI_STEP_NAMES);

// Mark lines that are YAML block-scalar content, so a `- name:` or `if:`
// inside a `run: |` script is not mistaken for a real step key. A block starts
// on a key whose value is `|`/`>` with optional chomping/indent indicators and
// ends at the first non-blank line no deeper than the key.
function blockScalarContent(lines) {
  const inside = new Set();
  let keyIndent = -1;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (keyIndent !== -1) {
      if (line.trim() === "" || indentOf(line) > keyIndent) {
        inside.add(index);
        continue;
      }
      keyIndent = -1;
    }
    const match =
      /^(\s*)(-\s+)?([A-Za-z0-9_-]+):\s*[|>][0-9+-]*\s*(?:#.*)?$/.exec(line);
    if (match) {
      keyIndent = match[1].length + (match[2] ? 2 : 0);
    }
  }
  return inside;
}

// The two steps this check validates. A matching name inside a block scalar
// or a comment is not a step.
function txikiSteps(text) {
  const lines = text.split("\n");
  const blockScalar = blockScalarContent(lines);
  const steps = [];
  for (let index = 0; index < lines.length; index++) {
    if (blockScalar.has(index)) continue;
    const match = /^(\s*)- name:\s*(.*)$/.exec(lines[index]);
    if (!match) continue;
    const name = match[2].trim().replace(/^["']|["']$/g, "");
    if (!TXIKI_STEP_PATTERNS.some((pattern) => pattern.test(name))) continue;
    const end = findStepEnd(lines, index, lines.length);
    steps.push({ name, lines: lines.slice(index, end) });
  }
  return steps;
}

// The step's own if: value. Only a single-line value and the folded block
// scalar (`>` / `>-`) used by the real steps are supported. A literal block,
// a comment on the key line, or any other form is refused rather than guessed
// at.
function stepIfCondition(step) {
  const nameLine = /^(\s*)- name:/.exec(step[0]);
  if (!nameLine) return { error: "has no name key" };
  const keyIndent = nameLine[1].length + 2;
  let ifIndex = -1;
  for (let index = 1; index < step.length; index++) {
    const line = step[index];
    if (line.trim() === "") continue;
    if (indentOf(line) < keyIndent) break;
    if (indentOf(line) === keyIndent && /^if:/.test(line.trimStart())) {
      ifIndex = index;
      break;
    }
  }
  if (ifIndex === -1) return { error: "has no if: condition" };
  const raw = step[ifIndex].trimStart().slice("if:".length).trim();
  if (raw === ">" || raw === ">-") {
    const body = [];
    for (let index = ifIndex + 1; index < step.length; index++) {
      const line = step[index];
      if (line.trim() === "") {
        body.push("");
        continue;
      }
      if (indentOf(line) <= keyIndent) break;
      body.push(line.trim());
    }
    if (body.every((line) => line === "")) {
      return { error: "has an empty if: block" };
    }
    return { condition: body.join(" ") };
  }
  if (raw === "" || /^[|>]/.test(raw)) {
    return {
      error: `uses an unsupported if: form ${raw === "" ? "(empty)" : raw}`,
    };
  }
  return { condition: raw };
}

// Normalise only whitespace between tokens. Every operator, name and string
// still has to match exactly; this is not a general Actions expression parser.
function normalizeTxikiCondition(condition) {
  return condition
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*(&&|\|\||==)\s*/g, "$1")
    .replace(/\s*([!()])\s*/g, "$1");
}

function txikiTerm(field, branch) {
  return `github.${field}=='${branch}'`;
}

function displayTerm(term) {
  return term.replace("==", " == ");
}

function txikiTermsFor(branches) {
  return new Set(
    branches.flatMap((branch) =>
      TXIKI_REF_FIELDS.map((field) => txikiTerm(field, branch)),
    ),
  );
}

// Terms the copy must carry: every reviewed field for each branch it serves.
function txikiRequiredTerms(layout) {
  const branches = TXIKI_LINUX_BASE_REFS[layout] ?? TXIKI_LINUX_BASE_REFS.root;
  return txikiTermsFor(branches);
}

// Terms the copy may carry. The satellite carries every reviewed comparison.
// The root copy may keep ref_name/head_ref for the other branches, which are
// source branches of a pull request, but must not select them as a base.
// base_ref is therefore allowed only for the branches the root serves.
function txikiAllowedTerms(layout) {
  const allowed = txikiTermsFor(TXIKI_LINUX_BASE_REFS.satellite);
  if (layout === "satellite") return allowed;
  const rootBranches = new Set(TXIKI_LINUX_BASE_REFS.root);
  for (const branch of TXIKI_LINUX_BASE_REFS.satellite) {
    if (!rootBranches.has(branch)) {
      allowed.delete(txikiTerm("base_ref", branch));
    }
  }
  return allowed;
}

// The one supported txiki if: shape:
//   !cancelled() && matrix.os == 'ubuntu-24.04' && (refs joined by ||)
// A different Linux selector, extra &&/||, negation, a comment, a duplicate,
// or an unknown field or branch is an error, not something to interpret.
function txikiConditionErrors(condition, name, label, layout) {
  const errors = [];
  const text = normalizeTxikiCondition(condition);
  const shape =
    /^!cancelled\(\)&&matrix\.os=='ubuntu-24\.04'&&\((.+)\)$/.exec(text);
  if (!shape) {
    errors.push(
      `${label}: step "${name}" has an unsupported if: condition; expected !cancelled() && matrix.os == 'ubuntu-24.04' && (github ref comparisons joined by ||)`,
    );
    return errors;
  }

  const required = txikiRequiredTerms(layout);
  const allowed = txikiAllowedTerms(layout);
  const seen = new Set();
  for (const raw of shape[1].split("||")) {
    const term = raw.trim();
    const match =
      /^github\.(ref_name|head_ref|base_ref)=='([^']+)'$/.exec(term);
    if (!match) {
      errors.push(
        `${label}: step "${name}" has unsupported syntax in its if: condition: "${term}"`,
      );
      continue;
    }
    if (!TXIKI_KNOWN_BRANCHES.has(match[2])) {
      errors.push(
        `${label}: step "${name}" has an unknown branch in its if: condition: "${term}"`,
      );
      continue;
    }
    const normalized = txikiTerm(match[1], match[2]);
    if (seen.has(normalized)) {
      errors.push(
        `${label}: step "${name}" repeats ${displayTerm(normalized)}`,
      );
      continue;
    }
    seen.add(normalized);
    if (!allowed.has(normalized)) {
      errors.push(
        layout === "root"
          ? `${label}: root copy step "${name}" must not include ${displayTerm(normalized)}`
          : `${label}: step "${name}" has an unexpected ref comparison ${displayTerm(normalized)}`,
      );
    }
  }
  for (const term of required) {
    if (!seen.has(term)) {
      errors.push(
        `${label}: step "${name}" must include the pull-request base ref ${displayTerm(term)}`,
      );
    }
  }
  return errors;
}

// Base-ref regression: the Linux txiki build and test steps must name the
// pull-request base branches their copy serves. A branch push sets
// github.base_ref to the empty string, so these comparisons do not narrow a
// push; they add the pull_request case.
export function checkWorkflowTxikiBaseRefs(
  text,
  label = "workflow",
  layout = workflowLayout(label),
) {
  if (!/^js-(?:std|os)-ci\.ya?ml$/.test(basename(label))) return [];
  const steps = txikiSteps(text);
  const errors = [];
  for (const [kind, pattern] of Object.entries(TXIKI_STEP_NAMES)) {
    if (!steps.some((step) => pattern.test(step.name))) {
      errors.push(`${label}: missing the Linux txiki ${kind} step`);
    }
  }
  for (const step of steps) {
    const parsed = stepIfCondition(step.lines);
    if (parsed.error) {
      errors.push(`${label}: step "${step.name}" ${parsed.error}`);
      continue;
    }
    errors.push(
      ...txikiConditionErrors(parsed.condition, step.name, label, layout),
    );
  }
  return errors;
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
  if (args.length === 0) {
    for (const path of jsWorkflowPaths()) {
      const text = readFileSync(path, "utf8");
      for (const error of [
        ...checkWorkflowTriggers(text, path),
        ...checkWorkflowShells(text, path),
        ...checkWorkflowPlatformGates(text, path),
        ...checkWorkflowTxikiBaseRefs(text, path),
      ]) {
        console.error(error);
        failed++;
      }
    }
  }
  if (failed > 0) process.exit(1);
  console.log(
    `workflow wiring ok (${paths.length} file${paths.length === 1 ? "" : "s"})`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
