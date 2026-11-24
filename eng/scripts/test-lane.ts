// Task launcher. Bun runs this file. The tests never import it, so node:fs here
// does not leak into Ende. A lane that does not run throws.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
  collectLocalGraph,
  importSpecifiers,
  loadWorkspace,
  rewriteImports,
  relativeSpecifier,
  resolveSpecifier,
} from "./workspace-map.mjs";

const root = process.env.PLAB_TEST_ROOT ?? join(import.meta.dir, "../..");
const lane = Bun.argv[2] ?? "";
const buildRoot = join(root, ".build", lane || "unknown");
const selection = Bun.argv.slice(3).filter((arg) => arg !== "--");
const runAsyncTests = lane === "async" || process.env.PLAB_ASYNC_TESTS === "1";
const lanes = ["bun", "async", "node", "deno", "ende", "workerd", "quickjs", "txiki", "clearscript", "jerry", "chromium", "firefox", "webkit"];

if (!lanes.includes(lane)) {
  console.error(`usage: bun eng/scripts/test-lane.ts <${lanes.join("|")}>`);
  throw new Error("unknown lane");
}

const suites = discoverSuites(selection);
if (suites.length === 0) throw new Error("no test suites discovered");
let failures = 0;
for (const suite of suites) {
  try {
    if (lane === "bun" || lane === "async") await runBun(suite.entry);
    else if (lane === "deno") await spawn("deno", jsRuntimeArgs(suite.entry));
    else if (lane === "ende") await spawn("ende", jsRuntimeArgs(suite.entry));
    else if (lane === "node") await spawn("node", [await bundle(suite.entry)]);
    else if (lane === "quickjs") {
      const argsProbe = process.env.QUICKJS_PROCESS_ARGS_PROBE === "1" &&
        suite.label === "std/process";
      if (process.env.QUICKJS_PROCESS_ARGS_PROBE === "1" && !argsProbe) {
        throw new Error("the QuickJS process-args probe only runs std/process");
      }
      await spawn(qjs(), [
        "--module",
        await quickjsBundle(suite.entry),
        ...(argsProbe ? ["neotales-qjs-arg-one", "neotales-qjs-arg-two"] : []),
      ]);
    }
    else if (lane === "workerd") await runWorkerd(await bundle(suite.entry));
    else if (lane === "txiki") {
      await spawn(txiki(), [
        "run",
        await bundle(suite.entry),
        ...(suite.label === "std/process" ? ["neotales-tjs-arg-one", "neotales-tjs-arg-two"] : []),
      ]);
    }
    else if (lane === "jerry") await spawn(jerry(), [await jerryBundle(suite.entry)]);
    else if (lane === "chromium") await runChromium(await bundleModule(suite.entry));
    else if (lane === "firefox" || lane === "webkit") await runPlaywright(lane, await bundleModule(suite.entry));
    else await runClearScript(suite.entry);
    if (suite.label === "std/process" && ["quickjs", "txiki", "bun", "async", "node", "deno", "ende"].includes(lane)) {
      await runProcessPipeProbe();
      await runProcessPipeProbe(true);
    }
    if (suite.label === "std/process" && lane === "jerry") await runJerryPrintProbe();
  } catch (error) {
    failures++;
    console.error(`suite ${suite.label} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failures) throw new Error(`${failures} suite(s) failed`);

function discoverSuites(selection: string[]) {
  const workspace = loadWorkspace(root);
  if (workspace.size === 0) throw new Error("no workspace modules discovered");
  const modules = [...workspace.values()].map((member) => ({
    label: relative(root, member.dir).replaceAll("\\", "/").replace("/jsr/", "/"), dir: member.dir,
  })).sort((a, b) => a.label.localeCompare(b.label, "en"));
  if (modules.length === 0) throw new Error("no workspace modules discovered");
  const selected = selection.length ? selection : modules.filter((item) => collectTestFiles(item.dir).length).map((item) => item.label);
  const invalid = selected.filter((value) => !modules.some((item) => item.label === value));
  if (invalid.length) throw new Error(`unknown module selection: ${invalid.join(", ")}`);
  const out = [];
  for (const label of [...new Set(selected)].sort((a, b) => a.localeCompare(b, "en"))) {
    const module = modules.find((item) => item.label === label)!;
    const tests = collectTestFiles(module.dir).sort((a, b) => a.localeCompare(b, "en"));
    if (!tests.length) throw new Error(`no tests found for ${label}`);
    const entry = join(buildRoot, "test", label, "main.ts");
    mkdirSync(dirname(entry), { recursive: true });
    const runner = runAsyncTests
      ? `import { runAsync } from "@neotales/test";\nconst result = await runAsync();\nif (result.failed > 0) throw new Error(String(result.failed) + " failed");`
      : `import { run } from "@neotales/test";\nconst result = run();\nif (result.failed > 0) throw new Error(String(result.failed) + " failed");`;
    writeFileSync(entry, `${tests.map((file) => `import ${JSON.stringify(relativeSpecifier(entry, file, "ts"))};`).join("\n")}\n${runner}\n`);
    out.push({ label, entry });
  }
  return out;
}

function collectTestFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".build") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectTestFiles(path));
    else if (entry.isFile() && /\.test\.ts$/.test(entry.name)) found.push(path);
  }
  return found;
}

// Deno and Ende need --allow-env when either the Windows write opt-in or
// the required-backend flag is set. Without them, no registry write is enabled.
function jsRuntimeArgs(entry: string): string[] {
  // The env scenarios read and write environment variables, and command
  // substitution runs a child process. sys and ffi cover the OS modules.
  const args = ["run", "--allow-sys", "--allow-ffi", "--allow-env", "--allow-run"];
  args.push(entry);
  return args;
}

async function spawn(bin: string, args: string[]): Promise<void> {
  const resolved = existsSync(bin) ? bin : Bun.which(bin);
  if (resolved === null) {
    const why = lane === "txiki"
      ? "tjs is not on PATH. txiki.js publishes macOS and Windows releases, not Linux"
      : `${bin} is not on PATH`;
    console.log(`not run ${lane}: ${why}`);
    throw new Error(`not run ${lane}`);
  }
  if (lane === "quickjs" && process.env.QUICKJS_PROCESS_ARGS_PROBE === "1") {
    const version = Bun.spawnSync([resolved, "--version"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    if (
      version.exitCode !== 0 ||
      version.stdout.toString().trim() !== "0.18.0"
    ) {
      throw new Error("QuickJS process-args probe requires pinned QuickJS-ng 0.18.0");
    }
  }
  // A workflow env is not a reliable way to reach this child, so the Node CI
  // legs put the FFI switch on argv. Unix answers with uid and needs neither.
  const nodeFfiFlags = bin === "node" && lane === "node" ? ffiFlags() : [];
  const child = Bun.spawn([resolved, ...nodeFfiFlags, ...args], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await exited(child, 60_000);
  if (code !== 0) throw new Error(`${lane} exited ${code}`);
}

function ffiFlags(): string[] {
  if (process.env.REQUIRE_NODE_FFI === "1") return ["--experimental-ffi"];
  if (process.env.REQUIRE_KOFFI === "1") return ["--no-experimental-ffi"];
  return [];
}

function qjs(): string {
  return Bun.which("qjs-linux-x86_64") ?? Bun.which("qjs") ?? "qjs";
}

function txiki(): string {
  const home = process.env.HOME ?? "";
  const pinned = join(home, ".cache/neotales/txiki-src/build/tjs");
  if (existsSync(pinned)) return pinned;
  return Bun.which("tjs") ?? "tjs";
}

async function runProcessPipeProbe(asyncRead = false): Promise<void> {
  const probe = join(buildRoot, `process-pipe-probe${asyncRead ? "-async" : ""}.ts`);
  const quickjs = lane === "quickjs";
  const txikiLane = lane === "txiki";
  writeFileSync(probe, `
import { args, chdir, cwd, execPath, pid, ppid, popd, pushd, stdin, stdout, stderr, exit } from "@neotales/process";
if (!(pid > 0) || !(ppid >= 0) || !execPath()) throw new Error("process metadata missing");
if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) throw new Error("argument metadata invalid");
const originalDirectory = cwd();
chdir(originalDirectory);
pushd(originalDirectory);
if (popd() !== originalDirectory) throw new Error("directory stack failed");
const input = new Uint8Array(5);
let count = 0;
while (count < input.length) {
  const read = ${txikiLane || asyncRead ? "await stdin.read(input.subarray(count))" : "stdin.readSync(input.subarray(count))"};
  if (read === null) break;
  count += read;
}
if (count !== 5) throw new Error("stdin pipe did not produce five bytes");
if (${txikiLane || asyncRead ? "await stdin.read(new Uint8Array(1))" : "stdin.readSync(new Uint8Array(1))"} !== null) throw new Error("stdin EOF did not map to null");
if (${txikiLane ? "await stdout.write(input.subarray(0, count))" : "stdout.writeSync(input.subarray(0, count))"} !== 5) throw new Error("stdout byte count mismatch");
if (await stdout.write(input.subarray(0, count)) !== 5) throw new Error("async stdout byte count mismatch");
if (await stderr.write(new Uint8Array([69,82,82,10])) !== 4) throw new Error("stderr byte count mismatch");
stdin.close();
stdout.close();
stderr.close();
exit(23);
`);
  const file = quickjs ? await quickjsBundle(probe) : txikiLane ? await bundle(probe) : await nodeTargetBundle(probe);
  const command = quickjs
    ? [qjs(), "--module", file]
    : txikiLane
    ? [txiki(), "run", file]
    : lane === "deno"
    ? ["deno", "run", "--allow-sys", "--allow-read", "--allow-write", file]
    : lane === "ende"
    ? ["ende", "run", "--allow-sys", "--allow-read", "--allow-write", file]
    : lane === "node"
    ? ["node", file]
    : ["bun", file];
  const child = Bun.spawn(command, { cwd: root, stdin: "pipe", stdout: "pipe", stderr: "pipe" });
  child.stdin.write("probe");
  child.stdin.end();
  const [code, output, errors] = await Promise.all([
    exited(child, 10_000),
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  if (code !== 23 || output !== "probeprobe" || errors !== "ERR\n") {
    throw new Error(`${lane} process pipe probe mismatch: exit=${code}, stdout=${JSON.stringify(output)}, stderr=${JSON.stringify(errors)}`);
  }
}

async function nodeTargetBundle(entry: string): Promise<string> {
  const out = join(buildRoot, "bundles", `${relative(join(buildRoot, "test"), entry).replaceAll("/", "_")}.probe.mjs`);
  mkdirSync(dirname(out), { recursive: true });
  const workspace = loadWorkspace(root);
  const result = await Bun.build({
    entrypoints: [entry],
    format: "esm",
    target: "node",
    plugins: [{
      name: "process-probe-workspace",
      setup(build) {
        build.onResolve({ filter: /^@neotales\// }, (args) => {
          const target = resolveSpecifier(workspace, args.path);
          if (target == null) throw new Error(`${args.path} is not a workspace export`);
          return { path: target };
        });
      },
    }],
  });
  if (!result.success) throw new Error(result.logs.map((item) => item.message).join("\n") || "process probe bundle failed");
  writeFileSync(out, await result.outputs[0]!.text());
  return out;
}

async function runJerryPrintProbe(): Promise<void> {
  const probe = join(buildRoot, "process-print-probe.ts");
  writeFileSync(probe, `
import { stdout } from "@neotales/process";
if (stdout.writeSync(new Uint8Array([226, 152, 131, 10])) !== 4) throw new Error("print fallback byte count mismatch");
`);
  const file = await jerryBundle(probe);
  const child = Bun.spawn([jerry(), file], { cwd: root, stdout: "pipe", stderr: "pipe" });
  const [code, output, errors] = await Promise.all([
    exited(child, 10_000),
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  if (code !== 0 || output !== "☃\n" || errors.length > 0) {
    throw new Error(`JerryScript print fallback mismatch: exit=${code}, output=${JSON.stringify(output)}`);
  }
}

async function quickjsBundle(entry: string): Promise<string> {
  const out = join(buildRoot, "bundles", `${relative(join(buildRoot, "test"), entry).replaceAll("/", "_")}.qjs.mjs`);
  mkdirSync(dirname(out), { recursive: true });
  const workspace = loadWorkspace(root);
  const result = await Bun.build({
    entrypoints: [entry],
    format: "esm",
    target: "browser",
    external: ["qjs:std", "qjs:os"],
    plugins: [{
      name: "quickjs-workspace",
      setup(build) {
        build.onResolve({ filter: /^@neotales\// }, (args) => {
          const target = resolveSpecifier(workspace, args.path);
          if (target == null) throw new Error(`${args.path} is not a workspace export`);
          return { path: target };
        });
      },
    }],
  });
  if (!result.success) throw new Error(result.logs.map((item) => item.message).join("\n") || "QuickJS bundle failed");
  const code = await result.outputs[0]!.text();
  writeFileSync(out, `import * as qjsStd from "qjs:std";\nimport * as qjsOs from "qjs:os";\nglobalThis.std = qjsStd;\nglobalThis.os = qjsOs;\n${code}`);
  return out;
}

function jerry(): string {
  if (process.env.JERRY) return process.env.JERRY;
  const home = process.env.HOME ?? "";
  const pinned = join(home, ".cache/neotales/jerryscript-v3.0.0/build/bin/jerry");
  if (existsSync(pinned)) return pinned;
  return Bun.which("jerry") ?? "jerry";
}

function chromiumBin(): string | null {
  if (process.env.CHROMIUM && existsSync(process.env.CHROMIUM)) return process.env.CHROMIUM;
  for (const name of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
    const found = Bun.which(name);
    if (found) return found;
  }
  return null;
}

// JerryScript cannot parse top-level await. Each module keeps its production
// facade and backend selection, but the runtime-backend region is removed at
// build time. The default throwing backend remains and reports unavailable.
// This is a specialization of the real module, not a substitute entrypoint.
function noTlaFacadeRegions(): ReadonlyArray<readonly [RegExp, string]> {
  return [
    [/\/os\/jsr\/win-registry\/registry\.ts$/, "win-registry-runtime-backend"],
    [/\/os\/jsr\/is-elevated\/mod\.ts$/, "is-elevated-runtime-backend"],
    [/\/os\/jsr\/win-cred\/ffi\.ts$/, "win-cred-runtime-backend"],
    [/\/os\/jsr\/darwin-keychain\/ffi\.ts$/, "darwin-keychain-runtime-backend"],
    [/\/os\/jsr\/linux-libsecret\/ffi\.ts$/, "linux-libsecret-runtime-backend"],
  ];
}

function specializeForNoTla(source: string, name: string): string {
  const start = `// #region ${name}`;
  const end = `// #endregion ${name}`;
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from < 0 || to < from) {
    throw new Error(`${name} runtime region markers are missing`);
  }
  return `${source.slice(0, from)}// JerryScript specialization: no top-level await and no native backend import.\n${source.slice(to + end.length)}`;
}

