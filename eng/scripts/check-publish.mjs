// Fail if a JSR or npm publish would contain a test, the harness, or a
// workspace: link. JSR follows imports, so an export that imports either
// fails even when publish.exclude would have left the file out.

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  importSpecifiers,
  isHarnessFile,
  isTestFile,
  loadWorkspace,
  relativeSpecifier,
  resolveSpecifier,
  rewriteImports,
  satelliteRoot,
} from "./workspace-map.mjs";

const requiredExclude = [
  "**/*.test.ts",
  "**/*_test.ts",
  "**/*.test.js",
  "**/*_test.js",
  "**/*.test.mjs",
  "**/*_test.mjs",
  "**/*.test.cjs",
  "**/*_test.cjs",
  "**/*.test.d.ts",
  "**/*_test.d.ts",
  "**/*.spec.ts",
  "**/*_spec.ts",
  "**/test/run.ts",
  "**/test/assert.ts",
  "**/test/main.ts",
  "ende.json",
  "ende.jsonc",
];

const root = satelliteRoot();
const failures = [];

checkWorkspaceMap();
const jsr = jsrPackages();
if (jsr.length === 0) fail("no JSR packages under */jsr/*/deno.json");
for (const manifest of jsr) checkJsr(manifest);
for (const manifest of npmPackages()) checkNpm(manifest);
if (npmPackages().length === 0) console.log("No npm packages. Nothing to pack.");

if (failures.length > 0) {
  for (const message of failures) console.error(message);
  process.exit(1);
}
console.log(`publish excludes tests (${jsr.length} jsr package${jsr.length === 1 ? "" : "s"})`);

function checkWorkspaceMap() {
  const workspace = loadWorkspace(root);
  const chars = resolveSpecifier(workspace, "@neotales/chars");
  const ascii = resolveSpecifier(workspace, "@neotales/chars/is-ascii");
  if (!chars || !norm(chars).endsWith("std/jsr/chars/mod.ts")) {
    fail("workspace map did not resolve @neotales/chars to std/jsr/chars/mod.ts");
  }
  if (!ascii || !norm(ascii).endsWith("std/jsr/chars/is_ascii.ts")) {
    fail("workspace map did not resolve @neotales/chars/is-ascii");
  }
  if (resolveSpecifier(workspace, "@neotales/chars/is") !== null) {
    fail("workspace map resolved an export that does not exist");
  }
  if (resolveSpecifier(workspace, "node:fs") !== undefined) {
    fail("workspace map claimed a non-workspace specifier");
  }
  const sample = 'import { a } from "@neotales/chars/is-ascii";\n/** import { b } from "@neotales/chars/is"; */\n';
  const from = join(root, "std/jsr/other/mod.ts");
  const rewritten = rewriteImports(sample, from, workspace, "ts");
  const expected = relativeSpecifier(from, ascii, "ts");
  if (!rewritten.includes(expected) || !rewritten.includes("@neotales/chars/is")) {
    fail("rewrite changed a comment or missed a workspace import");
  }
}

function checkJsr(manifest) {
  const dir = dirname(manifest);
  const json = JSON.parse(readFileSync(manifest, "utf8"));
  const exclude = json.publish?.exclude ?? [];
  for (const pattern of requiredExclude) {
    if (!exclude.includes(pattern)) fail(`${manifest}: publish.exclude is missing ${pattern}`);
  }
  const config = JSON.parse(readFileSync(join(root, "deno.json"), "utf8"));
  const globs = config.workspace ?? [];
  if (!covered(globs, norm(relative(root, dir)))) {
    fail(`${manifest}: not a member of the satellite deno.json workspace`);
  }
  for (const target of exportTargets(json.exports)) {
    if (isTestFile(target) || isHarnessFile(target)) {
      fail(`${manifest}: export ${target} is a test or the harness`);
    }
    walkExport(dir, resolve(dir, target), new Set());
  }
  for (const file of dryRun(dir)) {
    const rel = relative(dir, file);
    if (rel.startsWith("..") || rel === "") {
      fail(`${manifest}: dry run included ${file}, which is outside the package`);
      continue;
    }
    if (isTestFile(file) || isHarnessFile(file) || isEndeConfig(file)) {
      fail(`${manifest}: dry run included ${rel}`);
    }
  }
}

