import { deepStrictEqual as equal, throws } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.

import { test } from "@neotales/test";
import { assertPath } from "./assert_path.ts";

test("path::assertPath()", () => {
  equal(assertPath(""), undefined);
  equal(assertPath("foo"), undefined);
});

test("path::assertPath() throws", () => {
  throws(() => assertPath(undefined), TypeError, 'Path must be a string, received "undefined"');
});
