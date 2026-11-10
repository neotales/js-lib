// Task launcher. Bun runs this file. The tests never import it, so node:fs here
// does not leak into Ende. A lane that does not run throws.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
  collectLocalGraph,
  importSpecifiers,
  loadWorkspace,
  rewriteImports,
  resolveSpecifier,
} from "./workspace-map.mjs";

const root = join(import.meta.dir, "../..");
const lane = Bun.argv[2] ?? "";
const lanes = ["bun", "node", "deno", "ende", "workerd", "quickjs", "txiki", "clearscript"];

if (!lanes.includes(lane)) {
  console.error(`usage: bun eng/scripts/test-lane.ts <${lanes.join("|")}>`);
  throw new Error("unknown lane");
}

if (lane === "bun") await runBun();
else if (lane === "deno") await spawn("deno", ["run", "test/main.ts"]);
else if (lane === "ende") await spawn("ende", ["run", "test/main.ts"]);
else if (lane === "node") await spawn("node", [await bundle()]);
else if (lane === "quickjs") await spawn(qjs(), [await bundle()]);
else if (lane === "workerd") await runWorkerd(await bundle());
else if (lane === "txiki") await spawn("tjs", ["run", await bundle()]);
else await runClearScript();

async function spawn(bin: string, args: string[]): Promise<void> {
  const resolved = Bun.which(bin);
  if (resolved === null) {
    const why = lane === "txiki"
      ? "tjs is not on PATH. txiki.js publishes macOS and Windows releases, not Linux"
      : `${bin} is not on PATH`;
    console.log(`not run ${lane}: ${why}`);
    throw new Error(`not run ${lane}`);
  }
  const child = Bun.spawn([resolved, ...args], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await exited(child, 60_000);
  if (code !== 0) throw new Error(`${lane} exited ${code}`);
}

function qjs(): string {
  return Bun.which("qjs") ?? Bun.which("qjs-linux-x86_64") ?? "qjs";
}

async function runBun(): Promise<void> {
  const entry = join(root, "test/main.ts");
  const workspace = loadWorkspace(root);
  const files = collectLocalGraph(entry, workspace);
  if (!needsWorkspaceRewrite(files)) {
    await spawn("bun", [entry]);
    return;
  }
  // Bun does not read the Deno workspace. The copy keeps the same paths, so a
  // rewritten relative import still finds the sibling that was copied with it.
  const outRoot = join(root, ".build/bun");
  for (const file of files) {
    const source = rewriteImports(readFileSync(file, "utf8"), file, workspace, "ts");
    const dest = join(outRoot, relative(root, file));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, source);
  }
  await spawn("bun", [join(outRoot, relative(root, entry))]);
}

async function bundle(): Promise<string> {
  const out = join(root, ".build/tests.js");
  mkdirSync(dirname(out), { recursive: true });
  const entry = join(root, "test/main.ts");
  const workspace = loadWorkspace(root);
  if (!needsWorkspaceRewrite(collectLocalGraph(entry, workspace))) {
    const child = Bun.spawnSync(
      ["bun", "build", "test/main.ts", "--outfile", out, "--format", "esm", "--target", "browser"],
      { cwd: root, stdout: "inherit", stderr: "inherit" },
    );
    if (child.exitCode !== 0) throw new Error("bundle failed");
    return out;
  }
  const result = await Bun.build({
    entrypoints: [entry],
    format: "esm",
    target: "browser",
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
  const dir = join(root, ".build/workerd");
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
  } finally {
    child.kill();
    await exited(child, 5_000);
  }
}

function workerSource(): string {
  return `let failure = "";
try {
  await import("./tests.js");
} catch (err) {
  failure = err && err.stack ? err.stack : String(err);
}
export default {
  fetch() {
    return new Response(failure || "ok", { status: failure ? 500 : 200 });
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

async function runClearScript(): Promise<void> {
  const entry = transpileModules();
  const project = join(import.meta.dir, "clearscript/ClearScriptHost.csproj");
  const dotnet = Bun.which("dotnet");
  if (dotnet === null) {
    console.log("not run clearscript: dotnet is not on PATH");
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

function transpileModules(): string {
  const outRoot = join(root, ".build/modules");
  const transpiler = new Bun.Transpiler({ loader: "ts" });
  const workspace = loadWorkspace(root);
  const files = collectLocalGraph(join(root, "test/main.ts"), workspace);
  for (const file of files) {
    const source = rewriteImports(readFileSync(file, "utf8"), file, workspace, "js");
    const js = transpiler.transformSync(source);
    const dest = join(outRoot, relative(root, file).replace(/\.ts$/, ".js"));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, js);
  }
  return join(outRoot, "test/main.js");
}
