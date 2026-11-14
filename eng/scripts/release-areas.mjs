// Area registry, release tag parsing, and path classification.
//
// The registry is the only place that lists publishable areas. A release tag
// does not name an area: `vYYYY.MM.DD-r.N` covers whichever registered areas
// changed, or still have a manifest version that is absent from a registry.
// Legacy area tags (`std/v*`, `js/v*`, `os/v*`) remain supported and select
// exactly one area.
//
// This module is pure except for `loadAreaRegistry`, which reads one JSON file
// and optionally checks the tree. It never contacts a registry.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const REGISTRY_PATH = "eng/release-areas.json";

// Anything not under a registered area is shared unless it is listed here.
// A shared change affects every registered area, because release tooling,
// generated manifests, and root configuration are used by all of them.
export const DEFAULT_SHARED_PATHS = [
  "AGENTS.md",
  "LICENSE.md",
  "README.md",
  ".gitattributes",
  ".gitignore",
  "deno.json",
  "ende.json",
  "package.json",
  "pnpm-lock.yaml",
  ".agents",
  ".github",
  "docs",
  "eng",
];

export const RELEASE_TAG_PATTERN = /^v(\d{4})\.(\d{2})\.(\d{2})-r\.([1-9]\d*)$/;

const LEGACY_SUFFIX_PATTERN = /^(\d{4})\.(\d{2})\.(\d{2})-r\.([1-9]\d*)$/;
const AREA_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const LEGACY_PREFIX_PATTERN = /^[a-z][a-z0-9-]*\/v$/;

export function defaultAreaRegistry() {
  return normalizeAreaRegistry({
    areas: [
      { name: "std", legacyTagPrefixes: ["std/v", "js/v"] },
      { name: "os", legacyTagPrefixes: ["os/v"] },
    ],
    sharedPaths: DEFAULT_SHARED_PATHS,
  });
}