async function bundleIife(entry: string): Promise<string> {
  const out = join(buildRoot, "bundles", `${relative(join(buildRoot, "test"), entry).replaceAll("/", "_")}.iife.js`);
  mkdirSync(dirname(out), { recursive: true });
  const workspace = loadWorkspace(root);
  const result = await Bun.build({
    entrypoints: [entry],
    format: "iife",
    target: "browser",
    plugins: [{
      name: "workspace",
      setup(build) {
        build.onResolve({ filter: /^@neotales\// }, (args) => {
          const target = resolveSpecifier(workspace, args.path);
          if (target == null) throw new Error(`${args.path} is not a workspace export`);
          return { path: target };
        });
        if (lane === "jerry") {
          for (const [filter, region] of noTlaFacadeRegions()) {
            build.onLoad(
              { filter },
              (args) => ({
                contents: specializeForNoTla(readFileSync(args.path, "utf8"), region),
                loader: "ts",
              }),
            );
          }
        }
      },
    }],
  });
  if (!result.success) {
    throw new Error(result.logs.map((item) => item.message).join("\n") || "bundle failed");
  }
  writeFileSync(out, await result.outputs[0].text());
  return out;
}

async function jerryBundle(entry: string): Promise<string> {
  const file = await bundleIife(entry);
  const down = file.replace(/\.iife\.js$/, ".es2020.js");
  // JerryScript 3.0.0 cannot parse private fields. esbuild rewrites them.
  const esbuild = Bun.which("esbuild");
  const command = esbuild
    ? [esbuild, file, "--bundle", "--format=iife", "--target=es2020", `--outfile=${down}`]
    : ["bunx", "esbuild", file, "--bundle", "--format=iife", "--target=es2020", `--outfile=${down}`];
  const built = Bun.spawnSync(command, { cwd: root, stdout: "pipe", stderr: "pipe" });
  if (built.exitCode !== 0) throw new Error(built.stderr.toString() || "esbuild failed");
  const out = file.replace(/\.iife\.js$/, ".jerry.js");
  // The jerry binary has print, not console. The lane marker is explicit
  // because no runtime feature reliably distinguishes JerryScript from a
  // browser or QuickJS-ng.
  writeFileSync(
    out,
    `globalThis.__NEOTALES_LANE__ = "jerry";\nvar console = { log: print, error: print, warn: print, info: print };\n${readFileSync(down, "utf8")}`,
  );
  return out;
}

