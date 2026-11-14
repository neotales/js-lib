// Coordinate one js-lib release.
//
// The coordinator runs before any publish job. It resolves the release tag,
// finds the previous release tag on the first-parent chain, selects the
// registered areas that changed or still have an unpublished version, runs the
// existing preflight, and writes the plan, notes, rationale and matrix. The
// workflow starts one publish job per selected area; no job publishes another
// area's packages.
//
// A normal release tag (`vYYYY.MM.DD-r.N`) is annotated. Legacy area tags
// (`std/v*`, `js/v*`, `os/v*`) still select exactly one area and keep the old
// behaviour, including the old area-tag baseline for notes.
//
// This script reads registries. It never writes to one, never creates a GitHub
// Release, and never creates or moves a git tag.

import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPlan,
  discoverPackages,
  jsrDependencies,
  jsrPackageMeta,
  npmDependencies,
  npmVersionState,
  serializePlan,
  versionInJsrMeta,
} from "./publish.mjs";
import {
  codeSpan,
  currentTagSha,
  escapeMarkdown,
  expectedPackagesForArea,
  generateReleaseNotesForAreas,
  headShaOf,
  loadBaseline,
  loadFirstParentReleaseBaseline,
  normalizePlan,
  repoRootOf,
} from "./release-notes.mjs";
import {
  classifyChangedPaths,
  loadAreaRegistry,
  parseReleaseTag,
} from "./release-areas.mjs";
import { satelliteRoot } from "./workspace-map.mjs";

export const NO_AREA = "none";

// ---------------------------------------------------------------------------
// Git

