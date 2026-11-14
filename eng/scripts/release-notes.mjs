// Generate release notes from the preflight plan and git history.
//
// The plan is authoritative for package actions. It is written by
// `publish.mjs preflight --plan-json <path>` before any upload. A package is
// "scheduled to publish" only when the plan says `publish`. A skip is reported
// as a skip, with its limitation: a JSR skip does not verify content, and an
// npm skip is only a verified skip when the tarball integrity matches.
//
// Git history is authoritative for what changed. A commit is in the notes only
// when it touches this area, and module membership comes from the paths the
// commit changed, not from the text of its scope. A scope such as `js-chars`
// labels the line; it cannot claim a module changed when no module path did.
//
// This script does not create a GitHub Release, does not write to a registry,
// and does not need `contents: write`. It writes markdown to a file and appends
// the same markdown to `$GITHUB_STEP_SUMMARY` when that variable is set.

import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { areasForTag, discoverPackages } from "./publish.mjs";
import { satelliteRoot } from "./workspace-map.mjs";

const KNOWN_ACTIONS = new Set([
  "publish",
  "skip-existing",
  "verified-skip",
  "blocked",
]);

const TYPE_ORDER = [
  "breaking",
  "feat",
  "fix",
  "perf",
  "refactor",
  "docs",
  "test",
  "build",
  "ci",
  "chore",
  "style",
  "revert",
  "import",
  "other",
];

const TYPE_LABELS = {
  breaking: "Breaking changes",
  feat: "Features",
  fix: "Bug fixes",
  perf: "Performance",
  refactor: "Refactoring",
  docs: "Documentation",
  test: "Tests",
  build: "Build",
  ci: "Continuous integration",
  chore: "Chores",
  style: "Style",
  revert: "Reverts",
  import: "Imports",
  other: "Other changes",
};

const MAX_SUBJECT = 500;

// ---------------------------------------------------------------------------
// Text handling

// Commit text is untrusted. It is never passed to a shell, and markdown output
// is escaped so a commit cannot inject HTML or a table cell. Control characters
// are removed and the subject is bounded so one commit cannot make an unbounded
// summary.
export function cleanText(value) {
  return String(value ?? "")
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SUBJECT);
}

export function escapeMarkdown(value) {
  return cleanText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_[\]|])/g, "\\$1");
}

