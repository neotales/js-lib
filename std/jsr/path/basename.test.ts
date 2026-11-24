import { deepStrictEqual as equal, throws } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { test } from "@neotales/test";
import { basename } from "./basename.ts";
import * as posix from "./posix/mod.ts";
import * as windows from "./windows/mod.ts";
import { basename as posixUnstableBasename } from "./posix/basename.ts";
import { basename as windowsUnstableBasename } from "./windows/basename.ts";

const HAS_URL = typeof URL !== "undefined";
function testUrl(name: string, fn: () => void): void {
  test(name, (t) => {
    if (!HAS_URL) t.skip("URL is not available in this runtime");
    fn();
  });
}


// Test suite from "GNU core utilities"
// https://github.com/coreutils/coreutils/blob/master/tests/misc/basename.pl
const COREUTILS_TESTSUITE = [
  [["d/f"], "f"],
  [["/d/f"], "f"],
  [["d/f/"], "f"],
  [["d/f//"], "f"],
  [["f"], "f"],
  [["/"], "/"],
  [["///"], "/"],
  [["///a///"], "a"],
  [[""], ""],
  [["aa", "a"], "a"],
  [["a-a", "-a"], "a"],
  [["f.s", ".s"], "f"],
  [["fs", "s"], "f"],
  [["fs", "fs"], "fs"],
  [["fs/", "s"], "f"],
  [["dir/file.suf", ".suf"], "file"],
  [["fs", "x"], "fs"],
  [["fs", ""], "fs"],
  [["fs/", "s/"], "fs"],
] as const;

const POSIX_TESTSUITE = [
  [[""], ""],
  [["/dir/basename.ext"], "basename.ext"],
  [["/basename.ext"], "basename.ext"],
  [["basename.ext"], "basename.ext"],
  [["basename.ext/"], "basename.ext"],
  [["basename.ext//"], "basename.ext"],
  [["aaa/bbb", "/bbb"], "bbb"],
  [["aaa/bbb", "a/bbb"], "bbb"],
  [["aaa/bbb", "bbb"], "bbb"],
  [["aaa/bbb//", "bbb"], "bbb"],
  [["aaa/bbb", "bb"], "b"],
  [["aaa/bbb", "b"], "bb"],
  [["/aaa/bbb", "/bbb"], "bbb"],
  [["/aaa/bbb", "a/bbb"], "bbb"],
  [["/aaa/bbb", "bbb"], "bbb"],
  [["/aaa/bbb//", "bbb"], "bbb"],
  [["/aaa/bbb//", "a/bbb"], "bbb"],
  [["/aaa/bbb", "bb"], "b"],
  [["/aaa/bbb", "b"], "bb"],
  [["/aaa/bbb"], "bbb"],
  [["/aaa/"], "aaa"],
  [["/aaa/b"], "b"],
  [["/a/b"], "b"],
  [["//a"], "a"],
  [["///"], "/"],
  [["///", "bbb"], "/"],
  [["//", "bbb"], "/"],
] as const;

const POSIX_URL_TESTSUITE = HAS_URL ? ([
  [[new URL("file:///dir/basename.ext")], "basename.ext"],
  [[new URL("file:///basename.ext"), ".ext"], "basename"],
  [[new URL("file:///dir/basename.ext")], "basename.ext"],
  [[new URL("file:///aaa/bbb/")], "bbb"],
  [[new URL("file:///aaa/bbb"), "b"], "bb"],
  [[new URL("file:///aaa/bbb"), "bb"], "b"],
  [[new URL("file:///aaa/bbb"), "bbb"], "bbb"],
  [[new URL("file:///aaa/bbb"), "a/bbb"], "bbb"],
  [[new URL("file://///a")], "a"],
] as const) : [];

