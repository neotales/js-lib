import { deepStrictEqual as equal } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "@neotales/test";
import { common } from "./mod.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

test("path::common() returns shared path", () => {
  const actual = posix.common([
    "file://deno/cli/js/deno.ts",
    "file://deno/std/path/mod.ts",
    "file://deno/cli/js/main.ts",
  ]);
  equal(actual, "file://deno/");
});

test("path::common() returns empty string if no shared path is present", () => {
  const actual = posix.common(["file://deno/cli/js/deno.ts", "https://deno.land/std/path/mod.ts"]);
  equal(actual, "");
});

test("path::common() checks windows separator", () => {
  const actual = windows.common([
    "c:\\deno\\cli\\js\\deno.ts",
    "c:\\deno\\std\\path\\mod.ts",
    "c:\\deno\\cli\\js\\main.ts",
  ]);
  equal(actual, "c:\\deno\\");
});

test("common(['', '/'], '/') returns ''", () => {
  const actual = posix.common(["", "/"]);
  equal(actual, "");
});

test("path::common(['/', ''], '/') returns ''", () => {
  const actual = posix.common(["/", ""]);
  equal(actual, "");
});

test("path::common() returns the first path unmodified when it's the only path", () => {
  const actual = posix.common(["./deno/std/path/mod.ts"]);
  equal(actual, "./deno/std/path/mod.ts");
});

test("path::common() returns the first path unmodified if all paths are equal", () => {
  const actual = common([
    "./deno/std/path/mod.ts",
    "./deno/std/path/mod.ts",
    "./deno/std/path/mod.ts",
  ]);
  equal(actual, "./deno/std/path/mod.ts");
});

test("path::posix.common() returns shared path", () => {
  const actual = posix.common([
    "file://deno/cli/js/deno.ts",
    "file://deno/std/path/mod.ts",
    "file://deno/cli/js/main.ts",
  ]);
  equal(actual, "file://deno/");
});
