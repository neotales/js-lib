// Playwright library lifecycle for one bundled browser suite.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type BrowserLane = "firefox" | "webkit";

// The page is the harness for the Playwright lanes. It records the runner's
// output and marks done only after the ESM bundle has finished evaluating, so
// a suite with top-level await is not reported before it runs.
function browserPage(): string {
  return `<!doctype html>
<meta charset="utf-8">
<pre id="out"></pre>
<script>
const suite = { lines: [], done: false };
globalThis.__neotales = suite;
function record(line) {
  suite.lines.push(line);
  document.getElementById("out").textContent = suite.lines.join("\\n");
}
for (const name of ["log", "error", "warn"]) {
  const orig = console[name].bind(console);
  console[name] = (...args) => {
    record(args.map(String).join(" "));
    orig(...args);
  };
}
addEventListener("error", (event) => record("fail uncaught " + event.message));
addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  record("fail uncaught " + (reason instanceof Error ? reason.message : String(reason)));
});
</script>
<script type="module">
try {
  await import("./suite.js");
} catch (error) {
  record("fail uncaught " + (error instanceof Error ? error.message : String(error)));
}
suite.done = true;
</script>
`;
}

function serveStatic(dir: string) {
  return Bun.serve({
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
}

export async function runBrowserSuite(lane: BrowserLane, dir: string, file: string): Promise<void> {
  let playwright: typeof import("playwright");
  try {
    playwright = await import("playwright");
  } catch {
    console.log(`not run ${lane}: playwright is not installed (run: pnpm install)`);
    throw new Error(`not run ${lane}`);
  }
  const type: import("playwright").BrowserType = playwright[lane];
  // Playwright names the browser build its own version installed. A host
  // Firefox or WebKit is not a substitute: the version would not match.
  if (!existsSync(type.executablePath())) {
    console.log(`not run ${lane}: the Playwright ${lane} browser is not installed (run: pnpm exec playwright install ${lane})`);
    throw new Error(`not run ${lane}`);
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "suite.js"), readFileSync(file, "utf8"));
  writeFileSync(join(dir, "index.html"), browserPage());
  const timeout = Number(process.env.PLAB_TEST_BROWSER_TIMEOUT ?? 20_000);
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error("PLAB_TEST_BROWSER_TIMEOUT must be a positive number");
  const http = serveStatic(dir);
  const pageErrors: string[] = [];
  // Console events arrive on the driver connection, so they survive a page
  // whose main thread is blocked and cannot answer evaluate(..).
  const consoleLines: string[] = [];
  let browser: import("playwright").Browser | undefined;
  let failure: unknown;
  try {
    browser = await type.launch({ headless: true, timeout });
    const page = await browser.newPage();
    const printLines = (lines: string[]): void => {
      if (lines.length) process.stdout.write(`${lines.join("\n")}\n`);
    };
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => consoleLines.push(message.text()));
    try {
      await page.goto(`http://127.0.0.1:${http.port}/`, { waitUntil: "load", timeout });
      // Waiting on an explicit marker is the point: a network-idle or load
      // event can arrive before a suite that awaits at module scope has run.
      await page.waitForFunction(
        "globalThis.__neotales !== undefined && globalThis.__neotales.done === true",
        undefined,
        { timeout },
      );
    } catch (error) {
      // A timeout must not hide output the suite emitted before it hung. If
      // the page cannot answer, fall back to the console events already seen.
      printLines(consoleLines);
      throw error;
    }
    const lines = await page.evaluate("globalThis.__neotales.lines") as string[];
    printLines(lines);
    const done = [...lines].reverse().find((line) => /^done \d+ passed, \d+ failed, \d+ skipped$/.test(line));
    if (done) {
      const failed = Number(/^done \d+ passed, (\d+) failed, \d+ skipped$/.exec(done)![1]);
      // The generated entry throws after a suite with failures, so the page
      // also records an uncaught line. The count is the useful reason.
      if (failed !== 0) throw new Error(`${lane} reported ${failed} failed`);
    }
    const uncaught = lines.find((line) => line.startsWith("fail uncaught "));
    if (uncaught) throw new Error(uncaught);
    if (pageErrors.length) throw new Error(`${lane} uncaught: ${pageErrors.join("; ")}`);
    if (!done) throw new Error(`${lane} did not finish the suite`);
  } catch (error) {
    failure = error;
  }
  if (browser) {
    try {
      await browser.close();
    } catch (error) {
      if (failure === undefined) failure = error;
      else console.error(error instanceof Error ? error.message : String(error));
    }
  }
  http.stop(true);
  if (failure !== undefined) throw failure;
}
