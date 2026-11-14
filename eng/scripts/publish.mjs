// Plan and execute a js-lib release.
//
// `preflight` does every check the publish step needs, including a
// release-equivalent `deno publish --dry-run` for every JSR package and a
// `pnpm pack` integrity check for every npm package. It does not upload and
// does not authenticate to either registry.
//
// `publish` runs the same plan again, then uploads in dependency order. An
// existing npm version is skipped only after its exact tarball integrity
// matches. An existing JSR version is logged and skipped: Deno publishes only
// unpublished versions, and there is no local publish artifact to compare with
// what the registry holds. The skip therefore records a known limitation, not
// a claim that the published content is identical. A version that appears
// after the plan, or that Deno reports as already published or already in
// progress with a zero exit, is skipped the same way. A non-zero exit, a
// network error, or malformed metadata still fails closed.
//
// This is not an OIDC test. A dry run cannot prove that the trusted publisher
// accepts the workflow; only a real publish can.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  importSpecifiers,
  isHarnessFile,
  isTestFile,
  satelliteRoot,
} from "./workspace-map.mjs";

const JSR_ORIGIN = "https://jsr.io";
const NPM_ORIGIN = "https://registry.npmjs.org";
const JSR_HEADERS = { accept: "application/json" };
const JSR_NOT_FOUND = Symbol("jsr-not-found");
const JSR_SKIP_NOTE =
  "JSR content is not verified; bump the version to change published code";

// ---------------------------------------------------------------------------
// Pure helpers (unit tested)

export function parseVersion(version) {
  const match =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
      .exec(version);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
    build: match[5] ?? null,
  };
}

// A prerelease that is not alpha.N, beta.N, or rc.N must not be published to
// `latest`. Reject it before any upload instead of guessing a tag.
export function distTag(version) {
  const parsed = parseVersion(version);
  if (!parsed) throw new Error(`not a SemVer version: ${version}`);
  if (parsed.prerelease === null) return "latest";
  const match = /^(alpha|beta|rc)\.(\d+)$/.exec(parsed.prerelease);
  if (!match) {
    throw new Error(
      `unrecognized prerelease ${version}; use alpha.N, beta.N, or rc.N`,
    );
  }
  return match[1];
}

export function areasForTag(tag) {
  if (/^std\/v/.test(tag) || /^js\/v/.test(tag)) return ["std"];
  if (/^os\/v/.test(tag)) return ["os"];
  throw new Error(
    `unsupported release tag ${tag}; use std/v*, js/v*, or os/v*`,
  );
}

export function integrityOfBuffer(bytes) {
  return {
    sha512: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
    shasum: createHash("sha1").update(bytes).digest("hex"),
  };
}

// The registry always exposes sha512 integrity. A version that exists with a
// different tarball is a release that already happened with other code. Fail.
export function sameNpmArtifact(local, remote) {
  if (!remote || typeof remote.integrity !== "string") {
    throw new Error("registry did not return dist.integrity; cannot verify");
  }
  return remote.integrity === local.sha512;
}

// The npm twin is generated from the JSR source. A release must not ship two
// different versions of the same module.
export function checkVersionPairs(jsr, npm) {
  const byName = new Map(jsr.map((pkg) => [pkg.name, pkg]));
  const errors = [];
  for (const pkg of npm) {
    const source = byName.get(pkg.name);
    if (!source) {
      errors.push(`npm package ${pkg.name} has no JSR source`);
    } else if (source.version !== pkg.version) {
      errors.push(
        `${pkg.name}: JSR ${source.version} does not match npm ${pkg.version}`,
      );
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Discovery and ordering

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isEndeConfig(path) {
  return /(?:^|\/)ende\.jsonc?$/.test(path.split("\\").join("/"));
}

function walk(directory, predicate, found = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".build") continue;
      walk(path, predicate, found);
    } else if (entry.isFile() && predicate(path)) {
      found.push(path);
    }
  }
  return found;
}

