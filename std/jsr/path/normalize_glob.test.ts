import { deepStrictEqual as equal, throws } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "@neotales/test";
import { normalizeGlob } from "./normalize_glob.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { SEPARATOR } from "./constants.ts";

test("path::normalizeGlob() checks options.globstar", function (t) {
  if (
    (globalThis as { __NEOTALES_LANE__?: string }).__NEOTALES_LANE__ === "jerry"
  ) {
    t.skip("JerryScript rejects the lookbehind that normalizeGlob's globstar guard uses");
  }
  equal(normalizeGlob(`**${SEPARATOR}..`, { globstar: true }), `**${SEPARATOR}..`);
});

test("path::normalizeGlob() throws if it contains \\0 character", () => {
  throws(
    () => {
      posix.normalizeGlob("\0");
    },
    Error,
    "Glob contains invalid characters:",
  );
  throws(
    () => {
      windows.normalizeGlob("\0");
    },
    Error,
    "Glob contains invalid characters:",
  );
});

test("normalizeGlob() works as the same way as normalize if globstar option is false", () => {
  equal(posix.normalizeGlob("foo/bar/../baz"), "foo/baz");
  equal(windows.normalizeGlob("foo/bar/../baz"), "foo\\baz");
});
