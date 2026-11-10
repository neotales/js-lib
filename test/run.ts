// Small runner. No node:, no process, no top-level await. Ende has none of those.

export type TestContext = {
  skip(reason?: string): never;
};

type Fn = (t: TestContext) => void | Promise<unknown>;

type Case = {
  name: string;
  fn?: Fn;
  skipReason?: string;
};

class Skip extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "Skip";
  }
}

const cases: Case[] = [];

export function test(name: string, fn: Fn): void {
  cases.push({ name, fn });
}

test.skip = function skip(name: string, reason?: string): void {
  cases.push({ name, skipReason: reason ?? "skipped" });
};

export type RunResult = {
  passed: number;
  failed: number;
  skipped: number;
};

// Synchronous on purpose. A test that returns a promise is a failure, not a
// pass, until a lane can wait without top-level await.
export function run(): RunResult {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  for (const item of cases) {
    if (item.skipReason !== undefined) {
      skipped++;
      line("skip", item.name, item.skipReason);
      continue;
    }
    try {
      const out = item.fn?.({
        skip(reason?: string): never {
          throw new Skip(reason ?? "skipped");
        },
      });
      if (out !== undefined && out !== null && typeof (out as Promise<unknown>).then === "function") {
        failed++;
        line("fail", item.name, "returned a promise; this runner does not wait yet");
        continue;
      }
      passed++;
      line("pass", item.name);
    } catch (err) {
      if (err instanceof Skip) {
        skipped++;
        line("skip", item.name, err.message);
        continue;
      }
      failed++;
      line("fail", item.name, err instanceof Error ? err.message : String(err));
    }
  }
  line("done", `${passed} passed, ${failed} failed, ${skipped} skipped`);
  return { passed, failed, skipped };
}

function line(kind: string, name: string, extra?: string): void {
  console.log(extra === undefined ? `${kind} ${name}` : `${kind} ${name} ${extra}`);
}