function discover(root, areas) {
  const jsr = [];
  const npm = [];
  for (const area of areas) {
    const jsrRoot = join(root, area, "jsr");
    if (isDirectory(jsrRoot)) {
      for (const name of readdirSync(jsrRoot)) {
        const dir = join(jsrRoot, name);
        const manifest = join(dir, "deno.json");
        if (!isFile(manifest)) continue;
        const json = readJson(manifest);
        if (json.publish === false) continue;
        if (!json.name || !json.version) {
          throw new Error(`${manifest}: name and version are required`);
        }
        jsr.push({ area, dir, name: json.name, version: json.version });
      }
    }
    const npmRoot = join(root, area, "npm");
    if (isDirectory(npmRoot)) {
      for (const name of readdirSync(npmRoot)) {
        const dir = join(npmRoot, name);
        const manifest = join(dir, "package.json");
        if (!isFile(manifest)) continue;
        const json = readJson(manifest);
        if (!json.name || !json.version) {
          throw new Error(`${manifest}: name and version are required`);
        }
        npm.push({ area, dir, name: json.name, version: json.version });
      }
    }
  }
  return { jsr, npm };
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// Release notes validate a plan against the manifests in the checkout. The
// same discovery keeps both sides from drifting: a name or directory that the
// publisher would not discover is not a package in this release.
export function discoverPackages(root, areas) {
  return discover(root, areas);
}

function jsrDependencies(packageInfo, byName) {
  const deps = new Set();
  for (const file of walk(packageInfo.dir, (path) => path.endsWith(".ts"))) {
    if (isTestFile(file) || isHarnessFile(file)) continue;
    const source = readFileSync(file, "utf8");
    for (const specifier of importSpecifiers(source)) {
      const match = /^(@neotales\/[a-z0-9-]+)/.exec(specifier);
      if (!match || match[1] === packageInfo.name) continue;
      if (!byName.has(match[1])) {
        throw new Error(
          `${packageInfo.name}: imports ${match[1]}, which is not in this release plan`,
        );
      }
      deps.add(match[1]);
    }
  }
  return deps;
}

function npmDependencies(packageInfo, byName) {
  const json = readJson(join(packageInfo.dir, "package.json"));
  const deps = new Set();
  for (const field of ["dependencies", "optionalDependencies"]) {
    for (const [name, range] of Object.entries(json[field] ?? {})) {
      if (typeof range !== "string" || !range.startsWith("workspace:")) continue;
      if (!byName.has(name)) {
        throw new Error(
          `${packageInfo.name}: depends on workspace package ${name}, which is not in this release plan`,
        );
      }
      deps.add(name);
    }
  }
  return deps;
}

export function topoSort(packages, dependenciesOf) {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const state = new Map();
  const ordered = [];
  const visit = (name, stack) => {
    const mark = state.get(name);
    if (mark === "done") return;
    if (mark === "visiting") {
      throw new Error(`workspace dependency cycle: ${[...stack, name].join(" -> ")}`);
    }
    state.set(name, "visiting");
    for (const dep of dependenciesOf(byName.get(name), byName)) {
      visit(dep, [...stack, name]);
    }
    state.set(name, "done");
    ordered.push(byName.get(name));
  };
  for (const pkg of [...packages].sort((a, b) => a.name.localeCompare(b.name))) {
    visit(pkg.name, []);
  }
  return ordered;
}

// ---------------------------------------------------------------------------
// Registry access

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: JSR_HEADERS });
  if (response.status === 404) return JSR_NOT_FOUND;
  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function assertJsrPackageMeta(meta, scope, pkg) {
  if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
    throw new Error("malformed JSR package metadata: expected an object");
  }
  if (meta.scope !== scope || meta.name !== pkg) {
    throw new Error(`malformed JSR package metadata: expected @${scope}/${pkg}`);
  }
  const versions = meta.versions;
  if (versions === null || typeof versions !== "object" || Array.isArray(versions)) {
    throw new Error("malformed JSR package metadata: versions must be an object");
  }
  for (const [version, entry] of Object.entries(versions)) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`malformed JSR package metadata: version ${version} must be an object`);
    }
  }
}

export function versionInJsrMeta(meta, version) {
  if (meta === null) return false;
  return Object.prototype.hasOwnProperty.call(meta.versions, version);
}