// Inline code is used for names, versions and scopes. A value containing a
// backtick gets a longer fence so markdown cannot break out of it.
export function codeSpan(value) {
  const text = cleanText(value);
  const runs = text.match(/`+/g) ?? [];
  if (runs.length === 0) return `\`${text}\``;
  const fence = "`".repeat(Math.max(...runs.map((run) => run.length)) + 1);
  return `${fence} ${text} ${fence}`;
}

// ---------------------------------------------------------------------------
// Conventional commits

export function parseConventionalCommit(subject) {
  const text = cleanText(subject);
  const match =
    /^([A-Za-z][A-Za-z0-9-]*)(?:\(([^()\r\n]+)\))?(!)?\s*:\s*(.+)$/.exec(text);
  if (!match) {
    return {
      conventional: false,
      rawType: null,
      type: "other",
      scope: null,
      description: text,
      breaking: false,
    };
  }

  const rawType = match[1].toLowerCase();
  const scope = match[2] === undefined ? null : cleanText(match[2]);
  const description = cleanText(match[4]);
  const breaking = match[3] === "!" || rawType === "breaking";
  const type = rawType === "feature" ? "feat" : rawType;

  return {
    conventional: true,
    rawType,
    type: breaking ? "breaking" : type,
    scope,
    description,
    breaking,
  };
}

// ---------------------------------------------------------------------------
// Plan

export function moduleIdOf(name) {
  return cleanText(name).replace(/^@[^/]+\//, "") || "unknown";
}

// The expected package set comes from the checkout, not from a list in this
// script. `publish.mjs` already discovers every publishable manifest for the
// area; reusing it means a fake package cannot be added to a plan and a real
// package cannot disappear from one.
export function expectedPackagesForArea(root, area) {
  const { jsr, npm } = discoverPackages(root, [area]);
  const mapOf = (packages, registry) => {
    const map = new Map();
    for (const pkg of packages) {
      if (map.has(pkg.name)) {
        throw new Error(`duplicate publishable ${registry} package ${pkg.name}`);
      }
      const dir = relative(root, pkg.dir).split(sep).join("/");
      if (dir.startsWith("..")) {
        throw new Error(`${pkg.name} is outside ${root}`);
      }
      map.set(pkg.name, { name: pkg.name, version: pkg.version, dir });
    }
    return map;
  };
  return {
    jsr: mapOf(jsr, "JSR"),
    npm: mapOf(npm, "npm"),
  };
}

// Only the fields the notes need are kept. Absolute paths and temporary
// tarballs are not part of the plan document: the artifact may be published
// from a checkout that no longer has the temp directory.
export function normalizePlan(plan, expectedArea = null, expectedPackages = null) {
  const errors = [];
  const fatal = [];
  const entries = [];

  if (plan === null || typeof plan !== "object" || Array.isArray(plan)) {
    return { entries, errors, fatal: ["plan is not an object"] };
  }
  if (Array.isArray(plan.errors)) {
    for (const error of plan.errors) errors.push(cleanText(error));
  } else if (plan.errors !== undefined) {
    fatal.push("plan.errors is not an array");
  }
  if (expectedArea !== null) {
    if (!Array.isArray(plan.areas)) {
      fatal.push("plan.areas is not an array");
    } else if (plan.areas.length !== 1 || cleanText(plan.areas[0]) !== expectedArea) {
      fatal.push(
        `plan.areas ${JSON.stringify(plan.areas)} does not match tag area ${expectedArea}`,
      );
    }
  }

  for (const registry of ["jsr", "npm"]) {
    const list = plan[registry];
    if (!Array.isArray(list)) {
      fatal.push(`plan.${registry} is not an array`);
      continue;
    }
    const expected = expectedPackages ? expectedPackages[registry] : null;
    if (expectedPackages && !(expected instanceof Map)) {
      fatal.push(`expected ${registry} packages are not available`);
    }
    const seenNames = new Set();
    const matched = new Set();
    for (const [index, raw] of list.entries()) {
      const where = `plan.${registry}[${index}]`;
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        fatal.push(`${where} is not an object`);
        continue;
      }
      const name = cleanText(raw.name);
      const version = cleanText(raw.version);
      const action = cleanText(raw.action);
      if (!name) fatal.push(`${where}.name is empty`);
      if (!version) fatal.push(`${where}.version is empty`);
      if (seenNames.has(name)) {
        fatal.push(`${where}: duplicate ${registry} package ${name || "(empty)"}`);
        continue;
      }
      seenNames.add(name);
      if (!KNOWN_ACTIONS.has(action)) {
        fatal.push(`${where}.action ${action || "(empty)"} is not recognized`);
        continue;
      }
      if (registry === "jsr" && action === "verified-skip") {
        fatal.push(`${where}: JSON registry cannot use verified-skip`);
      }
      if (registry === "npm" && action === "skip-existing") {
        fatal.push(`${where}: npm registry cannot use skip-existing`);
      }

      let dir = null;
      if (typeof raw.dir === "string") {
        dir = raw.dir.split("\\").join("/").replace(/^\.\//, "").replace(/\/+$/, "");
        if (dir.startsWith("/") || dir.split("/").includes("..")) {
          fatal.push(`${where}.dir must be relative and inside the tree`);
          dir = null;
        }
      }
      const area = typeof raw.area === "string" ? cleanText(raw.area) : null;
      if (expectedArea !== null) {
        if (area !== expectedArea) {
          fatal.push(`${where}.area ${area ?? "(missing)"} is not ${expectedArea}`);
        }
        if (dir === null) {
          fatal.push(`${where}.dir is required for a ${expectedArea} plan`);
        } else if (!dir.startsWith(`${expectedArea}/`)) {
          fatal.push(`${where}.dir ${dir} is outside ${expectedArea}/`);
        }
      }

      const entry = {
        registry,
        area,
        name,
        version,
        action,
        tag: typeof raw.tag === "string" ? cleanText(raw.tag) : null,
        dir,
        moduleId: moduleIdOf(name),
      };

      if (expectedPackages && expected instanceof Map) {
        const manifest = expected.get(name);
        if (!manifest) {
          fatal.push(
            `${where}.name ${name || "(empty)"} is not a publishable ${registry} package in ${expectedArea}`,
          );
        } else {
          matched.add(name);
          if (version !== manifest.version) {
            fatal.push(
              `${where}.version ${version || "(empty)"} is not manifest version ${manifest.version}`,
            );
          }
          if (dir !== manifest.dir) {
            fatal.push(
              `${where}.dir ${dir ?? "(missing)"} is not canonical directory ${manifest.dir}`,
            );
          }
        }
      }

      entries.push(entry);
    }

    if (expected instanceof Map) {
      for (const name of expected.keys()) {
        if (!matched.has(name)) {
          fatal.push(
            `plan.${registry} is missing publishable ${registry} package ${name}`,
          );
        }
      }
    }
  }

  return { entries, errors, fatal };
}

export function modulePathsFromPlan(entries) {
  const modules = new Map();
  for (const entry of entries) {
    if (!entry.dir) continue;
    const id = entry.moduleId;
    if (!modules.has(id)) modules.set(id, []);
    if (!modules.get(id).includes(entry.dir)) modules.get(id).push(entry.dir);
  }
  return modules;
}

// ---------------------------------------------------------------------------
// Path classification

function toRootPath(path, rootPrefix) {
  const normalized = path.split("\\").join("/");
  if (!rootPrefix) return normalized;
  if (!normalized.startsWith(`${rootPrefix}/`)) return null;
  return normalized.slice(rootPrefix.length + 1);
}

// A commit belongs to a module only when it changed a path under that module.
// A shared path (`docs/`, `eng/`, `.github/`) belongs to every area. A path
// under the other area is ignored for module labels, but it does not suppress
// a shared change. The returned module ids follow the order of the plan so
// notes stay deterministic.
export function classifyCommitPaths(paths, area, modulePaths, rootPrefix = "") {
  const modules = new Set();
  let touchesOwnArea = false;
  let touchesShared = false;
  const areaPrefix = `${area}/`;
  const otherAreas = ["std", "os"].filter((value) => value !== area);

  for (const path of paths) {
    const local = toRootPath(path, rootPrefix);
    if (local === null) continue;
    if (otherAreas.some((other) => local === other || local.startsWith(`${other}/`))) {
      continue;
    }
    if (local === area || local.startsWith(areaPrefix)) {
      touchesOwnArea = true;
      for (const [id, dirs] of modulePaths) {
        if (dirs.some((dir) => local === dir || local.startsWith(`${dir}/`))) {
          modules.add(id);
        }
      }
      continue;
    }
    // Everything else inside the satellite root is shared area content.
    touchesShared = true;
  }

  // Shared files are cross-cutting: `eng/`, `docs/`, and the root manifests
  // affect every area. A shared change is included once in each area's notes,
  // even when the same commit also changed another area's module. Module
  // labels still come only from this area's paths.
  const touchesArea = touchesOwnArea || touchesShared;

  return {
    touchesArea,
    shared: touchesShared,
    modules: [...modules].sort(
      (a, b) => moduleOrder(modulePaths, a) - moduleOrder(modulePaths, b),
    ),
  };
}

function moduleOrder(modulePaths, id) {
  return [...modulePaths.keys()].indexOf(id);
}

// ---------------------------------------------------------------------------
// Git

function runGit(repo, args) {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${(result.stderr ?? "").trim()}`,
    );
  }
  return result.stdout;
}

export function repoRootOf(repo) {
  return runGit(repo, ["rev-parse", "--show-toplevel"]).trim();
}

export function headShaOf(repo) {
  return runGit(repo, ["rev-parse", "HEAD"]).trim();
}

function rootPrefixOf(repo, root) {
  const repoRoot = resolve(repoRootOf(repo));
  const target = resolve(root);
  if (target === repoRoot) return "";
  const prefix = relative(repoRoot, target).split(sep).join("/");
  if (!prefix || prefix.startsWith("..")) {
    throw new Error(`${root} is not inside ${repoRoot}`);
  }
  return prefix;
}

export function areaTagPrefixes(area) {
  return area === "std" ? ["std/v", "js/v"] : [`${area}/v`];
}

// Select the previous release tag by history distance, not tag creation time.
// The current tag is excluded, and so is every tag pointing at HEAD: a second
// tag name on the same commit is an alias, not a previous release. The current
// prefix wins a tie so an `std` release compares to an earlier `std` tag rather
// than the equally valid `js` alias when both are on the same commit.
export function selectBaseline(tags, currentTag, headSha) {
  const currentPrefix = currentTag.split("/")[0];
  const candidates = tags.filter(
    (tag) =>
      tag.name !== currentTag &&
      tag.sha !== headSha &&
      Number.isInteger(tag.distance) &&
      tag.distance > 0,
  );
  candidates.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    const rank = (tag) => (tag.name.split("/")[0] === currentPrefix ? 0 : 1);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    return b.name.localeCompare(a.name);
  });
  return candidates[0] ?? null;
}

export function loadBaseline({ repo, area, currentTag, headSha }) {
  const prefixes = areaTagPrefixes(area);
  const output = runGit(repo, [
    "for-each-ref",
    "--merged=HEAD",
    "--format=%(refname:strip=2)%09%(objectname)%09%(*objectname)",
    "refs/tags",
  ]);
  const tags = [];
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    const [name, object, peeled] = line.split("\t");
    if (!prefixes.some((prefix) => name.startsWith(prefix))) continue;
    const sha = (peeled || object || "").trim();
    if (!/^[0-9a-f]{40}$/.test(sha) || sha === headSha) continue;
    const distance = Number(
      runGit(repo, ["rev-list", "--count", `${sha}..HEAD`]).trim(),
    );
    if (!Number.isInteger(distance) || distance <= 0) continue;
    tags.push({ name, sha, distance });
  }
  return selectBaseline(tags, currentTag, headSha);
}

export function currentTagSha(repo, tag) {
  const output = runGit(repo, [
    "rev-parse",
    "--verify",
    `refs/tags/${tag}^{commit}`,
  ]).trim();
  return output;
}

export function collectCommits({
  repo,
  root,
  area,
  modulePaths,
  fromSha = null,
}) {
  const rootPrefix = rootPrefixOf(repo, root);
  const range = fromSha ? [`${fromSha}..HEAD`] : ["HEAD"];
  const pathspec = rootPrefix || ".";
  const output = runGit(repo, [
    "log",
    "--no-merges",
    "--format=%H %s",
    "--name-only",
    ...range,
    "--",
    pathspec,
  ]);

  const commits = [];
  const seen = new Set();
  let current = null;
  const flush = () => {
    if (!current) return;
    if (seen.has(current.sha)) {
      current = null;
      return;
    }
    seen.add(current.sha);
    const classification = classifyCommitPaths(
      current.paths,
      area,
      modulePaths,
      rootPrefix,
    );
    if (classification.touchesArea) {
      const parsed = parseConventionalCommit(current.subject);
      commits.push({
        sha: current.sha,
        subject: cleanText(current.subject),
        modules: classification.modules,
        shared: classification.shared,
        ...parsed,
      });
    }
    current = null;
  };

  for (const line of output.split("\n")) {
    const match = /^([0-9a-f]{40}) (.*)$/.exec(line);
    if (match) {
      flush();
      current = { sha: match[1], subject: match[2], paths: [] };
      continue;
    }
    if (current && line.trim()) current.paths.push(line);
  }
  flush();
  return commits;
}

// ---------------------------------------------------------------------------
// Rendering

function areaTagSummary(baseline, area, headSha) {
  if (!baseline) {
    return (
      `First recorded \`${area}\` release; the full history through ` +
      `${codeSpan(headSha.slice(0, 7))} is in range.`
    );
  }
  return (
    `Previous \`${area}\` tag ${codeSpan(baseline.name)} at ` +
    `${codeSpan(baseline.sha.slice(0, 7))}; ${baseline.distance} commit` +
    `${baseline.distance === 1 ? "" : "s"} in range.`
  );
}

