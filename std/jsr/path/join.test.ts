// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "@neotales/test";
import { deepStrictEqual as equal } from "@neotales/assert";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { join } from "./join.ts";
import { join as posixUnstableJoin } from "./posix/join.ts";
import { join as windowsUnstableJoin } from "./windows/join.ts";
import { cwd } from "./_globals.ts";

const HAS_CWD = (() => {
  try {
    cwd("probe");
    return true;
  } catch {
    return false;
  }
})();
function cwdValue(): string {
  return HAS_CWD ? cwd("Expected a current working directory") : "";
}
function testCwd(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!HAS_CWD) t.skip("this runtime exposes no current working directory");
    fn();
  });
}


const HAS_URL = typeof URL !== "undefined";
function testUrl(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!HAS_URL) t.skip("URL is not available in this runtime");
    fn();
  });
}


const backslashRE = /\\/g;

type TestCase = [string[], string];
type UrlTestCase = [[URL, ...string[]], string];

const joinTests: TestCase[] =
  // arguments                     result
  [
    [[".", "x/b", "..", "/b/c.js"], "x/b/c.js"],
    [[], "."],
    [["/.", "x/b", "..", "/b/c.js"], "/x/b/c.js"],
    [["/foo", "../../../bar"], "/bar"],
    [["foo", "../../../bar"], "../../bar"],
    [["foo/", "../../../bar"], "../../bar"],
    [["foo/x", "../../../bar"], "../bar"],
    [["foo/x", "./bar"], "foo/x/bar"],
    [["foo/x/", "./bar"], "foo/x/bar"],
    [["foo/x/", ".", "bar"], "foo/x/bar"],
    [["./"], "./"],
    [[".", "./"], "./"],
    [[".", ".", "."], "."],
    [[".", "./", "."], "."],
    [[".", "/./", "."], "."],
    [[".", "/////./", "."], "."],
    [["."], "."],
    [["", "."], "."],
    [["", "foo"], "foo"],
    [["foo", "/bar"], "foo/bar"],
    [["", "/foo"], "/foo"],
    [["", "", "/foo"], "/foo"],
    [["", "", "foo"], "foo"],
    [["foo", ""], "foo"],
    [["foo/", ""], "foo/"],
    [["foo", "", "/bar"], "foo/bar"],
    [["./", "..", "/foo"], "../foo"],
    [["./", "..", "..", "/foo"], "../../foo"],
    [[".", "..", "..", "/foo"], "../../foo"],
    [["", "..", "..", "/foo"], "../../foo"],
    [["/"], "/"],
    [["/", "."], "/"],
    [["/", ".."], "/"],
    [["/", "..", ".."], "/"],
    [[""], "."],
    [["", ""], "."],
    [[" /foo"], " /foo"],
    [[" ", "foo"], " /foo"],
    [[" ", "."], " "],
    [[" ", "/"], " /"],
    [[" ", ""], " "],
    [["/", "foo"], "/foo"],
    [["/", "/foo"], "/foo"],
    [["/", "//foo"], "/foo"],
    [["/", "", "/foo"], "/foo"],
    [["", "/", "foo"], "/foo"],
    [["", "/", "/foo"], "/foo"],
  ];

const joinUrlTests: UrlTestCase[] = HAS_URL ? ([
  // URLs
  [[new URL("file:///"), "x/b", "..", "/b/c.js"], "/x/b/c.js"],
  [[new URL("file:///foo"), "../../../bar"], "/bar"],
  [[new URL("file:///foo"), "bar", "baz/asdf", "quux", ".."], "/foo/bar/baz/asdf"],
]) : [];