async function bundleModule(entry: string): Promise<string> {
  const out = join(buildRoot, "bundles", `${relative(join(buildRoot, "test"), entry).replaceAll("/", "_")}.mjs`);
  mkdirSync(dirname(out), { recursive: true });
  const workspace = loadWorkspace(root);
  const result = await Bun.build({
    entrypoints: [entry],
    format: "esm",
    target: "browser",
    plugins: [{
      name: "browser",
      setup(build) {
        build.onResolve({ filter: /^@neotales\// }, (args) => {
          const target = resolveSpecifier(workspace, args.path);
          if (target == null) throw new Error(`${args.path} is not a workspace export`);
          return { path: target };
        });
        // FFI backends are not part of the browser load. Leaving them external
        // keeps node:module and bun:ffi out of the module that does load.
        build.onResolve({ filter: /ffi_(deno|bun|txiki|node|koffi)\.ts$/ }, () => ({
          path: "./ffi-unused.js",
          external: true,
        }));
      },
    }],
  });
  if (!result.success) {
    throw new Error(result.logs.map((item) => item.message).join("\n") || "bundle failed");
  }
  writeFileSync(out, await result.outputs[0].text());
  return out;
}

async function runChromium(file: string): Promise<void> {
  const bin = chromiumBin();
  if (bin === null) {
    console.log("not run chromium: chromium is not on PATH");
    throw new Error("not run chromium");
  }
  const dir = join(buildRoot, "chromium");
  mkdirSync(dir, { recursive: true });
  const script = join(dir, "suite.js");
  writeFileSync(script, readFileSync(file, "utf8"));
  writeFileSync(join(dir, "index.html"), `<!doctype html>
<meta charset="utf-8">
<pre id="out"></pre>
<script>
const lines = [];
for (const name of ["log", "error", "warn"]) {
  const orig = console[name].bind(console);
  console[name] = (...args) => {
    lines.push(args.map(String).join(" "));
    orig(...args);
  };
}
addEventListener("error", (event) => {
  lines.push("fail uncaught " + event.message);
});
</script>
<script type="module">
try {
  await import("./suite.js");
} catch (error) {
  lines.push("fail uncaught " + (error instanceof Error ? error.message : String(error)));
}
document.getElementById("out").textContent = lines.join("\\n");
</script>
`);
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      const url = new URL(request.url);
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      const target = join(dir, path);
      if (!target.startsWith(dir) || !existsSync(target)) return new Response("missing", { status: 404 });
      return new Response(Bun.file(target));
    },
  });
  const page = `http://127.0.0.1:${server.port}/`;
  const dump = join(dir, "dump.html");
  try {
    const child = Bun.spawn([
      bin,
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--virtual-time-budget=15000",
      "--dump-dom",
      page,
    ], { cwd: dir, stdout: "pipe", stderr: "pipe" });
    const code = await exited(child, 30_000);
    const stdout = await new Response(child.stdout).text();
    const stderr = await new Response(child.stderr).text();
    writeFileSync(dump, stdout);
    const report = textBetween(stdout, "<pre id=\"out\">", "</pre>");
    process.stdout.write(report ? `${report}\n` : "");
    if (code !== 0) throw new Error(`chromium exited ${code}\n${stderr}`);
    const done = report.match(/done (\d+) passed, (\d+) failed, (\d+) skipped/);
    if (!done) throw new Error(`chromium did not finish the suite\n${stderr}`);
    if (Number(done[2]) !== 0) throw new Error(`chromium reported ${done[2]} failed`);
  } finally {
    server.stop(true);
  }
}

