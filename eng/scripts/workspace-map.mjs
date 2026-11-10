// Map @neotales/<name> to a JSR workspace member. Deno and Ende read deno.json.
// The other lanes do not. They rewrite the specifier to a relative path before
// the file runs. A name that is not a member is a failure, not a registry fetch.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const specifier = /\b(?:from\s*|import\s*\(\s*|import\s+)(['"])([^'"]+)\1/g;

export function satelliteRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "../..");
}

export function loadWorkspace(root) {
  const members = new Map();
  for (const area of readdirSync(root)) {
    const jsr = join(root, area, "jsr");
    if (!isDir(jsr)) continue;
    for (const name of readdirSync(jsr)) {
      const dir = join(jsr, name);
      const manifest = join(dir, "deno.json");
      if (!isFile(manifest)) continue;
      const json = JSON.parse(readFileSync(manifest, "utf8"));
      if (typeof json.name !== "string") continue;
      members.set(json.name, {
        dir,
        manifest,
        exports: typeof json.exports === "string" ? { ".": json.exports } : json.exports ?? {},
      });
    }
  }
  return members;
}

// undefined: not a workspace specifier. null: a workspace specifier that does not resolve.
export function resolveSpecifier(workspace, spec) {
  const match = /^(@neotales\/[a-z0-9-]+)(\/.*)?$/.exec(spec);
  if (!match) return undefined;
  const member = workspace.get(match[1]);
  if (!member) return null;
  const key = match[2] ? `.${match[2]}` : ".";
  const target = member.exports[key];
  if (typeof target !== "string") return null;
  return resolve(member.dir, target);
}

export function relativeSpecifier(fromFile, targetFile, extension) {
  let rel = relative(dirname(fromFile), targetFile).split("\\").join("/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  if (extension === "js") rel = rel.replace(/\.ts$/, ".js");
  return rel;
}

export function importSpecifiers(source) {
  const masked = source.replace(/\/\*[\s\S]*?\*\//g, (block) => " ".repeat(block.length));
  return [...masked.matchAll(specifier)].map((match) => match[2]);
}

export function rewriteImports(source, fromFile, workspace, extension) {
  const masked = source.replace(/\/\*[\s\S]*?\*\//g, (block) => " ".repeat(block.length));
  const edits = [];
  for (const match of masked.matchAll(specifier)) {
    const spec = match[2];
    const next = mapSpecifier(spec, fromFile, workspace, extension);
    if (next === spec) continue;
    const start = match.index + match[0].indexOf(spec);
    edits.push({ start, end: start + spec.length, next });
  }
  let out = source;
  for (const edit of edits.reverse()) {
    out = out.slice(0, edit.start) + edit.next + out.slice(edit.end);
  }
  return out;
}

export function collectLocalGraph(entry, workspace = new Map()) {
  const files = [];
  const seen = new Set();
  const queue = [resolve(entry)];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    files.push(file);
    const source = readFileSync(file, "utf8");
    for (const spec of importSpecifiers(source)) {
      if (spec.startsWith(".")) {
        queue.push(resolve(dirname(file), spec));
        continue;
      }
      const target = resolveSpecifier(workspace, spec);
      if (typeof target === "string") queue.push(target);
    }
  }
  return files;
}

export function isTestFile(path) {
  const base = path.split("\\").join("/").split("/").pop();
  return /\.(?:test|spec)(?:\.d)?\.[cm]?[jt]sx?$/.test(base) ||
    /_(?:test|spec)(?:\.d)?\.[cm]?[jt]sx?$/.test(base);
}

export function isHarnessFile(path) {
  return /\/test\/(?:run|assert|main)\.[cm]?[jt]s$/.test(path.split("\\").join("/"));
}

function mapSpecifier(spec, fromFile, workspace, extension) {
  if (spec.startsWith("@neotales/")) {
    const target = resolveSpecifier(workspace, spec);
    if (target == null) {
      throw new Error(`${fromFile}: ${spec} is not a workspace export`);
    }
    return relativeSpecifier(fromFile, target, extension);
  }
  if (extension === "js" && spec.startsWith(".") && spec.endsWith(".ts")) {
    return `${spec.slice(0, -3)}.js`;
  }
  return spec;
}

function isDir(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
