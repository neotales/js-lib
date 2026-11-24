import { ok } from "@neotales/assert";
const nope = (value: unknown, message?: string) => ok(!value, message);
import { test } from "@neotales/test";
import { endsWith, endsWithFold } from "./ends_with.ts";

// =============================================================================
// endsWith - case-sensitive
// =============================================================================

test("strings::endsWith returns true for matching suffix", () => {
  ok(endsWith("Hello World", "World"));
});

test("strings::endsWith returns false for case mismatch", () => {
  nope(endsWith("Hello World", "world"));
  nope(endsWith("Hello World", "WORLD"));
});

test("strings::endsWith returns true for single char suffix", () => {
  ok(endsWith("Hello", "o"));
});

test("strings::endsWith returns false for non-suffix", () => {
  nope(endsWith("Hello", "H"));
  nope(endsWith("Hello", "e"));
});

test("strings::endsWith returns true for empty suffix", () => {
  ok(endsWith("Hello", ""));
});

test("strings::endsWith returns true for exact match", () => {
  ok(endsWith("Hello", "Hello"));
});

test("strings::endsWith returns false for longer suffix", () => {
  nope(endsWith("Hi", "Hello"));
});

test("strings::endsWith finds partial suffix", () => {
  ok(endsWith("Hello", "lo"));
  ok(endsWith("Hello", "llo"));
});

// =============================================================================
// endsWithFold - case-insensitive
// =============================================================================

test("strings::endsWithFold returns true for case mismatch", () => {
  ok(endsWithFold("Hello World", "WORLD"));
  ok(endsWithFold("Hello World", "world"));
});

test("strings::endsWithFold returns true for mixed case", () => {
  ok(endsWithFold("Hello World", "wOrLd"));
});

test("strings::endsWithFold returns false for non-suffix", () => {
  nope(endsWithFold("Hello World", "Hello"));
});

test("strings::endsWithFold handles partial suffix", () => {
  ok(endsWithFold("Hello", "LO"));
  ok(endsWithFold("Hello", "O"));
});

test("strings::endsWithFold handles unicode case folding", () => {
  ok(endsWithFold("Hello Wörld", "WÖRLD"));
});
