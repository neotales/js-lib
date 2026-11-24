import { deepStrictEqual as equal } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { test } from "@neotales/test";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { resolve } from "./resolve.ts";
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


const windowsTests =
  // arguments                               result
  [
    [["c:/blah\\blah", "d:/games", "c:../a"], "c:\\blah\\a"],
    [["c:/ignore", "d:\\a/b\\c/d", "\\e.exe"], "d:\\e.exe"],
    [["c:/ignore", "c:/some/file"], "c:\\some\\file"],
    [["d:/ignore", "d:some/dir//"], "d:\\ignore\\some\\dir"],
    [["//server/share", "..", "relative\\"], "\\\\server\\share\\relative"],
    [["c:/", "//"], "c:\\"],
    [["c:/", "//dir"], "c:\\dir"],
    [["c:/", "//server/share"], "\\\\server\\share\\"],
    [["c:/", "//server//share"], "\\\\server\\share\\"],
    [["c:/", "///some//dir"], "c:\\some\\dir"],
    [["C:\\foo\\tmp.3\\", "..\\tmp.3\\cycles\\root.js"], "C:\\foo\\tmp.3\\cycles\\root.js"],
  ];
const posixTests =
  // arguments                    result
  [
    [["/var/lib", "../", "file/"], "/var/file"],
    [["/var/lib", "/../", "file/"], "/file"],
    [["a/b/c/", "../../.."], cwdValue()],
    [["."], cwdValue()],
    [["/some/dir", ".", "/absolute/"], "/absolute"],
    [["/foo/tmp.3/", "../tmp.3/cycles/root.js"], "/foo/tmp.3/cycles/root.js"],
  ];

testCwd("path::posix.resolve()", function () {
  posixTests.forEach(function (p) {
    const args = p[0] as string[];
    const actual = posix.resolve.apply(null, args);
    equal(actual, p[1]);
  });
});

testCwd("path::windows.resolve()", function () {
  windowsTests.forEach(function (p) {
    const args = p[0] as string[];
    const actual = windows.resolve.apply(null, args);
    equal(actual, p[1]);
  });
});

testCwd("path::resolve() returns current working directory if input is empty", function () {
  const pwd = cwdValue();
  equal(resolve(""), pwd);
  equal(resolve("", ""), pwd);
});