function textBetween(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  if (from < 0) return "";
  const open = source.indexOf(">", from);
  const close = source.indexOf(end, open);
  return source.slice(open + 1, close < 0 ? undefined : close);
}

async function runPlaywright(lane: "firefox" | "webkit", file: string): Promise<void> {
  const { runBrowserSuite } = await import("./browser-run.ts");
  await runBrowserSuite(lane, join(buildRoot, lane), file);
}

async function runBun(entry: string): Promise<void> {
  const workspace = loadWorkspace(root);
  const files = collectLocalGraph(entry, workspace);
  if (!needsWorkspaceRewrite(files)) {
    await spawn("bun", [entry]);
    return;
  }
  // Bun does not read the Deno workspace. The copy keeps the same paths, so a
  // rewritten relative import still finds the sibling that was copied with it.
  const outRoot = join(buildRoot, "rewritten");
  for (const file of files) {
    const source = rewriteImports(readFileSync(file, "utf8"), file, workspace, "ts");
    const dest = join(outRoot, relative(root, file));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, source);
  }
  await spawn("bun", [join(outRoot, relative(root, entry))]);
}

// The browser target replaces node:module with an empty stub, so
// `createRequire(import.meta.url)` returns an object that is not callable and
// both Node FFI backends fail to load. The Node lane must keep Node builtins,
// which means target "node". Every other bundle lane has no node:module host
// and keeps the browser target it has always used.
function bundleTarget(): "node" | "browser" {
  return lane === "node" ? "node" : "browser";
}

