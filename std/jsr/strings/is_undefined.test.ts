import { ok } from "@neotales/assert";
const nope = (value: unknown, message?: string) => ok(!value, message);
import { test } from "@neotales/test";
import { isUndefined } from "./is_undefined.ts";

// =============================================================================
// Basic checks
// =============================================================================

test("strings::isUndefined returns true for undefined", () => {
  const s: string | undefined = undefined;
  ok(isUndefined(s));
});

test("strings::isUndefined returns true for explicitly undefined", () => {
  ok(isUndefined(undefined));
});

test("strings::isUndefined returns false for empty string", () => {
  const s = "";
  nope(isUndefined(s));
});

test("strings::isUndefined returns false for non-empty string", () => {
  const s = "test";
  nope(isUndefined(s));
});

// =============================================================================
// Edge cases
// =============================================================================

test("strings::isUndefined returns false for whitespace string", () => {
  nope(isUndefined(" "));
  nope(isUndefined("\t"));
  nope(isUndefined("\n"));
});

test("strings::isUndefined returns false for string with value", () => {
  nope(isUndefined("hello world"));
});

test("strings::isUndefined works with optional parameters", () => {
  function optionalValue(s?: string) {
    if (isUndefined(s)) {
      return "undefined";
    }
    return s;
  }
  ok(optionalValue() === "undefined");
  ok(optionalValue("hello") === "hello");
});
