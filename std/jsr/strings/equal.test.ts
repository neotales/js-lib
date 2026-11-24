import { ok } from "@neotales/assert";
const nope = (value: unknown, message?: string) => ok(!value, message);
import { test } from "@neotales/test";
import { equal, equalFold } from "./equal.ts";

// =============================================================================
// equal - case-sensitive comparison
// =============================================================================

test("strings::equal returns true for identical strings", () => {
  ok(equal("Hello", "Hello"));
});

test("strings::equal returns false for different case", () => {
  nope(equal("Hello", "hello"));
  nope(equal("Hello", "HELLO"));
});

test("strings::equal returns false for different strings", () => {
  nope(equal("Hello", "World"));
});

test("strings::equal handles empty strings", () => {
  ok(equal("", ""));
  nope(equal("", "a"));
  nope(equal("a", ""));
});

test("strings::equal handles unicode strings", () => {
  ok(equal("日本語", "日本語"));
  nope(equal("日本語", "中文"));
});

test("strings::equal handles special characters", () => {
  ok(equal("hello@world.com", "hello@world.com"));
  nope(equal("hello@world.com", "hello@World.com"));
});

// =============================================================================
// equalFold - case-insensitive comparison
// =============================================================================

test("strings::equalFold returns true for identical strings", () => {
  ok(equalFold("Hello", "Hello"));
});

test("strings::equalFold returns true for different case", () => {
  ok(equalFold("Hello", "hello"));
  ok(equalFold("Hello", "HELLO"));
  ok(equalFold("HeLLo", "hElLO"));
});

test("strings::equalFold returns false for different strings", () => {
  nope(equalFold("Hello", "World"));
});

test("strings::equalFold handles empty strings", () => {
  ok(equalFold("", ""));
  nope(equalFold("", "a"));
});

test("strings::equalFold handles unicode case folding", () => {
  ok(equalFold("hello WÖrLD", "Hello wörld"));
  ok(equalFold("WÖRLD", "wörld"));
  ok(equalFold("a😀", new Uint32Array([97, 0x1f600])));
});

test("strings::equalFold returns false for different lengths", () => {
  nope(equalFold("Hello", "Hell"));
  nope(equalFold("He", "Hello"));
});