async function bundle(entry: string): Promise<string> {
  const out = join(buildRoot, "bundles", `${relative(join(buildRoot, "test"), entry).replaceAll("/", "_")}.js`);
  mkdirSync(dirname(out), { recursive: true });
  const workspace = loadWorkspace(root);
  const target = bundleTarget();
  // Not reached by discoverSuites: a generated entry always imports the
  // workspace runner as "@neotales/test", so needsWorkspaceRewrite is true and
  // the Bun.build path below carries the plugin that resolves it. The CLI
  // flags are kept correct for an entry with no workspace specifier, which the
  // generator does not emit today. There is no launcher-level test of this
  // branch; the regression in test-discovery.test.mjs builds the same
  // non-workspace graph with these flags directly.
  if (!needsWorkspaceRewrite(collectLocalGraph(entry, workspace))) {
    const child = Bun.spawnSync(
      ["bun", "build", entry, "--outfile", out, "--format", "esm", "--target", target],
      { cwd: root, stdout: "inherit", stderr: "inherit" },
    );
    if (child.exitCode !== 0) throw new Error("bundle failed");
    return out;
  }
  const result = await Bun.build({
    entrypoints: [entry],
    format: "esm",
    target,
    plugins: [{
      name: "workspace",
      setup(build) {
        build.onResolve({ filter: /^@neotales\// }, (args) => {
          const target = resolveSpecifier(workspace, args.path);
          if (target == null) throw new Error(`${args.path} is not a workspace export`);
          return { path: target };
        });
      },
    }],
  });
  if (!result.success) {
    throw new Error(result.logs.map((item) => item.message).join("\n") || "bundle failed");
  }
  writeFileSync(out, await result.outputs[0].text());
  return out;
}