// Windows-specific join tests
const windowsJoinTests: TestCase[] = [
  // arguments                     result
  // UNC path expected
  [["//foo/bar"], "\\\\foo\\bar\\"],
  [["\\/foo/bar"], "\\\\foo\\bar\\"],
  [["\\\\foo/bar"], "\\\\foo\\bar\\"],
  // UNC path expected - server and share separate
  [["//foo", "bar"], "\\\\foo\\bar\\"],
  [["//foo/", "bar"], "\\\\foo\\bar\\"],
  [["//foo", "/bar"], "\\\\foo\\bar\\"],
  // UNC path expected - questionable
  [["//foo", "", "bar"], "\\\\foo\\bar\\"],
  [["//foo/", "", "bar"], "\\\\foo\\bar\\"],
  [["//foo/", "", "/bar"], "\\\\foo\\bar\\"],
  // UNC path expected - even more questionable
  [["", "//foo", "bar"], "\\\\foo\\bar\\"],
  [["", "//foo/", "bar"], "\\\\foo\\bar\\"],
  [["", "//foo/", "/bar"], "\\\\foo\\bar\\"],
  // No UNC path expected (no double slash in first component)
  [["\\", "foo/bar"], "\\foo\\bar"],
  [["\\", "/foo/bar"], "\\foo\\bar"],
  [["", "/", "/foo/bar"], "\\foo\\bar"],
  // No UNC path expected (no non-slashes in first component -
  // questionable)
  [["//", "foo/bar"], "\\foo\\bar"],
  [["//", "/foo/bar"], "\\foo\\bar"],
  [["\\\\", "/", "/foo/bar"], "\\foo\\bar"],
  [["//"], "\\"],
  // No UNC path expected (share name missing - questionable).
  [["//foo"], "\\foo"],
  [["//foo/"], "\\foo\\"],
  [["//foo", "/"], "\\foo\\"],
  [["//foo", "", "/"], "\\foo\\"],
  // No UNC path expected (too many leading slashes - questionable)
  [["///foo/bar"], "\\foo\\bar"],
  [["////foo", "bar"], "\\foo\\bar"],
  [["\\\\\\/foo/bar"], "\\foo\\bar"],
  // Drive-relative vs drive-absolute paths. This merely describes the
  // status quo, rather than being obviously right
  [["c:"], "c:."],
  [["c:."], "c:."],
  [["c:", ""], "c:."],
  [["", "c:"], "c:."],
  [["c:.", "/"], "c:.\\"],
  [["c:.", "file"], "c:file"],
  [["c:", "/"], "c:\\"],
  [["c:", "file"], "c:\\file"],
];
const windowsJoinUrlTests: UrlTestCase[] = HAS_URL ? ([
  // URLs
  [[new URL("file:///c:")], "c:\\"],
  [[new URL("file:///c:"), "file"], "c:\\file"],
  [[new URL("file:///c:/"), "file"], "c:\\file"],
]) : [];

test("path::posix.join()", function () {
  joinTests.forEach(function (p) {
    const args = p[0];
    const actual = posix.join.apply(null, args);
    equal(actual, p[1]);
  });
});

testUrl("path::posix.join() accepts file URLs", function () {
  joinUrlTests.forEach(function (p) {
    const args = p[0];
    const actual = posixUnstableJoin.apply(null, args);
    equal(actual, p[1]);
  });
});

test("path::windows.join()", function () {
  joinTests.forEach(function (p) {
    const args = p[0];
    const actual = windows.join.apply(null, args).replace(backslashRE, "/");
    equal(actual, p[1]);
  });
  windowsJoinTests.forEach(function (p) {
    const args = p[0];
    const actual = windows.join.apply(null, args);
    equal(actual, p[1]);
  });
});

testUrl("path::windows.join() accepts file URLs", function () {
  joinUrlTests.forEach(function (p) {
    const args = p[0];
    const actual = windowsUnstableJoin.apply(null, args).replace(backslashRE, "/");
    equal(actual, p[1]);
  });
  windowsJoinUrlTests.forEach(function (p) {
    const args = p[0];
    const actual = windowsUnstableJoin.apply(null, args);
    equal(actual, p[1]);
  });
});

testCwd(`path::join() returns "." if input is empty`, function () {
  equal(join(""), ".");
  equal(join("", ""), ".");

  const pwd = cwd("Expected a current working directory");
  equal(join(pwd), pwd);
  equal(join(pwd, ""), pwd);
});
