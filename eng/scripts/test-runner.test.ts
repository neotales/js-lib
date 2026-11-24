// Regression for the shared runner: a registered async case must not be
// invoked by the synchronous runner, and it must not create an unhandled
// rejection. The async runner executes the same case and reports the failure.
import assert from "node:assert/strict";
import { run, runAsync, test, testAsync } from "../../std/jsr/test/mod.ts";

let called = 0;
let unhandled = 0;
const onUnhandled = () => {
  unhandled++;
};
process.on("unhandledRejection", onUnhandled);

try {
  testAsync("harness::async case", async () => {
    called++;
    throw new Error("async boom");
  });
  test("harness::sync case returning a promise", (() =>
    Promise.reject(new Error("sync boom"))) as unknown as () => void);

  const sync = run();
  assert.equal(called, 0, "the synchronous runner invoked an async callback");
  assert.ok(sync.skipped >= 1, "the async case was not skipped");
  assert.equal(sync.failed, 1, "the accidental promise was not reported as a failure");
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(unhandled, 0, "the synchronous runner leaked an unhandled rejection");

  const async = await runAsync();
  assert.equal(called, 1, "the async runner did not invoke the callback");
  assert.equal(async.failed, 2, "async rejections were not reported as failures");
  await Promise.resolve();
  assert.equal(unhandled, 0, "the async runner leaked an unhandled rejection");
} finally {
  process.off("unhandledRejection", onUnhandled);
}

console.log("test runner regression passed");