function needsWorkspaceRewrite(files: string[]): boolean {
  return files.some((file) =>
    importSpecifiers(readFileSync(file, "utf8")).some((spec) => spec.startsWith("@neotales/"))
  );
}

async function runWorkerd(file: string): Promise<void> {
  const bin = Bun.which("workerd");
  if (bin === null) {
    console.log("not run workerd: workerd is not on PATH");
    throw new Error("not run workerd");
  }
  const dir = join(buildRoot, "workerd");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "tests.js"), `${readFileSync(file, "utf8")}\nexport {};\n`);
  writeFileSync(join(dir, "worker.js"), workerSource());
  writeFileSync(join(dir, "config.capnp"), capnp());
  const child = Bun.spawn([bin, "serve", join(dir, "config.capnp")], {
    cwd: dir,
    stdout: "inherit",
    stderr: "inherit",
  });
  try {
    const response = await waitFor("http://127.0.0.1:8791/", 15_000);
    const body = await response.text();
    if (!response.ok) throw new Error(`workerd status ${response.status}: ${body}`);
    const probe = JSON.parse(body);
    if (
      probe.process !== "object" ||
      probe.pid !== 1 ||
      probe.cwd !== "/bundle" ||
      probe.argvCount !== 1 ||
      probe.chdir !== "function" ||
      probe.chdirSame !== "unchanged" ||
      !probe.invalidChdirThrows ||
      probe.stdin !== "function" ||
      !probe.stdinEmpty ||
      probe.stdout !== "function" ||
      probe.stderr !== "function" ||
      (probe.stdoutIsTTY !== false && probe.stdoutIsTTY !== undefined) ||
      (probe.stderrIsTTY !== false && probe.stderrIsTTY !== undefined)
    ) {
      throw new Error(`workerd process probe did not match documented worker capabilities: ${body}`);
    }
    console.log(`workerd process capability probe: ${body}`);
  } finally {
    child.kill();
    await exited(child, 5_000);
  }
}