function git(repo, args) {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${(result.stderr ?? "").trim()}`);
  }
  return result.stdout;
}

export function tagObjectType(repo, tag) {
  return git(repo, ["cat-file", "-t", `refs/tags/${tag}`]).trim();
}

export function collectChangedPaths({ repo, fromSha, headSha, rootPrefix = "" }) {
  if (!fromSha) return [];
  const pathspec = rootPrefix || ".";
  const output = git(repo, [
    "diff",
    "--name-only",
    "--no-renames",
    `${fromSha}..${headSha}`,
    "--",
    pathspec,
  ]);
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((path) => {
      if (!rootPrefix) return path;
      if (!path.startsWith(`${rootPrefix}/`)) return null;
      return path.slice(rootPrefix.length + 1);
    })
    .filter((path) => path !== null);
}

// In the monorepo the satellite root is `js/lib`, while git reports paths from
// the monorepo root. Discovery and classification always use satellite-relative
// paths, so strip the prefix once, here.
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

// ---------------------------------------------------------------------------
// Area graph and registry state

export function buildAreaGraph({ root, areas }) {
  const { jsr, npm } = discoverPackages(root, areas);
  const jsrByName = new Map();
  const npmByName = new Map();
  for (const entry of jsr) {
    if (jsrByName.has(entry.name)) {
      throw new Error(`duplicate publishable JSR package ${entry.name}`);
    }
    jsrByName.set(entry.name, entry);
  }
  for (const entry of npm) {
    if (npmByName.has(entry.name)) {
      throw new Error(`duplicate publishable npm package ${entry.name}`);
    }
    npmByName.set(entry.name, entry);
  }
  for (const area of areas) {
    if (!jsr.some((entry) => entry.area === area) && !npm.some((entry) => entry.area === area)) {
      throw new Error(
        `registered area ${area} has no publishable JSR or npm package`,
      );
    }
  }

  const jsrDeps = new Map();
  for (const entry of jsr) jsrDeps.set(entry.name, jsrDependencies(entry, jsrByName));
  const npmDeps = new Map();
  for (const entry of npm) npmDeps.set(entry.name, npmDependencies(entry, npmByName));

  const areaDependencies = new Map(areas.map((area) => [area, new Set()]));
  const addEdges = (packages, dependencies, byName) => {
    for (const entry of packages) {
      for (const name of dependencies.get(entry.name) ?? []) {
        const target = byName.get(name);
        if (!target || target.area === entry.area) continue;
        areaDependencies.get(entry.area).add(target.area);
      }
    }
  };
  addEdges(jsr, jsrDeps, jsrByName);
  addEdges(npm, npmDeps, npmByName);

  return { areas, jsr, npm, jsrByName, npmByName, jsrDeps, npmDeps, areaDependencies };
}

export async function inspectRegistry({ graph, areas, fetchImpl = fetch }) {
  const state = {};
  const missingVersions = [];
  for (const area of areas) {
    state[area] = { jsr: [], npm: [] };
    for (const entry of graph.jsr.filter((pkg) => pkg.area === area)) {
      let exists;
      try {
        const meta = await jsrPackageMeta(entry.name, fetchImpl);
        exists = versionInJsrMeta(meta, entry.version);
      } catch (error) {
        throw new Error(
          `cannot read JSR ${entry.name}@${entry.version} for ${area}: ${messageOf(error)}`,
        );
      }
      state[area].jsr.push({
        name: entry.name,
        version: entry.version,
        exists,
        // An existing JSR version is skipped. JSR exposes no artifact that can
        // be compared with this checkout, so this is not a content check.
        contentVerified: false,
      });
      if (!exists) {
        missingVersions.push({
          area,
          registry: "jsr",
          name: entry.name,
          version: entry.version,
        });
      }
    }
    for (const entry of graph.npm.filter((pkg) => pkg.area === area)) {
      let exists;
      try {
        const result = await npmVersionState(entry.name, entry.version, fetchImpl);
        exists = result.exists;
      } catch (error) {
        throw new Error(
          `cannot read npm ${entry.name}@${entry.version} for ${area}: ${messageOf(error)}`,
        );
      }
      state[area].npm.push({
        name: entry.name,
        version: entry.version,
        exists,
        // Preflight compares the packed tarball sha512 for an existing version.
        contentVerified: false,
      });
      if (!exists) {
        missingVersions.push({
          area,
          registry: "npm",
          name: entry.name,
          version: entry.version,
        });
      }
    }
  }
  return { state, missingVersions };
}

// ---------------------------------------------------------------------------
// Selection

export async function resolveReleaseAreas({
  repo,
  root,
  tag,
  registry,
  fetchImpl = fetch,
  headSha = null,
  allowMissingTag = false,
  requireAnnotated = true,
}) {
  const parsed = parseReleaseTag(tag, registry);
  const head = headSha ?? headShaOf(repo);

  let tagSha = null;
  try {
    tagSha = currentTagSha(repo, tag);
  } catch {
    if (!allowMissingTag) {
      throw new Error(
        `tag ${tag} does not exist locally; fetch tags or pass --allow-missing-tag`,
      );
    }
  }
  if (tagSha !== null && tagSha !== head) {
    throw new Error(`tag ${tag} points at ${tagSha}, but HEAD is ${head}`);
  }
  // Legacy area tags may be lightweight, as they always were. A normal v*
  // release tag must be annotated so its identity is a tag object, not a
  // branch name that happens to resolve to the same commit.
  if (
    tagSha !== null &&
    parsed.kind === "release" &&
    requireAnnotated &&
    tagObjectType(repo, tag) !== "tag"
  ) {
    throw new Error(`release tag ${tag} must be annotated`);
  }

  const registeredAreas = registry.areas.map((area) => area.name);
  const rootPrefix = rootPrefixOf(repo, root);
  const graph = buildAreaGraph({ root, areas: registeredAreas });

  if (parsed.kind === "legacy") {
    const selectedAreas = [parsed.area];
    const baseline = loadBaseline({
      repo,
      area: parsed.area,
      currentTag: tag,
      headSha: head,
    });
    const changed = baseline
      ? collectChangedPaths({ repo, fromSha: baseline.sha, headSha: head, rootPrefix })
      : [];
    const inspectedAreas = new Set([
      parsed.area,
      ...(graph.areaDependencies.get(parsed.area) ?? []),
    ]);
    const { state, missingVersions } = await inspectRegistry({
      graph,
      areas: registeredAreas.filter((area) => inspectedAreas.has(area)),
      fetchImpl,
    });
    return {
      parsed,
      head,
      baseline,
      firstRelease: false,
      changedPaths: changed,
      unlistedPaths: [],
      selectedAreas,
      reasons: { [parsed.area]: [`legacy-tag:${parsed.prefix}`] },
      registryState: state,
      missingVersions,
      graph,
      inspectedAreas: [...inspectedAreas],
      registeredAreas,
    };
  }

  const baseline = loadFirstParentReleaseBaseline({ repo, tag, headSha: head });
  let changedPaths = [];
  let unlistedPaths = [];
  let selectedAreas = [];
  let reasons = {};
  let firstRelease = false;

  if (baseline === null) {
    // The first normal release has no matching previous release tag. Every
    // registered area is in scope, even if it has no changes since the area
    // tag that preceded this format.
    firstRelease = true;
    selectedAreas = [...registeredAreas];
    reasons = Object.fromEntries(selectedAreas.map((area) => [area, ["first-release"]]));
  } else {
    changedPaths = collectChangedPaths({
      repo,
      fromSha: baseline.sha,
      headSha: head,
      rootPrefix,
    });
    const classification = classifyChangedPaths({ paths: changedPaths, registry });
    unlistedPaths = classification.unlisted;
    selectedAreas = registeredAreas.filter((area) => classification.selected.includes(area));
    reasons = { ...classification.reasons };
  }

  const { state, missingVersions } = await inspectRegistry({
    graph,
    areas: registeredAreas,
    fetchImpl,
  });

  // A previous release can be partial. A version that is absent from either
  // registry puts its area back in scope even when no path changed, so a rerun
  // does not hide a package that never shipped.
  const missingByArea = new Map();
  for (const entry of missingVersions) {
    if (!missingByArea.has(entry.area)) missingByArea.set(entry.area, []);
    missingByArea.get(entry.area).push(entry);
  }
  for (const [area, entries] of missingByArea) {
    if (!selectedAreas.includes(area)) selectedAreas.push(area);
    if (!reasons[area]) reasons[area] = [];
    for (const entry of entries) {
      const reason = `registry-missing:${entry.registry} ${entry.name}@${entry.version}`;
      if (!reasons[area].includes(reason)) reasons[area].push(reason);
    }
  }
  selectedAreas = registeredAreas.filter((area) => selectedAreas.includes(area));

  return {
    parsed,
    head,
    baseline,
    firstRelease,
    changedPaths,
    unlistedPaths,
    selectedAreas,
    reasons,
    registryState: state,
    missingVersions,
    graph,
    inspectedAreas: [...registeredAreas],
    registeredAreas,
  };
}

// A matrix job per area cannot order one area after another. A cross-area
// dependency is therefore allowed only when the dependency version already
// exists in the registry; otherwise the coordinator fails before any upload
// and says which area must be released first. std and os are independent today.
export function crossAreaDependencyErrors({ graph, registryState, plan }) {
  const errors = [];
  const check = (registry, planned, dependencies, byName) => {
    for (const entry of planned) {
      if (entry.action !== "publish") continue;
      for (const name of dependencies.get(entry.name) ?? []) {
        const target = byName.get(name);
        if (!target || target.area === entry.area) continue;
        const state = registryState[target.area]?.[registry]?.find(
          (candidate) =>
            candidate.name === target.name && candidate.version === target.version,
        );
        if (!state) {
          errors.push(
            `${entry.name}@${entry.version} (${entry.area}) depends on ` +
              `${target.name}@${target.version} (${target.area}), but that area was not inspected`,
          );
          continue;
        }
        if (!state.exists) {
          errors.push(
            `${entry.name}@${entry.version} (${entry.area}) depends on ` +
              `${target.name}@${target.version} (${target.area}), which is not published; ` +
              `publish ${target.area} first because one run cannot order separate area jobs`,
          );
        }
      }
    }
  };
  check("jsr", plan.jsr ?? [], graph.jsrDeps, graph.jsrByName);
  check("npm", plan.npm ?? [], graph.npmDeps, graph.npmByName);
  return errors;
}

export function validatePlanForAreas({ root, plan, areas }) {
  const errors = [];
  const plannedAreas = Array.isArray(plan.areas) ? [...plan.areas].sort() : null;
  const expectedAreas = [...areas].sort();
  if (plannedAreas === null) {
    errors.push("plan.areas is not an array");
  } else if (JSON.stringify(plannedAreas) !== JSON.stringify(expectedAreas)) {
    errors.push(
      `plan.areas ${JSON.stringify(plannedAreas)} does not match selected areas ` +
        JSON.stringify(expectedAreas),
    );
  }
  for (const area of areas) {
    const areaPlan = {
      areas: [area],
      jsr: (plan.jsr ?? []).filter((entry) => entry.area === area),
      npm: (plan.npm ?? []).filter((entry) => entry.area === area),
      errors: plan.errors ?? [],
    };
    const normalized = normalizePlan(
      areaPlan,
      area,
      expectedPackagesForArea(root, area),
    );
    errors.push(...normalized.fatal);
  }
  return errors;
}

export function buildMatrix({ areas, graph }) {
  if (areas.length === 0) {
    // GitHub rejects a matrix with no rows. A sentinel row keeps the JSON
    // valid; the publish job is gated on has_areas and never runs it.
    return {
      include: [{ area: NO_AREA, jsr: 0, npm: 0, packages: 0, skip: true }],
    };
  }
  return {
    include: areas.map((area) => {
      const jsr = graph.jsr.filter((entry) => entry.area === area).length;
      const npm = graph.npm.filter((entry) => entry.area === area).length;
      return { area, jsr, npm, packages: jsr + npm };
    }),
  };
}

// ---------------------------------------------------------------------------
// Plan and artifacts

export async function coordinateRelease({
  repo,
  root,
  tag,
  registryPath = null,
  fetchImpl = fetch,
  buildPlanImpl = buildPlan,
  dryRunDeno,
  pack,
  tempRoot = null,
  headSha = null,
  allowMissingTag = false,
  requireAnnotated = true,
}) {
  const registry = loadAreaRegistry(
    root,
    registryPath ? { path: registryPath } : {},
  );
  const selection = await resolveReleaseAreas({
    repo,
    root,
    tag,
    registry,
    fetchImpl,
    headSha,
    allowMissingTag,
    requireAnnotated,
  });

  const createdTemp = tempRoot === null;
  const temp = tempRoot ?? mkdtempSync(join(tmpdir(), "js-lib-coordinator-"));
  try {
    let plan;
    if (selection.selectedAreas.length === 0) {
      plan = { areas: [], jsr: [], npm: [], errors: [] };
    } else {
      try {
        plan = await buildPlanImpl({
          root,
          areas: selection.selectedAreas,
          fetchImpl,
          dryRunDeno,
          pack,
          tempRoot: temp,
        });
      } catch (error) {
        plan = {
          areas: selection.selectedAreas,
          jsr: [],
          npm: [],
          errors: [messageOf(error)],
        };
      }
    }

    plan = {
      areas: selection.selectedAreas,
      jsr: Array.isArray(plan.jsr) ? plan.jsr : [],
      npm: Array.isArray(plan.npm) ? plan.npm : [],
      errors: Array.isArray(plan.errors) ? plan.errors : [],
    };

    const serialized = serializePlan(plan, root);
    const errors = [...serialized.errors];
    errors.push(
      ...validatePlanForAreas({
        root,
        plan: serialized,
        areas: selection.selectedAreas,
      }),
    );
    errors.push(
      ...crossAreaDependencyErrors({
        graph: selection.graph,
        registryState: selection.registryState,
        plan: serialized,
      }),
    );

    const validatedPlan = { ...serialized, errors };
    let notes;
    try {
      notes = generateReleaseNotesForAreas({
        repo,
        root,
        tag,
        plan: validatedPlan,
        areas: selection.selectedAreas,
        headSha: selection.head,
        baseline: selection.baseline,
        knownAreas: registry.areas.map((area) => area.name),
        registry,
      }).markdown;
    } catch (error) {
      errors.push(`release notes could not be generated: ${messageOf(error)}`);
      notes = failureNotes(tag, errors);
    }

    const matrix = buildMatrix({
      areas: selection.selectedAreas,
      graph: selection.graph,
    });
    const rationale = buildRationale({
      tag,
      selection,
      registry,
      plan: validatedPlan,
    });

    return {
      ok: errors.length === 0,
      errors,
      plan: validatedPlan,
      notes,
      matrix,
      rationale,
      selection,
    };
  } finally {
    if (createdTemp) rmSync(temp, { recursive: true, force: true });
  }
}

function buildRationale({ tag, selection, registry, plan }) {
  return {
    tag,
    kind: selection.parsed.kind,
    head: selection.head,
    registry: registry.source ?? null,
    registeredAreas: selection.registeredAreas,
    selectedAreas: selection.selectedAreas,
    firstRelease: selection.firstRelease,
    baseline: selection.baseline,
    changedPaths: selection.changedPaths,
    unlistedPaths: selection.unlistedPaths,
    reasons: selection.reasons,
    missingVersions: selection.missingVersions,
    registryState: selection.registryState,
    plan: {
      areas: plan.areas,
      jsr: plan.jsr.map((entry) => ({
        area: entry.area,
        name: entry.name,
        version: entry.version,
        action: entry.action,
      })),
      npm: plan.npm.map((entry) => ({
        area: entry.area,
        name: entry.name,
        version: entry.version,
        action: entry.action,
        tag: entry.tag ?? null,
      })),
      errors: plan.errors,
    },
  };
}

function failureNotes(tag, errors) {
  const lines = [
    `# Release notes: ${codeSpan(tag)}`,
    "",
    "## Preflight failed",
    "",
    "The coordinator did not produce a valid release plan. Nothing is scheduled to publish.",
    "",
  ];
  for (const error of errors) lines.push(`- ${escapeMarkdown(error)}`);
  return `${lines.join("\n").trimEnd()}\n`;
}