export async function jsrPackageMeta(name, fetchImpl) {
  const [scope, pkg] = name.slice(1).split("/");
  const meta = await fetchJson(`${JSR_ORIGIN}/@${scope}/${pkg}/meta.json`, fetchImpl);
  if (meta === JSR_NOT_FOUND) return null;
  assertJsrPackageMeta(meta, scope, pkg);
  return meta;
}

async function npmVersionState(name, version, fetchImpl) {
  const url = `${NPM_ORIGIN}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
  const response = await fetchImpl(url, { headers: { accept: "application/json" } });
  if (response.status === 404) return { exists: false };
  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  return { exists: true, dist: json.dist ?? {} };
}

// ---------------------------------------------------------------------------
// Artifact checks

function packNpm(packageInfo, destination) {
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  const result = spawnSync(
    "pnpm",
    ["--dir", packageInfo.dir, "pack", "--pack-destination", destination],
    { encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `pnpm pack failed for ${packageInfo.name}@${packageInfo.version}\n${result.stderr}`,
    );
  }
  const tarball = readdirSync(destination).find((file) => file.endsWith(".tgz"));
  if (!tarball) {
    throw new Error(`pnpm pack produced no tarball for ${packageInfo.name}`);
  }
  return join(destination, tarball);
}

function tarPackageJson(tarball) {
  const result = spawnSync("tar", ["-xOf", tarball, "package/package.json"], {
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`tar could not read package/package.json from ${tarball}\n${result.stderr}`);
  }
  return result.stdout;
}

function tarEntries(tarball) {
  const result = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`tar could not list ${tarball}\n${result.stderr}`);
  }
  return result.stdout.split("\n").filter(Boolean);
}

function checkPackedNpm(packageInfo, tarball) {
  const manifestText = tarPackageJson(tarball);
  if (manifestText.includes("workspace:")) {
    throw new Error(
      `${packageInfo.name}: packed manifest still contains a workspace: link`,
    );
  }
  for (const entry of tarEntries(tarball)) {
    const path = entry.replace(/^package\//, "");
    if (isTestFile(path) || isHarnessFile(path) || isEndeConfig(path)) {
      throw new Error(`${packageInfo.name}: pack includes ${path}`);
    }
  }
}

function parsePublishedFiles(output) {
  const files = [];
  for (const match of output.matchAll(/file:\/\/[^\s)]+/g)) {
    files.push(fileURLToPath(match[0]));
  }
  return files;
}

function checkJsrFileList(packageInfo, files) {
  if (files.length === 0) {
    throw new Error(
      `${packageInfo.name}: deno publish --dry-run listed no files`,
    );
  }
  for (const file of files) {
    const relativePath = relative(packageInfo.dir, file).split(sep).join("/");
    if (relativePath.startsWith("..")) {
      throw new Error(
        `${packageInfo.name}: dry run included ${file}, outside the package`,
      );
    }
    if (isTestFile(file) || isHarnessFile(file) || isEndeConfig(file)) {
      throw new Error(`${packageInfo.name}: dry run would publish ${relativePath}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Plan

export async function buildPlan({
  root,
  areas,
  fetchImpl = fetch,
  dryRunDeno = (packageInfo) => spawnSync("deno", ["publish", "--dry-run"], {
    cwd: packageInfo.dir,
    encoding: "utf8",
  }),
  pack = packNpm,
  tempRoot,
}) {
  const errors = [];
  const { jsr, npm } = discover(root, areas);
  errors.push(...checkVersionPairs(jsr, npm));

  const orderedJsr = topoSort(jsr, jsrDependencies);
  const orderedNpm = topoSort(npm, npmDependencies);

  for (const pkg of orderedNpm) {
    try {
      pkg.tag = distTag(pkg.version);
    } catch (error) {
      errors.push(error.message);
    }
  }

  const jsrPlan = [];
  for (const pkg of orderedJsr) {
    const result = dryRunDeno(pkg);
    if (result.error) throw result.error;
    if (result.status !== 0) {
      errors.push(
        `${pkg.name}@${pkg.version}: deno publish --dry-run failed\n${result.stderr || result.stdout}`,
      );
      jsrPlan.push({ ...pkg, action: "blocked" });
      continue;
    }
    const files = parsePublishedFiles(`${result.stdout}\n${result.stderr}`);
    try {
      checkJsrFileList(pkg, files);
    } catch (error) {
      errors.push(error.message);
      jsrPlan.push({ ...pkg, action: "blocked" });
      continue;
    }

    const meta = await jsrPackageMeta(pkg.name, fetchImpl);
    if (versionInJsrMeta(meta, pkg.version)) {
      // Deno publishes only unpublished versions, and the registry exposes no
      // artifact this script can compare with the local tree. Record the skip
      // rather than fail, and never call it verified.
      jsrPlan.push({ ...pkg, action: "skip-existing", files });
      continue;
    }
    jsrPlan.push({ ...pkg, action: "publish", files });
  }

  const npmPlan = [];
  for (const pkg of orderedNpm) {
    if (!pkg.tag) {
      npmPlan.push({ ...pkg, action: "blocked" });
      continue;
    }
    try {
      const destination = join(tempRoot, pkg.area, pkg.name.replace("/", "-"));
      const tarball = pack(pkg, destination);
      checkPackedNpm(pkg, tarball);
      const local = integrityOfBuffer(readFileSync(tarball));
      const state = await npmVersionState(pkg.name, pkg.version, fetchImpl);
      if (!state.exists) {
        npmPlan.push({ ...pkg, action: "publish", tarball, integrity: local.sha512 });
        continue;
      }
      if (!sameNpmArtifact(local, state.dist)) {
        throw new Error(
          `${pkg.name}@${pkg.version} already exists on npm with different content ` +
            `(local ${local.sha512}, registry ${state.dist.integrity}); bump the version`,
        );
      }
      npmPlan.push({ ...pkg, action: "verified-skip", tarball, integrity: local.sha512 });
    } catch (error) {
      errors.push(error.message);
      npmPlan.push({ ...pkg, action: "blocked" });
    }
  }

  return { areas, jsr: jsrPlan, npm: npmPlan, errors };
}

// ---------------------------------------------------------------------------
// Execution

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status}`);
  }
}

async function stillAbsent(pkg, fetchImpl) {
  const meta = await jsrPackageMeta(pkg.name, fetchImpl);
  return !versionInJsrMeta(meta, pkg.version);
}

export function denoPublishSkipKind(output) {
  const text = String(output ?? "");
  if (/All packages are already published/i.test(text)) {
    return "all-already-published";
  }
  if (/Skipping, already published/i.test(text)) {
    return "already-published";
  }
  if (/Already uploaded[,\s]+waiting for publishing/i.test(text)) {
    return "in-progress";
  }
  return null;
}

export function denoPublishWasSkipped(output) {
  return denoPublishSkipKind(output) !== null;
}

function jsrSkipMessage(pkg, detail) {
  return `skip existing jsr: ${pkg.name}@${pkg.version} (${detail}); ${JSR_SKIP_NOTE}`;
}

function normalizePublishResult(result) {
  if (typeof result === "string") return { status: 0, output: result };
  if (result && typeof result === "object") {
    return {
      status: Number.isInteger(result.status) ? result.status : 0,
      output: typeof result.output === "string" ? result.output : "",
    };
  }
  return { status: 0, output: String(result ?? "") };
}

function runDenoPublish(pkg) {
  const result = spawnSync("deno", ["publish"], {
    cwd: pkg.dir,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return {
    // A signal instead of an exit code is a failure, not a success.
    status: result.status ?? 1,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
}

export async function executePlan(plan, {
  fetchImpl = fetch,
  runJsr = runDenoPublish,
  runNpm = run,
} = {}) {
  for (const pkg of plan.jsr) {
    if (pkg.action === "skip-existing") {
      console.log(jsrSkipMessage(pkg, "present at preflight"));
      continue;
    }
    if (pkg.action !== "publish") {
      throw new Error(`${pkg.name}@${pkg.version} is blocked in the plan`);
    }
    // A network error or malformed metadata here must stop the release before
    // an upload; only a confirmed existing version is a skip.
    if (!(await stillAbsent(pkg, fetchImpl))) {
      console.log(jsrSkipMessage(pkg, "appeared after the plan"));
      continue;
    }
    console.log(`publishing ${pkg.name}@${pkg.version} to JSR`);
    const result = normalizePublishResult(await runJsr(pkg));
    if (result.status !== 0) {
      // Deno keeps polling an in-flight duplicate and reports a real failure
      // with a non-zero exit. That is not a skip even when the output contains
      // "Already uploaded, waiting for publishing".
      throw new Error(
        `${pkg.name}@${pkg.version}: deno publish failed with exit ${result.status}` +
          (result.output.trim() ? `\n${result.output.trim()}` : ""),
      );
    }
    const skipKind = denoPublishSkipKind(result.output);
    if (skipKind !== null) {
      console.log(jsrSkipMessage(pkg, `deno publish reported ${skipKind}`));
    }
  }

  for (const pkg of plan.npm) {
    if (pkg.action === "verified-skip") {
      console.log(`verified skip: ${pkg.name}@${pkg.version} (npm)`);
      continue;
    }
    if (pkg.action !== "publish") {
      throw new Error(`${pkg.name}@${pkg.version} is blocked in the plan`);
    }
    console.log(`publishing ${pkg.name}@${pkg.version} to npm with tag ${pkg.tag}`);
    runNpm(
      "pnpm",
      ["--dir", pkg.dir, "publish", "--access", "public", "--tag", pkg.tag],
      undefined,
    );
  }
}

// A stable view of the plan for another step. It deliberately leaves out
// absolute paths and temporary tarballs: preflight deletes that directory, and
// release notes must not depend on a path that no longer exists.
export function serializePlan(plan, root) {
  const pathOf = (pkg) => {
    if (!pkg.dir) return null;
    const path = relative(root, pkg.dir).split(sep).join("/");
    return path.startsWith("..") ? null : path;
  };
  return {
    areas: [...plan.areas],
    jsr: plan.jsr.map((pkg) => ({
      area: pkg.area,
      dir: pathOf(pkg),
      name: pkg.name,
      version: pkg.version,
      action: pkg.action,
    })),
    npm: plan.npm.map((pkg) => ({
      area: pkg.area,
      dir: pathOf(pkg),
      name: pkg.name,
      version: pkg.version,
      action: pkg.action,
      tag: pkg.tag ?? null,
    })),
    errors: [...plan.errors],
  };
}

export function printPlan(plan) {
  for (const pkg of plan.jsr) {
    const note = pkg.action === "skip-existing" ? ` (${JSR_SKIP_NOTE})` : "";
    console.log(`jsr ${pkg.action}: ${pkg.name}@${pkg.version}${note}`);
  }
  for (const pkg of plan.npm) {
    console.log(`npm ${pkg.action}: ${pkg.name}@${pkg.version} (${pkg.tag ?? "no tag"})`);
  }
  if (plan.errors.length > 0) {
    console.error("");
    for (const error of plan.errors) console.error(`error: ${error}`);
  }
}

function parseArgs(argv) {
  let mode = null;
  let planJson = null;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "preflight" || arg === "publish") {
      if (mode !== null) throw new Error(`mode given twice: ${mode} and ${arg}`);
      mode = arg;
      continue;
    }
    if (arg === "--plan-json") {
      planJson = argv[++index];
      if (!planJson) throw new Error("--plan-json needs a path");
      continue;
    }
    throw new Error(`unknown argument ${arg}`);
  }
  if (mode === null) throw new Error("mode must be preflight or publish");
  return { mode, planJson };
}

async function main() {
  const { mode, planJson } = parseArgs(process.argv.slice(2));

  const root = satelliteRoot();
  const areas = areasForTag(process.env.RELEASE_TAG ?? "");
  const tempRoot = mkdtempSync(join(tmpdir(), "js-lib-publish-"));
  try {
    const plan = await buildPlan({ root, areas, tempRoot });
    printPlan(plan);
    if (planJson) {
      mkdirSync(dirname(planJson), { recursive: true });
      writeFileSync(
        planJson,
        `${JSON.stringify(serializePlan(plan, root), null, 2)}\n`,
      );
    }
    if (plan.errors.length > 0) {
      process.exitCode = 1;
      return;
    }
    if (mode === "publish") {
      await executePlan(plan);
    } else {
      console.log("preflight complete; nothing was uploaded");
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`error: ${error.message}`);
    process.exit(1);
  });
}