function workerSource(): string {
  return `let failure = "";
let processProbe = {};
try {
  globalThis.__NEOTALES_LANE__ = "workerd";
  await import("./tests.js");
  let chdirSame = "unavailable";
  let invalidChdirThrows = false;
  if (typeof process === "object" && typeof process.chdir === "function") {
    const before = process.cwd();
    process.chdir(".");
    chdirSame = process.cwd() === before ? "unchanged" : process.cwd();
    try { process.chdir("/path/which/does/not/exist"); } catch { invalidChdirThrows = true; }
  }
  processProbe = {
    process: typeof process,
    pid: typeof process === "object" ? process.pid : null,
    nodeVersion: typeof process === "object" ? process.versions?.node ?? null : null,
    releaseName: typeof process === "object" ? process.release?.name ?? null : null,
    cwd: typeof process === "object" && typeof process.cwd === "function" ? process.cwd() : null,
    chdir: typeof process === "object" ? typeof process.chdir : "absent",
    chdirSame,
    invalidChdirThrows,
    exit: typeof process === "object" ? typeof process.exit : "absent",
    argvCount: typeof process === "object" && Array.isArray(process.argv) ? process.argv.length : null,
    stdin: typeof process === "object" ? typeof process.stdin?.read : "absent",
    stdinEmpty: typeof process === "object" && typeof process.stdin?.read === "function" ? process.stdin.read() === null : false,
    stdout: typeof process === "object" ? typeof process.stdout?.write : "absent",
    stdoutIsTTY: typeof process === "object" ? process.stdout?.isTTY : null,
    stderr: typeof process === "object" ? typeof process.stderr?.write : "absent",
    stderrIsTTY: typeof process === "object" ? process.stderr?.isTTY : null,
  };
} catch (err) {
  failure = err && err.stack ? err.stack : String(err);
}
export default {
  fetch() {
    return new Response(failure || JSON.stringify(processProbe), { status: failure ? 500 : 200 });
  },
};
`;
}