export function writeCoordinatorArtifacts({
  planJson,
  notes,
  rationale,
  matrix,
  result,
}) {
  mkdirSync(dirname(resolve(planJson)), { recursive: true });
  writeFileSync(planJson, `${JSON.stringify(result.plan, null, 2)}\n`, "utf8");

  mkdirSync(dirname(resolve(notes)), { recursive: true });
  writeFileSync(notes, result.notes, "utf8");

  mkdirSync(dirname(resolve(rationale)), { recursive: true });
  writeFileSync(
    rationale,
    `${JSON.stringify(result.rationale, null, 2)}\n`,
    "utf8",
  );

  if (matrix) {
    mkdirSync(dirname(resolve(matrix)), { recursive: true });
    writeFileSync(matrix, `${JSON.stringify(result.matrix, null, 2)}\n`, "utf8");
  }
}

export function writeGithubOutput(path, outputs) {
  if (!path) return;
  const lines = [];
  for (const [key, value] of Object.entries(outputs)) {
    const text = String(value);
    if (/[\r\n]/.test(text)) {
      throw new Error(`GitHub output ${key} must be a single line`);
    }
    lines.push(`${key}=${text}`);
  }
  appendFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

// ---------------------------------------------------------------------------
// CLI

function parseArgs(argv) {
  const options = {
    tag: process.env.RELEASE_TAG ?? null,
    repo: null,
    root: null,
    registry: null,
    planJson: ".build/release-plan.json",
    notes: ".build/release-notes.md",
    rationale: ".build/release-rationale.json",
    matrix: ".build/release-matrix.json",
    githubOutput: process.env.GITHUB_OUTPUT ?? null,
    allowMissingTag: false,
  };
  let mode = null;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const value = () => {
      const next = argv[++index];
      if (next === undefined) throw new Error(`${arg} needs a value`);
      return next;
    };
    if (arg === "plan") {
      if (mode !== null) throw new Error(`mode given twice: ${mode} and plan`);
      mode = "plan";
    } else if (arg === "--tag") options.tag = value();
    else if (arg === "--repo") options.repo = value();
    else if (arg === "--root") options.root = value();
    else if (arg === "--registry") options.registry = value();
    else if (arg === "--plan-json") options.planJson = value();
    else if (arg === "--notes") options.notes = value();
    else if (arg === "--rationale") options.rationale = value();
    else if (arg === "--matrix-json") options.matrix = value();
    else if (arg === "--github-output") options.githubOutput = value();
    else if (arg === "--allow-missing-tag") options.allowMissingTag = true;
    else throw new Error(`unknown argument ${arg}`);
  }
  if (mode === null) throw new Error("mode must be plan");
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  try {
    const root = resolve(options.root ?? satelliteRoot());
    const repo = resolve(options.repo ?? defaultRepo());
    const result = await coordinateRelease({
      repo,
      root,
      tag: options.tag,
      registryPath: options.registry ? resolve(options.registry) : null,
      allowMissingTag: options.allowMissingTag,
    });

    writeCoordinatorArtifacts({
      planJson: options.planJson,
      notes: options.notes,
      rationale: options.rationale,
      matrix: options.matrix,
      result,
    });

    const selected = result.rationale.selectedAreas;
    writeGithubOutput(options.githubOutput, {
      has_areas: result.ok && selected.length > 0 ? "true" : "false",
      matrix: JSON.stringify(result.matrix),
      plan: JSON.stringify(result.plan),
      selected_areas: selected.join(","),
      baseline: result.rationale.baseline?.name ?? "",
    });

    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, result.notes, "utf8");
    }

    console.log(
      `release coordinator: ${options.tag} (${result.rationale.kind}) ` +
        `selected ${selected.length === 0 ? "no area" : selected.join(", ")}; ` +
        `baseline ${result.rationale.baseline?.name ?? "none"}; ` +
        `${result.plan.jsr.length + result.plan.npm.length} package(s), ` +
        `${result.errors.length} error(s)`,
    );
    if (!result.ok) {
      for (const error of result.errors) console.error(`error: ${error}`);
      process.exitCode = 1;
    }
  } catch (error) {
    // A registry outage or an invalid tree must still leave an explanation.
    // Do not overwrite artifacts a successful run already wrote.
    try {
      if (!existsSync(options.rationale)) {
        mkdirSync(dirname(resolve(options.rationale)), { recursive: true });
        writeFileSync(
          options.rationale,
          `${JSON.stringify({ tag: options.tag, error: messageOf(error) }, null, 2)}\n`,
          "utf8",
        );
      }
      if (!existsSync(options.notes)) {
        mkdirSync(dirname(resolve(options.notes)), { recursive: true });
        writeFileSync(options.notes, failureNotes(options.tag, [messageOf(error)]), "utf8");
      }
    } catch {
      // The original error is the one worth printing.
    }
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`error: ${error.message}`);
    process.exit(1);
  });
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