// A pipe is a table delimiter even inside inline code. Escape it after the
// code span so a malicious or malformed plan entry cannot add a column.
function tableCode(value) {
  return codeSpan(value).replace(/\|/g, "\\|");
}

function packageTable(packages, columns, lastCell) {
  const lines = [
    `| ${columns.join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
  ];
  for (const pkg of packages) {
    const cells = [
      pkg.registry === "jsr" ? "JSR" : "npm",
      tableCode(pkg.name),
      tableCode(pkg.version),
      lastCell(pkg),
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }
  return lines;
}

function skipReason(pkg) {
  if (pkg.action === "skip-existing") {
    return "`skip-existing`: content is not verified; bump the version to change published code.";
  }
  if (pkg.action === "verified-skip") {
    return "`verified-skip`: the registry sha512 matches the local tarball.";
  }
  if (pkg.action === "blocked") {
    return "`blocked`: the preflight did not approve this package.";
  }
  return `\`${pkg.action}\``;
}

function renderPackages(entries, errors) {
  const lines = [];
  if (errors.length > 0) {
    lines.push("## Preflight failed", "");
    lines.push(
      `The preflight plan reported ${errors.length} error` +
        `${errors.length === 1 ? "" : "s"}. Nothing is scheduled to publish, ` +
        "and this tag must not be treated as a release.",
      "",
    );
    for (const error of errors) lines.push(`- ${escapeMarkdown(error)}`);
    lines.push("");
    return lines;
  }

  const scheduled = entries.filter((entry) => entry.action === "publish");
  const skipped = entries.filter(
    (entry) =>
      entry.action === "skip-existing" || entry.action === "verified-skip",
  );
  const blocked = entries.filter((entry) => entry.action === "blocked");

  lines.push("## Packages scheduled to publish", "");
  if (scheduled.length === 0) {
    lines.push(
      "No package is scheduled to publish for this tag. Existing versions are listed below.",
      "",
    );
  } else {
    lines.push(
      ...packageTable(
        scheduled,
        ["Registry", "Package", "Version", "Dist-tag"],
        (pkg) => (pkg.registry === "jsr" ? "—" : pkg.tag ? tableCode(pkg.tag) : "—"),
      ),
    );
    lines.push("");
  }

  if (skipped.length > 0) {
    lines.push("## Existing versions skipped", "");
    lines.push(
      ...packageTable(
        skipped,
        ["Registry", "Package", "Version", "Reason"],
        (pkg) => skipReason(pkg),
      ),
    );
    lines.push("");
    lines.push(
      "A JSR skip is not a content check. A changed source under the same version is not published; bump the version.",
      "",
    );
  }

  if (blocked.length > 0) {
    lines.push("## Blocked packages", "");
    for (const pkg of blocked) {
      lines.push(
        `- ${pkg.registry === "jsr" ? "JSR" : "npm"} ${codeSpan(`${pkg.name}@${pkg.version}`)} — ${skipReason(pkg)}`,
      );
    }
    lines.push("");
  }

  return lines;
}

function groupCommits(commits) {
  const groups = new Map(TYPE_ORDER.map((type) => [type, []]));
  for (const commit of commits) {
    const type =
      commit.breaking || commit.type === "breaking"
        ? "breaking"
        : groups.has(commit.type)
          ? commit.type
          : "other";
    groups.get(type).push(commit);
  }
  return groups;
}

function renderCommit(commit) {
  const labels = commit.modules.map((id) => codeSpan(id));
  if (commit.shared || labels.length === 0) labels.push(codeSpan("area"));
  const labelText = labels.join(", ");
  const sha = codeSpan(commit.sha.slice(0, 7));

  if (commit.conventional) {
    const scope = commit.scope ? `(${commit.scope})` : "";
    const bang = commit.rawType === "breaking" ? "" : commit.breaking ? "!" : "";
    return (
      `- ${codeSpan(`${commit.rawType}${scope}${bang}`)}: ` +
      `${escapeMarkdown(commit.description)} — ${labelText} (${sha})`
    );
  }
  return `- ${escapeMarkdown(commit.subject)} — ${labelText} (${sha})`;
}

export function buildReleaseNotes({
  tag,
  area,
  baseline,
  commits,
  plan,
  headSha,
  expectedPackages = null,
}) {
  const normalized = normalizePlan(plan, area, expectedPackages);
  if (normalized.fatal.length > 0) {
    throw new Error(
      `release plan does not match ${area}: ${normalized.fatal.join("; ")}`,
    );
  }
  const { entries, errors } = normalized;
  const modulePaths = modulePathsFromPlan(entries);

  // A commit can be repeated by a caller that combined logs. The SHA is the
  // identity; render one line per commit.
  const unique = [];
  const seen = new Set();
  for (const commit of commits) {
    const sha = cleanText(commit.sha);
    if (!/^[0-9a-f]{40}$/.test(sha) || seen.has(sha)) continue;
    seen.add(sha);
    unique.push({
      sha,
      subject: cleanText(commit.subject),
      modules: Array.isArray(commit.modules)
        ? commit.modules.map(cleanText)
        : [],
      shared: Boolean(commit.shared),
      conventional: Boolean(commit.conventional),
      rawType: commit.rawType ? cleanText(commit.rawType) : null,
      type: commit.type ? cleanText(commit.type) : "other",
      scope: commit.scope ? cleanText(commit.scope) : null,
      description: cleanText(commit.description ?? commit.subject),
      breaking: Boolean(commit.breaking),
    });
  }

  const lines = [
    `# Release notes: ${codeSpan(tag)}`,
    "",
    `- Area: ${codeSpan(area)}`,
    `- Baseline: ${areaTagSummary(baseline, area, headSha)}`,
    `- Commits touching this area: ${unique.length}`,
    "- Source: `eng/scripts/publish.mjs preflight` and `git log`; no registry write and no GitHub Release.",
    "",
  ];

  lines.push(...renderPackages(entries, errors));

  lines.push("## Changes", "");
  if (unique.length === 0) {
    lines.push(
      `No commits in this range touched the \`${area}\` area. The package plan above is the release.`,
      "",
    );
  } else {
    const groups = groupCommits(unique);
    for (const type of TYPE_ORDER) {
      const group = groups.get(type);
      if (!group || group.length === 0) continue;
      lines.push(`### ${TYPE_LABELS[type]}`, "");
      for (const commit of group) lines.push(renderCommit(commit));
      lines.push("");
    }
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

// ---------------------------------------------------------------------------
// Entry points

export function generateReleaseNotes({ repo, root, tag, plan, headSha = null }) {
  const area = areasForTag(tag)[0];
  const expectedPackages = expectedPackagesForArea(root, area);
  const normalized = normalizePlan(plan, area, expectedPackages);
  if (normalized.fatal.length > 0) {
    throw new Error(
      `release plan does not match ${area}: ${normalized.fatal.join("; ")}`,
    );
  }
  const head = headSha ?? headShaOf(repo);
  const baseline = loadBaseline({ repo, area, currentTag: tag, headSha: head });
  const modulePaths = modulePathsFromPlan(normalized.entries);
  const commits = collectCommits({
    repo,
    root,
    area,
    modulePaths,
    fromSha: baseline ? baseline.sha : null,
  });
  return {
    markdown: buildReleaseNotes({
      tag,
      area,
      baseline,
      commits,
      plan,
      headSha: head,
      expectedPackages,
    }),
    area,
    baseline,
    commitCount: commits.length,
  };
}

function parseArgs(argv) {
  const options = {
    plan: null,
    output: null,
    tag: process.env.RELEASE_TAG ?? null,
    repo: null,
    root: null,
    allowMissingTag: false,
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const value = () => {
      const next = argv[++index];
      if (next === undefined) throw new Error(`${arg} needs a value`);
      return next;
    };
    if (arg === "--plan") options.plan = value();
    else if (arg === "--output") options.output = value();
    else if (arg === "--tag") options.tag = value();
    else if (arg === "--repo") options.repo = value();
    else if (arg === "--root") options.root = value();
    else if (arg === "--allow-missing-tag") options.allowMissingTag = true;
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!options.plan) throw new Error("--plan is required");
  if (!options.tag) throw new Error("--tag or RELEASE_TAG is required");
  return options;
}

function defaultRepo() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`cannot find git root: ${(result.stderr ?? "").trim()}`);
  }
  return result.stdout.trim();
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repo = resolve(options.repo ?? defaultRepo());
  const root = resolve(options.root ?? satelliteRoot());
  const output = resolve(options.output ?? ".build/release-notes.md");

  // The release ref guard also checks this. Repeating it here means a local
  // run cannot produce notes for a tag that points somewhere else, and a
  // missing tag has to be acknowledged rather than silently assumed.
  const head = headShaOf(repo);
  let tagSha = null;
  try {
    tagSha = currentTagSha(repo, options.tag);
  } catch {
    if (!options.allowMissingTag) {
      throw new Error(
        `tag ${options.tag} does not exist locally; fetch tags or pass --allow-missing-tag`,
      );
    }
  }
  if (tagSha !== null && tagSha !== head) {
    throw new Error(
      `tag ${options.tag} points at ${tagSha}, but HEAD is ${head}`,
    );
  }

  const plan = JSON.parse(readFileSync(resolve(options.plan), "utf8"));
  const result = generateReleaseNotes({
    repo,
    root,
    tag: options.tag,
    plan,
    headSha: head,
  });

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, result.markdown, "utf8");
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, result.markdown, "utf8");
  }

  // Do not print the markdown here. A commit message is untrusted text, and
  // workflow-command parsing on stdout is exactly the surface it must not
  // reach. The file and the step summary are the outputs.
  console.log(
    `release notes: ${output} (${result.commitCount} commit` +
      `${result.commitCount === 1 ? "" : "s"}, area ${result.area}` +
      `${result.baseline ? `, baseline ${result.baseline.name}` : ", first release"})`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(1);
  }
}
