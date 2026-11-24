import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { underscore } from "./underscore.ts";

// =============================================================================
// Basic conversions
// =============================================================================

test("strings::underscore converts PascalCase", () => {
  equal(underscore("HelloWorld"), "hello_world");
});

test("strings::underscore converts camelCase", () => {
  equal(underscore("helloWorld"), "hello_world");
});

test("strings::underscore preserves existing underscores", () => {
  equal(underscore("hello_world"), "hello_world");
});

test("strings::underscore converts kebab case", () => {
  equal(underscore("hello-World"), "hello_world");
});

test("strings::underscore converts UPPER-kebab case", () => {
  equal(underscore("HELLO-World"), "hello_world");
});

// =============================================================================
// Space handling
// =============================================================================

test("strings::underscore converts spaces", () => {
  equal(underscore("hello world"), "hello_world");
});

test("strings::underscore handles multiple spaces", () => {
  equal(underscore("hello  world"), "hello_world");
  equal(underscore("hello   world"), "hello_world");
});

test("strings::underscore handles multiple dashes", () => {
  equal(underscore("hello----world"), "hello_world");
});

test("strings::underscore handles leading spaces", () => {
  equal(underscore("   helloWorld"), "hello_world");
});

// =============================================================================
// Screaming option
// =============================================================================

test("strings::underscore with screaming option", () => {
  equal(underscore("hello world", { screaming: true }), "HELLO_WORLD");
});

test("strings::underscore screaming from camelCase", () => {
  equal(underscore("helloWorld", { screaming: true }), "HELLO_WORLD");
});

test("strings::underscore screaming from kebab case", () => {
  equal(underscore("hello-world", { screaming: true }), "HELLO_WORLD");
});

// =============================================================================
// Edge cases
// =============================================================================

test("strings::underscore handles empty string", () => {
  equal(underscore(""), "");
});

test("strings::underscore handles single word", () => {
  equal(underscore("hello"), "hello");
  equal(underscore("Hello"), "hello");
});

test("strings::underscore handles single character", () => {
  equal(underscore("a"), "a");
  equal(underscore("A"), "a");
});

test("strings::underscore handles all caps", () => {
  equal(underscore("HELLO"), "hello");
});

// =============================================================================
// Unicode support
// =============================================================================

test("strings::underscore handles unicode characters", () => {
  equal(underscore("helloWörld"), "hello_wörld");
});

test("strings::underscore screaming with unicode", () => {
  equal(underscore("helloWörld", { screaming: true }), "HELLO_WÖRLD");
});
