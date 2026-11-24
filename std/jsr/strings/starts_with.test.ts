import { ok } from "@neotales/assert";
const nope = (value: unknown, message?: string) => ok(!value, message);
import { test } from "@neotales/test";
import { startsWith, startsWithFold } from "./starts_with.ts";

// =============================================================================
// startsWith - case-sensitive
// =============================================================================

test("strings::startsWith returns true for matching prefix", () => {
  ok(startsWith("Hello World", "Hello"));
});

test("strings::startsWith returns false for case mismatch", () => {
  nope(startsWith("Hello World", "hello"));
  nope(startsWith("Hello World", "HELLO"));
});

test("strings::startsWith returns true for single char prefix", () => {
  ok(startsWith("Hello", "H"));
});

test("strings::startsWith returns false for non-prefix", () => {
  nope(startsWith("Hello", "e"));
  nope(startsWith("Hello", "o"));
});

test("strings::startsWith returns true for empty prefix", () => {
  ok(startsWith("Hello", ""));
});

test("strings::startsWith returns true for exact match", () => {
  ok(startsWith("Hello", "Hello"));
});

test("strings::startsWith returns false for longer prefix", () => {
  nope(startsWith("Hi", "Hello"));
});

// =============================================================================
// startsWithFold - case-insensitive
// =============================================================================

test("strings::startsWithFold returns true for case mismatch", () => {
  ok(startsWithFold("Hello World", "hello"));
  ok(startsWithFold("Hello World", "HELLO"));
});

test("strings::startsWithFold returns true for mixed case", () => {
  ok(startsWithFold("Hello World", "hElLo"));
});

test("strings::startsWithFold returns false for non-prefix", () => {
  nope(startsWithFold("Hello World", "World"));
});

test("strings::startsWithFold handles unicode case folding", () => {
  ok(startsWithFold("Wörld", "WÖRLD"));
  ok(startsWithFold("WÖRLD", "wörld"));
});
