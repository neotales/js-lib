import { deepStrictEqual as equal, throws } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "@neotales/test";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

const HAS_URL = typeof URL !== "undefined";
function testUrl(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!HAS_URL) t.skip("URL is not available in this runtime");
    fn();
  });
}


testUrl("path::posix.fromFileUrl()", function () {
  equal(posix.fromFileUrl(new URL("file:///home/foo")), "/home/foo");
  equal(posix.fromFileUrl("file:///"), "/");
  equal(posix.fromFileUrl("file:///home/foo"), "/home/foo");
  equal(posix.fromFileUrl("file:///home/foo%20bar"), "/home/foo bar");
  equal(posix.fromFileUrl("file:///%"), "/%");
  equal(posix.fromFileUrl("file://localhost/foo"), "/foo");
  equal(posix.fromFileUrl("file:///C:"), "/C:");
  equal(posix.fromFileUrl("file:///C:/"), "/C:/");
  equal(posix.fromFileUrl("file:///C:/Users/"), "/C:/Users/");
  equal(posix.fromFileUrl("file:///C:foo/bar"), "/C:foo/bar");
  throws(
    () => posix.fromFileUrl("http://localhost/foo"),
    TypeError,
    'URL must be a file URL: received "http:"',
  );
  throws(
    () => posix.fromFileUrl("abcd://localhost/foo"),
    TypeError,
    'URL must be a file URL: received "abcd:"',
  );
});

testUrl("path::windows.fromFileUrl()", function () {
  equal(windows.fromFileUrl(new URL("file:///home/foo")), "\\home\\foo");
  equal(windows.fromFileUrl("file:///"), "\\");
  equal(windows.fromFileUrl("file:///home/foo"), "\\home\\foo");
  equal(windows.fromFileUrl("file:///home/foo%20bar"), "\\home\\foo bar");
  equal(windows.fromFileUrl("file:///%"), "\\%");
  if (new URL("file://127.0.0.1/foo").hostname === "127.0.0.1") {
    equal(windows.fromFileUrl("file://127.0.0.1/foo"), "\\\\127.0.0.1\\foo");
  }
  equal(windows.fromFileUrl("file://localhost/foo"), "\\foo");
  equal(windows.fromFileUrl("file:///C:"), "C:\\");
  equal(windows.fromFileUrl("file:///C:/"), "C:\\");
  // Drop the hostname if a drive letter is parsed.
  equal(windows.fromFileUrl("file://localhost/C:/"), "C:\\");
  equal(windows.fromFileUrl("file:///C:/Users/"), "C:\\Users\\");
  equal(windows.fromFileUrl("file:///C:foo/bar"), "\\C:foo\\bar");
  throws(
    () => windows.fromFileUrl("http://localhost/foo"),
    TypeError,
    'URL must be a file URL: received "http:"',
  );
  throws(
    () => windows.fromFileUrl("abcd://localhost/foo"),
    TypeError,
    'URL must be a file URL: received "abcd:"',
  );
});
