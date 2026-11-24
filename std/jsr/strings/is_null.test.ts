import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { isNull } from "./is_null.ts";

test("strings::isNull returns true when string is null", () => {
  const s: string | null = null;
  equal(true, isNull(s));
});

test("strings::isNull returns false when string is empty", () => {
  const s = "";
  equal(false, isNull(s));
});

test("strings::isNull returns false when string has value", () => {
  const s = "test";
  equal(false, isNull(s));
});