function checkNpm(manifest) {
  const text = readFileSync(manifest, "utf8");
  if (text.includes("workspace:")) {
    fail(`${manifest}: contains workspace:. npm publish does not rewrite it`);
  }
  for (const path of packFiles(dirname(manifest))) {
    if (isTestFile(path) || isHarnessFile(path) || isEndeConfig(path)) {
      fail(`${manifest}: pack included ${path}`);
    }
  }
}

function walkExport(dir, file, seen) {
  if (seen.has(file)) return;
  seen.add(file);
  const rel = relative(dir, file);
  if (rel.startsWith("..")) {
    fail(`${dir}: export graph leaves the package at ${file}`);
    return;
  }
  if (isTestFile(file) || isHarnessFile(file)) {
    fail(`${dir}: export graph includes ${rel}`);
    return;
  }
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    fail(`${dir}: export graph is missing ${rel}`);
    return;
  }
  for (const spec of importSpecifiers(source)) {
    if (!spec.startsWith(".")) continue;
    walkExport(dir, resolve(dirname(file), spec), seen);
  }
}

function dryRun(dir) {
  const result = spawnSync("deno", [
    "publish",
    "--dry-run",
    "--allow-dirty",
    "--no-check",
    "--no-provenance",
  ], { cwd: dir, encoding: "utf8" });
  if (result.error) {
    fail(`deno is required to check a JSR publish: ${result.error.message}`);
    return [];
  }
  if (result.status !== 0) {
    fail(`deno publish --dry-run failed in ${dir}\n${result.stderr}`);
    return [];
  }
  const files = [];
  for (const line of `${result.stdout}\n${result.stderr}`.split("\n")) {
    const match = line.match(/(file:\/\/\S+)/);
    if (match) files.push(fileURLToPath(match[1]));
  }
  if (files.length === 0) fail(`deno publish --dry-run listed no files in ${dir}`);
  return files;
}

function packFiles(dir) {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: dir,
    encoding: "utf8",
  });
  if (result.error) {
    fail(`npm is required to check a pack: ${result.error.message}`);
    return [];
  }
  if (result.status !== 0) {
    fail(`npm pack --dry-run failed in ${dir}\n${result.stderr}`);
    return [];
  }
  const start = result.stdout.indexOf("[");
  if (start < 0) {
    fail(`npm pack --dry-run did not print JSON in ${dir}`);
    return [];
  }
  const parsed = JSON.parse(result.stdout.slice(start));
  return (parsed[0]?.files ?? []).map((file) => file.path);
}

function jsrPackages() {
  return areaPackages("jsr", "deno.json");
}

function npmPackages() {
  return areaPackages("npm", "package.json");
}

function areaPackages(kind, file) {
  const found = [];
  for (const area of readdirSync(root)) {
    const dir = join(root, area, kind);
    if (!isDir(dir)) continue;
    for (const name of readdirSync(dir)) {
      const manifest = join(dir, name, file);
      if (isFile(manifest)) found.push(manifest);
    }
  }
  return found;
}

function exportTargets(exports) {
  if (typeof exports === "string") return [exports];
  if (!exports || typeof exports !== "object") return [];
  return Object.values(exports).filter((value) => typeof value === "string");
}

function covered(globs, relDir) {
  for (const glob of globs) {
    const pattern = glob.replace(/^\.\//, "");
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      const rest = relDir.slice(prefix.length + 1);
      if (relDir.startsWith(`${prefix}/`) && rest.length > 0 && !rest.includes("/")) return true;
    } else if (pattern === relDir) {
      return true;
    }
  }
  return false;
}

function fail(message) {
  failures.push(message);
}

function norm(path) {
  return path.split("\\").join("/");
}

function isEndeConfig(path) {
  return /(?:^|\/)ende\.jsonc?$/.test(norm(path));
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
