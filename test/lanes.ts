// Bun task launcher. Not imported by the tests. Ende never loads this file.
// A lane that does not run throws. Exit 0 would look like a pass.

const lane = Bun.argv[2] ?? "";

const bins: Record<string, string> = {
  node: "node",
  deno: "deno",
  ende: "ende",
  workerd: "workerd",
  quickjs: "qjs",
  txiki: "tjs",
};

if (!(lane in bins)) {
  console.error("usage: bun test/lanes.ts <node|deno|ende|workerd|quickjs|txiki>");
  throw new Error("unknown lane");
}

const bin = bins[lane];
if (Bun.which(bin) === null) {
  console.log(`not run ${lane}: ${bin} is not on PATH`);
  throw new Error(`not run ${lane}`);
}

if (lane === "node") {
  console.log("not run node: source tests import .ts; the npm twin is not generated yet");
  throw new Error("not run node");
}

if (lane === "deno") {
  const child = Bun.spawnSync(["deno", "run", "test/main.ts"], {
    cwd: import.meta.dir + "/..",
    stdout: "inherit",
    stderr: "inherit",
  });
  if (child.exitCode !== 0) throw new Error(`deno exited ${child.exitCode}`);
} else {
  console.log(`not run ${lane}: ${bin} is installed, and this lane has no bundle yet`);
  throw new Error(`not run ${lane}`);
}
