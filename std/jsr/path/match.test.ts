import { equal, strictEqual } from "@neotales/assert";
import { test } from "@neotales/test";
import { match, matchesGlob } from "./mod.ts";
import { match as posixMatch, matchesGlob as posixMatchesGlob } from "./posix/mod.ts";
import { match as windowsMatch, matchesGlob as windowsMatchesGlob } from "./windows/mod.ts";

test("path::match() and matchesGlob() match the current platform", () => {
  strictEqual(matchesGlob, match);
  equal(match("src/path.ts", "src/*.ts"), true);
  equal(matchesGlob("src/path.ts", "src/*.js"), false);
});

test("path::posix.match() and path::windows.match() use their path rules", () => {
  strictEqual(posixMatchesGlob, posixMatch);
  strictEqual(windowsMatchesGlob, windowsMatch);
  equal(posixMatch("src/path.ts", "src/*.ts"), true);
  equal(posixMatch("src\\path.ts", "src/*.ts"), false);
  equal(windowsMatch("src\\path.ts", "src/*.ts"), true);
});