async function waitFor(url: string, timeoutMs: number): Promise<Response> {
  const deadline = Date.now() + timeoutMs;
  let last = "no response";
  while (Date.now() < deadline) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(2_000) });
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
      await Bun.sleep(100);
    }
  }
  throw new Error(`workerd did not serve within ${timeoutMs}ms: ${last}`);
}

function exited(child: { kill: () => void; exited: Promise<number> }, timeoutMs: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${lane} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.exited.then((code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}

function capnp(): string {
  return `using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [(name = "main", worker = .worker)],
  sockets = [(
    name = "http",
    address = "127.0.0.1:8791",
    http = (),
    service = "main"
  )],
);

const worker :Workerd.Worker = (
  compatibilityDate = "2026-11-10",
  modules = [
    (name = "worker.js", esModule = embed "worker.js"),
    (name = "tests.js", esModule = embed "tests.js"),
  ],
);
`;
}

function dotnetWithSdk(): string | null {
  const home = process.env.HOME ?? "";
  const candidates = [
    ...((process.env.PATH ?? "").split(":").map((dir) => join(dir, "dotnet"))),
    join(home, ".local/share/mise/shims/dotnet"),
  ];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (candidate === "dotnet" || seen.has(candidate) || !existsSync(candidate)) continue;
    seen.add(candidate);
    const listed = Bun.spawnSync([candidate, "--list-sdks"], { stdout: "pipe", stderr: "pipe" });
    if (listed.exitCode === 0 && /\d+\.\d+\.\d+/.test(listed.stdout.toString())) return candidate;
  }
  return null;
}

async function runClearScript(sourceEntry: string): Promise<void> {
  const entry = transpileModules(sourceEntry);
  const project = join(import.meta.dir, "clearscript/ClearScriptHost.csproj");
  const dotnet = dotnetWithSdk();
  if (dotnet === null) {
    console.log("not run clearscript: no dotnet SDK is installed");
    throw new Error("not run clearscript");
  }
  const child = Bun.spawn([
    dotnet,
    "run",
    "--project",
    project,
    "-c",
    "Release",
    "--",
    entry,
  ], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await exited(child, 90_000);
  if (code !== 0) throw new Error(`clearscript exited ${code}`);
}

function transpileModules(sourceEntry: string): string {
  const outRoot = join(buildRoot, "modules");
  const transpiler = new Bun.Transpiler({ loader: "ts" });
  const workspace = loadWorkspace(root);
  const files = collectLocalGraph(sourceEntry, workspace);
  for (const file of files) {
    const source = rewriteImports(readFileSync(file, "utf8"), file, workspace, "js");
    const js = transpiler.transformSync(source);
    const dest = join(outRoot, relative(root, file).replace(/\.ts$/, ".js"));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, js);
  }
  return join(outRoot, relative(root, sourceEntry).replace(/\.ts$/, ".js"));
}