// `fallback` is for a local preview of a legacy tag in a checkout that predates
// the registry. Production paths pass a real registry and fail if it is absent.
export function loadAreaRegistry(root, options = {}) {
  const path = options.path ?? join(root, REGISTRY_PATH);
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if (options.fallback) return { ...defaultAreaRegistry(), source: "builtin" };
    throw new Error(`cannot read area registry ${path}: ${messageOf(error)}`);
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${path}: invalid JSON: ${messageOf(error)}`);
  }
  const registry = normalizeAreaRegistry(json);
  const source = relative(root, path).split("\\").join("/");
  registry.source = source && !source.startsWith("..") ? source : path;
  if (options.checkTree !== false) validateRegistryAgainstTree(registry, root);
  return registry;
}

export function normalizeAreaRegistry(json) {
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("area registry must be an object");
  }
  for (const key of Object.keys(json)) {
    if (key !== "areas" && key !== "sharedPaths") {
      throw new Error(`area registry has an unknown key ${key}`);
    }
  }
  if (!Array.isArray(json.areas) || json.areas.length === 0) {
    throw new Error("area registry.areas must be a non-empty array");
  }

  const areas = [];
  const names = new Set();
  const legacyPrefixes = [];
  for (const [index, raw] of json.areas.entries()) {
    const where = `area registry.areas[${index}]`;
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`${where} must be an object`);
    }
    for (const key of Object.keys(raw)) {
      if (key !== "name" && key !== "legacyTagPrefixes") {
        throw new Error(`${where} has an unknown key ${key}`);
      }
    }
    if (typeof raw.name !== "string" || !AREA_NAME_PATTERN.test(raw.name)) {
      throw new Error(`${where}.name must match ${AREA_NAME_PATTERN}`);
    }
    if (names.has(raw.name)) {
      throw new Error(`duplicate area ${raw.name}`);
    }
    names.add(raw.name);

    const prefixes = [];
    if (raw.legacyTagPrefixes !== undefined) {
      if (!Array.isArray(raw.legacyTagPrefixes)) {
        throw new Error(`${where}.legacyTagPrefixes must be an array`);
      }
      for (const prefix of raw.legacyTagPrefixes) {
        if (typeof prefix !== "string" || !LEGACY_PREFIX_PATTERN.test(prefix)) {
          throw new Error(`${where}.legacyTagPrefixes entry must match ${LEGACY_PREFIX_PATTERN}`);
        }
        if (legacyPrefixes.some((entry) => entry.prefix === prefix)) {
          throw new Error(`duplicate legacy tag prefix ${prefix}`);
        }
        prefixes.push(prefix);
        legacyPrefixes.push({ prefix, area: raw.name });
      }
    }
    areas.push({ name: raw.name, legacyTagPrefixes: prefixes });
  }

  const sharedPaths = normalizeSharedPaths(json.sharedPaths ?? DEFAULT_SHARED_PATHS, names);
  return { areas, sharedPaths, legacyPrefixes };
}

function normalizeSharedPaths(raw, areaNames) {
  if (!Array.isArray(raw)) throw new Error("area registry.sharedPaths must be an array");
  const seen = new Set();
  const out = [];
  for (const [index, value] of raw.entries()) {
    if (typeof value !== "string") {
      throw new Error(`area registry.sharedPaths[${index}] must be a string`);
    }
    const path = normalizeRepoPath(value);
    if (!path) throw new Error(`area registry.sharedPaths[${index}] is empty`);
    if (path.startsWith("/") || path.split("/").includes("..")) {
      throw new Error(`area registry.sharedPaths[${index}] must be relative and inside the tree`);
    }
    if (seen.has(path)) throw new Error(`duplicate shared path ${path}`);
    seen.add(path);
    for (const area of areaNames) {
      if (path === area || path.startsWith(`${area}/`) || area.startsWith(`${path}/`)) {
        throw new Error(`shared path ${path} overlaps area ${area}`);
      }
    }
    out.push(path);
  }
  return out;
}

export function validateRegistryAgainstTree(registry, root) {
  const errors = [];
  const registered = new Set(registry.areas.map((area) => area.name));
  for (const area of registry.areas) {
    const dir = join(root, area.name);
    if (!isDirectory(dir)) {
      errors.push(`registered area ${area.name} is not a directory: ${dir}`);
      continue;
    }
    if (!isDirectory(join(dir, "jsr")) && !isDirectory(join(dir, "npm"))) {
      errors.push(`registered area ${area.name} has neither jsr/ nor npm/`);
    }
  }
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (registered.has(entry.name)) continue;
    const dir = join(root, entry.name);
    if (isDirectory(join(dir, "jsr")) || isDirectory(join(dir, "npm"))) {
      errors.push(
        `unregistered area ${entry.name}: add it to ${REGISTRY_PATH} or remove its jsr/npm directory`,
      );
    }
  }
  if (errors.length > 0) throw new Error(errors.join("; "));
}

// The tag's date is part of its identity. Reject a date that looks like
// YYYY.MM.DD but cannot exist, instead of treating `2026.02.31` as a release.
export function parseReleaseTag(tag, registry = defaultAreaRegistry()) {
  if (typeof tag !== "string" || tag.length === 0) {
    throw new Error("release tag is required");
  }

  const release = RELEASE_TAG_PATTERN.exec(tag);
  if (release) {
    return {
      kind: "release",
      tag,
      date: validateDateParts(release[1], release[2], release[3], tag),
      revision: Number(release[4]),
    };
  }

  for (const area of registry.areas) {
    for (const prefix of area.legacyTagPrefixes ?? []) {
      if (!tag.startsWith(prefix)) continue;
      const suffix = tag.slice(prefix.length);
      const match = LEGACY_SUFFIX_PATTERN.exec(suffix);
      if (!match) {
        throw new Error(`invalid area release tag ${tag}; use ${prefix}YYYY.MM.DD-r.N`);
      }
      return {
        kind: "legacy",
        tag,
        area: area.name,
        prefix,
        date: validateDateParts(match[1], match[2], match[3], tag),
        revision: Number(match[4]),
      };
    }
  }

  const examples = registry.areas.flatMap((area) =>
    (area.legacyTagPrefixes ?? []).map((prefix) => `${prefix}YYYY.MM.DD-r.N`),
  );
  throw new Error(
    `unsupported release tag ${tag}; use vYYYY.MM.DD-r.N` +
      (examples.length > 0 ? ` or ${examples.join(", ")}` : ""),
  );
}

function validateDateParts(year, month, day, tag) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    throw new Error(`release tag ${tag} has an invalid date`);
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    throw new Error(`release tag ${tag} has an invalid date`);
  }
  return `${year}-${month}-${day}`;
}

export function normalizeRepoPath(value) {
  return String(value ?? "")
    .split("\\")
    .join("/")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "");
}

export function pathMatchesPrefix(path, prefix) {
  const normalizedPath = normalizeRepoPath(path);
  const normalizedPrefix = normalizeRepoPath(prefix);
  if (!normalizedPath || !normalizedPrefix) return false;
  return (
    normalizedPath === normalizedPrefix ||
    normalizedPath.startsWith(`${normalizedPrefix}/`)
  );
}

// A path under a registered area belongs to that area, even when it is a README
// inside a package: packaged docs are part of what that area publishes. A path
// outside every area is shared and affects every area. The fallback is
// deliberately conservative: an unlisted root file or directory selects every
// area rather than letting a release silently omit it.
export function classifyChangedPaths({ paths, registry }) {
  const areaNames = registry.areas.map((area) => area.name);
  const reasons = new Map(areaNames.map((name) => [name, []]));
  const unlisted = [];
  const add = (area, reason) => {
    const list = reasons.get(area);
    if (list && !list.includes(reason)) list.push(reason);
  };

  for (const raw of paths ?? []) {
    const path = normalizeRepoPath(raw);
    if (!path) continue;
    const area = areaNames.find(
      (name) => path === name || path.startsWith(`${name}/`),
    );
    if (area !== undefined) {
      add(area, `path:${path}`);
      continue;
    }
    if (registry.sharedPaths.some((prefix) => pathMatchesPrefix(path, prefix))) {
      for (const name of areaNames) add(name, `shared:${path}`);
      continue;
    }
    unlisted.push(path);
    for (const name of areaNames) add(name, `unlisted:${path}`);
  }

  const selected = areaNames.filter((name) => (reasons.get(name) ?? []).length > 0);
  return {
    selected,
    reasons: Object.fromEntries(selected.map((name) => [name, reasons.get(name)])),
    unlisted,
  };
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
