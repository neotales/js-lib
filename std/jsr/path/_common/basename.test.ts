import { deepStrictEqual as equal, throws } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.

import { test } from "@neotales/test";
import { assertArgs, lastPathSegment, stripSuffix } from "./basename.ts";
import { CHAR_FORWARD_SLASH } from "@neotales/chars/constants";

test("path::assertArgs()", () => {
  equal(assertArgs("", ""), "");
  equal(assertArgs("foo", "bar"), undefined);
  // @ts-expect-error - testing invalid input for suffix
  equal(assertArgs("", undefined), "");
});

test("path::assertArgs() throws", () => {
  throws(
    // @ts-expect-error - testing invalid input
    () => assertArgs(undefined, "bar"),
    TypeError,
    'Path must be a string, received "undefined"',
  );
  throws(
    // @ts-expect-error - testing invalid input
    () => assertArgs("foo", undefined),
    TypeError,
    'Suffix must be a string, received "undefined"',
  );
});

test("path::lastPathSegment()", () => {
  equal(
    lastPathSegment("foo", (char) => char === CHAR_FORWARD_SLASH),
    "foo",
  );
  equal(
    lastPathSegment("foo/bar", (char) => char === CHAR_FORWARD_SLASH),
    "bar",
  );
  equal(
    lastPathSegment("foo/bar/baz", (char) => char === CHAR_FORWARD_SLASH),
    "baz",
  );
});

test("path::stripSuffix()", () => {
  equal(stripSuffix("foo", "bar"), "foo");
  equal(stripSuffix("foobar", "bar"), "foo");
  equal(stripSuffix("foobar", "baz"), "foobar");
  equal(stripSuffix("foobar", "foobar"), "foobar");
});
