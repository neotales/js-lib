import { deepStrictEqual as equal } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { test } from "@neotales/test";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { extname as posixUnstableExtname } from "./posix/extname.ts";
import { extname as windowsUnstableExtname } from "./windows/extname.ts";

const HAS_URL = typeof URL !== "undefined";
function testUrl(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!HAS_URL) t.skip("URL is not available in this runtime");
    fn();
  });
}


const slashRE = /\//g;

const pairs = [
  ["", ""],
  ["/path/to/file", ""],
  ["/path/to/file.ext", ".ext"],
  ["/path.to/file.ext", ".ext"],
  ["/path.to/file", ""],
  ["/path.to/.file", ""],
  ["/path.to/.file.ext", ".ext"],
  ["/path/to/f.ext", ".ext"],
  ["/path/to/..ext", ".ext"],
  ["/path/to/..", ""],
  ["file", ""],
  ["file.ext", ".ext"],
  [".file", ""],
  [".file.ext", ".ext"],
  ["/file", ""],
  ["/file.ext", ".ext"],
  ["/.file", ""],
  ["/.file.ext", ".ext"],
  [".path/file.ext", ".ext"],
  ["file.ext.ext", ".ext"],
  ["file.", "."],
  [".", ""],
  ["./", ""],
  [".file.ext", ".ext"],
  [".file", ""],
  [".file.", "."],
  [".file..", "."],
  ["..", ""],
  ["../", ""],
  ["..file.ext", ".ext"],
  ["..file", ".file"],
  ["..file.", "."],
  ["..file..", "."],
  ["...", "."],
  ["...ext", ".ext"],
  ["....", "."],
  ["file.ext/", ".ext"],
  ["file.ext//", ".ext"],
  ["file/", ""],
  ["file//", ""],
  ["file./", "."],
  ["file.//", "."],
] as const;

testUrl("path::posix.extname()", function () {
  pairs.forEach(function (p) {
    const input = p[0];
    const expected = p[1];
    equal(expected, posix.extname(input));
  });

  // On *nix, backslash is a valid name component like any other character.
  equal(posix.extname(".\\"), "");
  equal(posix.extname("..\\"), ".\\");
  equal(posix.extname("file.ext\\"), ".ext\\");
  equal(posix.extname("file.ext\\\\"), ".ext\\\\");
  equal(posix.extname("file\\"), "");
  equal(posix.extname("file\\\\"), "");
  equal(posix.extname("file.\\"), ".\\");
  equal(posix.extname("file.\\\\"), ".\\\\");

  equal(posixUnstableExtname(new URL("file:///home/user/Documents/image.png")), ".png");
  equal(posixUnstableExtname(new URL("file:///home/user/Documents")), "");
});

testUrl("path::windows.extname()", function () {
  pairs.forEach(function (p) {
    const input = p[0].replace(slashRE, "\\");
    const expected = p[1];
    equal(expected, windows.extname(input));
    equal(expected, windows.extname("C:" + input));
  });

  // On Windows, backslash is a path separator.
  equal(windows.extname(".\\"), "");
  equal(windows.extname("..\\"), "");
  equal(windows.extname("file.ext\\"), ".ext");
  equal(windows.extname("file.ext\\\\"), ".ext");
  equal(windows.extname("file\\"), "");
  equal(windows.extname("file\\\\"), "");
  equal(windows.extname("file.\\"), ".");
  equal(windows.extname("file.\\\\"), ".");

  equal(windowsUnstableExtname(new URL("file:///C:/home/user/Documents/image.png")), ".png");
  equal(windowsUnstableExtname(new URL("file:///C:/home/user/Documents")), "");
});
