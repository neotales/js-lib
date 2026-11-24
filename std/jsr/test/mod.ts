// Small runner. No node:, no process, no top-level await. Ende has none of those.

export type TestContext = {
  skip(reason?: string): never;
};

type SyncReturn<T> = T extends PromiseLike<unknown> ? never : T;
type AsyncFn = (t: TestContext) => void | Promise<unknown>;

type Case = {
  name: string;
  fn?: AsyncFn;
  skipReason?: string;
  async?: boolean;
};

class Skip extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "Skip";
  }
}

const cases: Case[] = [];

type TestFn = {
  <T>(name: string, fn: (t: TestContext) => SyncReturn<T>): void;
  skip(name: string, reason?: string): void;
  async(name: string, fn: AsyncFn): void;
};

function registerSync(name: string, fn: AsyncFn): void {
  cases.push({ name, fn });
}

export const test: TestFn = registerSync as TestFn;

// Async cases are registered distinctly so the synchronous runner can skip
// them without invoking the callback. Calling first and inspecting the return
// value runs side effects and can create an unhandled rejection.
export function testAsync(name: string, fn: AsyncFn): void {
  cases.push({ name, fn, async: true });
}

test.skip = function skip(name: string, reason?: string): void {
  cases.push({ name, skipReason: reason ?? "skipped" });
};

test.async = testAsync;

export type RunResult = {
  passed: number;
  failed: number;
  skipped: number;
};

// Synchronous on purpose. A registered async case is skipped without being
// invoked; only runAsync() may call it.
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
    if (item.async) {
      skipped++;
      line("skip", item.name, "requires the async runner");
      continue;
    }
    try {
      const out = item.fn?.({
        skip(reason?: string): never {
          throw new Skip(reason ?? "skipped");
        },
      });
      if (out !== undefined && out !== null && typeof (out as Promise<unknown>).then === "function") {
        // Consume a possible rejection; the synchronous runner cannot await it
        // and must not leak an unhandled rejection.
        try {
          (out as Promise<unknown>).then(undefined, () => {});
        } catch {
          // A malformed thenable is still reported below.
        }
        failed++;
        line("fail", item.name, "returned a promise; register it with testAsync");
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

// Async runner. Only lanes that can await enter here; the synchronous run()
// above stays top-level-await free for runtimes that cannot.
export async function runAsync(): Promise<RunResult> {
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
      await item.fn?.({
        skip(reason?: string): never {
          throw new Skip(reason ?? "skipped");
        },
      });
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
