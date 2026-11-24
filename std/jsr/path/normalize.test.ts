import { deepStrictEqual as equal } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "@neotales/test";
import * as windows from "./windows/mod.ts";
import * as posix from "./posix/mod.ts";
import { normalize as windowsUnstableNormalize } from "./windows/normalize.ts";
import { normalize as posixUnstableNormalize } from "./posix/normalize.ts";

const HAS_URL = typeof URL !== "undefined";
function testUrl(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!HAS_URL) t.skip("URL is not available in this runtime");
    fn();
  });
}


test(`path::normalize() returns "." if input is empty`, function () {
  equal(posix.normalize(""), ".");
  equal(windows.normalize(""), ".");
});

testUrl("path::posix.normalize() normalizes posix specific paths", () => {
  equal(posix.normalize("/foo/bar//baz/asdf/quux/.."), "/foo/bar/baz/asdf");
  equal(posixUnstableNormalize(new URL("file:///foo/bar//baz/asdf/quux/..")), "/foo/bar/baz/asdf/");
});

testUrl("path::windows.normalize() normalizes windows specific paths", () => {
  equal(windows.normalize("//server/share/dir/file.ext"), "\\\\server\\share\\dir\\file.ext");
  equal(windowsUnstableNormalize(new URL("file:///C:/foo/bar/../baz/quux")), "C:\\foo\\baz\\quux");
});
