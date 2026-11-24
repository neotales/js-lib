import { deepStrictEqual as equal, throws } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.

import { test } from "@neotales/test";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";

const HAS_URL = typeof URL !== "undefined";
function canSetFileHost(): boolean {
  if (!HAS_URL) return false;
  const url = new URL("file:///");
  url.hostname = "127.0.0.1";
  return url.hostname === "127.0.0.1";
}
function testUrl(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!HAS_URL) t.skip("URL is not available in this runtime");
    fn();
  });
}


testUrl("path::posix.toFileUrl()", function () {
  equal(posix.toFileUrl("/home/foo").href, "file:///home/foo");
  equal(posix.toFileUrl("/home/ ").href, "file:///home/%20");
  equal(posix.toFileUrl("/home/%20").href, "file:///home/%2520");
  equal(posix.toFileUrl("/home\\foo").href, "file:///home%5Cfoo");
  throws(() => posix.toFileUrl("foo").href, TypeError, 'Path must be absolute: received "foo"');
  throws(() => posix.toFileUrl("C:/"), TypeError, 'Path must be absolute: received "C:/"');
  equal(posix.toFileUrl("//localhost/home/foo").href, "file:///localhost/home/foo");
  equal(posix.toFileUrl("//localhost/").href, "file:///localhost/");
  equal(posix.toFileUrl("//:/home/foo").href, "file:///:/home/foo");
  equal(posix.toFileUrl("///home/foo").href, "file:///home/foo");
  equal(posix.toFileUrl("////home/foo").href, "file:///home/foo");
});

testUrl("path::windows.toFileUrl()", function () {
  equal(windows.toFileUrl("/home/foo").href, "file:///home/foo");
  equal(windows.toFileUrl("/home/ ").href, "file:///home/%20");
  equal(windows.toFileUrl("/home/%20").href, "file:///home/%2520");
  equal(windows.toFileUrl("/home\\foo").href, "file:///home/foo");
  throws(() => windows.toFileUrl("foo").href, TypeError, 'Path must be absolute: received "foo"');
  equal(windows.toFileUrl("C:/").href, "file:///C:/");
  equal(windows.toFileUrl("//localhost/home/foo").href, "file:///home/foo");
  if (canSetFileHost()) {
    equal(windows.toFileUrl("//127.0.0.1/home/foo").href, "file://127.0.0.1/home/foo");
  }
  equal(windows.toFileUrl("//localhost/").href, "file:///");
  if (canSetFileHost()) {
    equal(windows.toFileUrl("//127.0.0.1/").href, "file://127.0.0.1/");
  }
  throws(() => windows.toFileUrl("//:/home/foo").href, TypeError, 'Invalid hostname: ""');
});
