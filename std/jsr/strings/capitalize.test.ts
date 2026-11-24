import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { capitalize } from "./capitalize.ts";

// =============================================================================
// Basic capitalization
// =============================================================================

test("strings::capitalize capitalizes first letter of lowercase word", () => {
  equal(capitalize("hello"), "Hello");
});

test("strings::capitalize handles already capitalized word", () => {
  equal(capitalize("Hello"), "Hello");
});

test("strings::capitalize lowercases rest of word", () => {
  equal(capitalize("HELLoWorld"), "Helloworld");
});

test("strings::capitalize preserves separators", () => {
  equal(capitalize("hello_world"), "Hello_world");
  equal(capitalize("HELLo-World"), "Hello-world");
});

test("strings::capitalize handles spaces", () => {
  equal(capitalize("hello world"), "Hello world");
});

// =============================================================================
// Edge cases
// =============================================================================

test("strings::capitalize handles empty string", () => {
  equal(capitalize(""), "");
});

test("strings::capitalize handles single character", () => {
  equal(capitalize("a"), "A");
  equal(capitalize("A"), "A");
});

test("strings::capitalize handles all caps", () => {
  equal(capitalize("HELLO"), "Hello");
});

test("strings::capitalize handles mixed case phrases", () => {
  equal(capitalize("Bob The OG"), "Bob the og");
});

// =============================================================================
// Unicode support
// =============================================================================

test("strings::capitalize handles unicode characters", () => {
  equal(capitalize("ñoño"), "Ñoño");
  equal(capitalize("über"), "Über");
});

test("strings::capitalize handles accented characters", () => {
  equal(capitalize("école"), "École");
});
