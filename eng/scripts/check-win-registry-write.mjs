// Bun-only Windows integration proof for win-registry writes.
//
// CI invocation is exactly:
//   bun eng/scripts/check-win-registry-write.mjs
//
// The wrapper requires both environment variables, verifies it is running
// under Bun on Windows, runs the real txiki lane, and checks the exact pass
// markers. It writes no temporary log files. If the environment is lost, the
// lane cannot silently skip: this wrapper fails before or after the run.

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

export const REQUIRED_ENV = [
  "WIN_REGISTRY_WRITE_TESTS",
  "REQUIRE_WIN_REGISTRY_FFI",
];

export const REQUIRED_PASS = [
  "required Windows registry backend is available",
  "value roundtrips incl. DWORD and QWORD (opt-in, dangerous)",
];

/**
 * Requires both Windows registry opt-in variables to be exactly "1".
 *
 * @param env The environment to inspect.
 * @throws {Error} If either variable is missing or not "1".
 */
export function requireEnv(env = process.env) {
  for (const name of REQUIRED_ENV) {
    if (env[name] !== "1") {
      throw new Error(`missing required environment: ${name}=1`);
    }
  }
}

/**
 * Requires the real lane output to contain exact pass lines and no skips.
 *
 * @param output Combined lane stdout and stderr.
 * @throws {Error} If a pass marker is absent or a skip marker is present.
 */
export function requireMarkers(output) {
  const lines = output.split(/\r?\n/);
  if (lines.some((line) => line.startsWith("not run "))) {
    throw new Error("txiki lane reported not run");
  }
  for (const marker of REQUIRED_PASS) {
    if (lines.some((line) => line === `skip ${marker}` || line.startsWith(`skip ${marker} `))) {
      throw new Error(`required test was skipped: ${marker}`);
    }
    if (!lines.includes(`pass ${marker}`)) {
      throw new Error(`required test did not pass exactly: ${marker}`);
    }
  }
}

/**
 * Rejects a runtime that cannot run this wrapper.
 *
 * @throws {Error} If not running under Bun on Windows.
 */
export function requireRuntime() {
  if (typeof Bun === "undefined" || !process.versions?.bun) {
    throw new Error(
      "run this wrapper under Bun: bun eng/scripts/check-win-registry-write.mjs",
    );
  }
  if (process.platform !== "win32") {
    throw new Error("this Windows integration wrapper requires Windows");
  }
}

async function main() {
  requireEnv(process.env);
  requireRuntime();

  const child = Bun.spawn(
    [process.execPath, "run", "test:txiki", "--", "os/win-registry"],
    {
      cwd: root,
      env: process.env,
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  if (code !== 0) {
    throw new Error(`txiki lane exited ${code}`);
  }

  requireMarkers(`${stdout}\n${stderr}`);
  console.log("win-registry Windows txiki write integration ok");
}

const invokedDirectly = process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