const WIN_TESTSUITE = [
  [["\\dir\\basename.ext"], "basename.ext"],
  [["\\basename.ext"], "basename.ext"],
  [["basename.ext"], "basename.ext"],
  [["basename.ext\\"], "basename.ext"],
  [["basename.ext\\\\"], "basename.ext"],
  [["foo"], "foo"],
  [["aaa\\bbb", "\\bbb"], "bbb"],
  [["aaa\\bbb", "a\\bbb"], "bbb"],
  [["aaa\\bbb", "bbb"], "bbb"],
  [["aaa\\bbb\\\\\\\\", "bbb"], "bbb"],
  [["aaa\\bbb", "bb"], "b"],
  [["aaa\\bbb", "b"], "bb"],
  [["/aaa/bbb", "bb"], "b"],
  [["C:"], ""],
  [["C:."], "."],
  [["C:\\"], "\\"],
  [["C:\\dir\\base.ext"], "base.ext"],
  [["C:\\basename.ext"], "basename.ext"],
  [["C:basename.ext"], "basename.ext"],
  [["C:basename.ext\\"], "basename.ext"],
  [["C:basename.ext\\\\"], "basename.ext"],
  [["C:foo"], "foo"],
  [["file:stream"], "file:stream"],
] as const;

const WIN_URL_TESTSUITE = HAS_URL ? ([
  [[new URL("file:///")], "\\"],
  [[new URL("file:///C:/")], "\\"],
  [[new URL("file:///C:/aaa")], "aaa"],
  [[new URL("file://///"), undefined], "\\"],
] as const) : [];

test("path::posix.basename()", function () {
  for (const [[name, suffix], expected] of COREUTILS_TESTSUITE) {
    equal(basename(name, suffix), expected);
  }

  for (const [[name, suffix], expected] of POSIX_TESTSUITE) {
    // deno-lint-ignore no-explicit-any
    equal(posix.basename(name as any, suffix), expected);
  }

  // On unix a backslash is just treated as any other character.
  equal(posix.basename("\\dir\\basename.ext"), "\\dir\\basename.ext");
  equal(posix.basename("\\basename.ext"), "\\basename.ext");
  equal(posix.basename("basename.ext"), "basename.ext");
  equal(posix.basename("basename.ext\\"), "basename.ext\\");
  equal(posix.basename("basename.ext\\\\"), "basename.ext\\\\");
  equal(posix.basename("foo"), "foo");

  // POSIX filenames may include control characters
  const controlCharFilename = "Icon" + String.fromCharCode(13);
  equal(posix.basename("/a/b/" + controlCharFilename), controlCharFilename);
});

testUrl("path::posix.basename() throws with non-file URL", () => {
  throws(
    () => posixUnstableBasename(new URL("https://deno.land/")),
    TypeError,
    'URL must be a file URL: received "https:"',
  );
  for (const [[name, suffix], expected] of POSIX_URL_TESTSUITE) {
    equal(posixUnstableBasename(name, suffix), expected);
  }
});

test("path::windows.basename()", function () {
  for (const [[name, suffix], expected] of WIN_TESTSUITE) {
    // deno-lint-ignore no-explicit-any
    equal(windows.basename(name as any, suffix), expected);
  }

  // windows should pass all "forward slash" posix tests as well.
  for (const [[name, suffix], expected] of COREUTILS_TESTSUITE) {
    // deno-lint-ignore no-explicit-any
    equal(windows.basename(name as any, suffix), expected);
  }

  for (const [[name, suffix], expected] of POSIX_TESTSUITE) {
    // deno-lint-ignore no-explicit-any
    equal(windows.basename(name as any, suffix), expected);
  }
});

testUrl("path::windows.basename() throws with non-file URL", () => {
  for (const [[name, suffix], expected] of WIN_URL_TESTSUITE) {
    equal(windowsUnstableBasename(name, suffix), expected);
  }

  throws(
    () => windowsUnstableBasename(new URL("https://deno.land/")),
    TypeError,
    'URL must be a file URL: received "https:"',
  );
});
