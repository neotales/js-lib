// Type regression for the runner. This file is checked, never executed.
import { test, testAsync } from "./mod.ts";

test("sync callback", () => {});
test("sync callback with context", (t) => {
  t.skip("reason");
});
test("sync callback returning a value", () => 1);
testAsync("async callback", async () => {});

// @ts-expect-error a Promise-returning callback belongs in testAsync
test("async in test", async () => {});

// @ts-expect-error a Promise-returning callback belongs in testAsync
test("promise in test", () => Promise.resolve());
