import { deepStrictEqual as equal } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "@neotales/test";
import * as windows from "./windows/mod.ts";
import * as posix from "./posix/mod.ts";

// The Jerry bundle sets this marker explicitly; runtime feature sniffing is
// not reliable because browsers and QuickJS-ng also expose print-like hosts.
const JERRY_LANE =
  (globalThis as { __NEOTALES_LANE__?: string }).__NEOTALES_LANE__ === "jerry";
const HAS_LOOKBEHIND = !JERRY_LANE;
function testLookbehind(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!HAS_LOOKBEHIND) t.skip("JerryScript rejects the lookbehind used by normalizeGlob");
    fn();
  });
}


testLookbehind("path::windows.joinGlobs() joins the glob patterns", function () {
  equal(windows.joinGlobs(["foo", "*", "bar"]), `foo\\*\\bar`);
  equal(windows.joinGlobs([""], { globstar: true }), ".");
  equal(windows.joinGlobs(["**", ".."], { globstar: true }), `**\\..`);
});

testLookbehind("path::windows.joinGlobs() joins the glob patterns", function () {
  equal(posix.joinGlobs(["foo", "*", "bar"]), `foo/*/bar`);
  equal(posix.joinGlobs([""], { globstar: true }), ".");
  equal(posix.joinGlobs(["**", ".."], { globstar: true }), `**/..`);
});
