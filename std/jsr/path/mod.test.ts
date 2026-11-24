import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import * as path from "./mod.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

const expectedExports = [
  "DELIMITER",
  "SEPARATOR",
  "SEPARATOR_PATTERN",
  "basename",
  "common",
  "dirname",
  "extname",
  "format",
  "fromFileUrl",
  "globToRegExp",
  "isAbsolute",
  "isGlob",
  "join",
  "joinGlobs",
  "match",
  "matchesGlob",
  "normalize",
  "normalizeGlob",
  "parse",
  "relative",
  "resolve",
  "toFileUrl",
  "toNamespacedPath",
];

test("path::mod exports the public API", () => {
  equal(Object.keys(path).sort(), expectedExports);
});

test("path::posix exports the public API", () => {
  equal(Object.keys(posix).sort(), expectedExports);
});

test("path::windows exports the public API", () => {
  equal(Object.keys(windows).sort(), expectedExports);
});
