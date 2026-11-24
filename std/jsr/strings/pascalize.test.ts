import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { pascalize } from "./pascalize.ts";

// =============================================================================
// Basic conversions
// =============================================================================

test("strings::pascalize converts space-separated words", () => {
  equal(pascalize("hello world"), "HelloWorld");
});

test("strings::pascalize converts underscore case", () => {
  equal(pascalize("hello_world"), "HelloWorld");
});

test("strings::pascalize converts kebab case", () => {
  equal(pascalize("hello-world"), "HelloWorld");
});

test("strings::pascalize handles existing PascalCase", () => {
  equal(pascalize("HelloWorld"), "Helloworld");
});

test("strings::pascalize handles camelCase", () => {
  equal(pascalize("helloWorld"), "Helloworld");
});

// =============================================================================
// Unicode support
// =============================================================================

test("strings::pascalize handles unicode characters", () => {
  equal(pascalize("hello wörld"), "HelloWörld");
});

test("strings::pascalize handles unicode in existing case", () => {
  equal(pascalize("helloWörld"), "Hellowörld");
});

test("strings::pascalize handles mixed unicode case", () => {
  equal(pascalize("hello WÖrLD"), "HelloWörld");
});

// =============================================================================
// Edge cases
// =============================================================================

test("strings::pascalize handles empty string", () => {
  equal(pascalize(""), "");
});

test("strings::pascalize handles single word", () => {
  equal(pascalize("hello"), "Hello");
});

test("strings::pascalize handles single character", () => {
  equal(pascalize("a"), "A");
});

test("strings::pascalize handles all uppercase", () => {
  equal(pascalize("HELLO"), "Hello");
});

test("strings::pascalize handles multiple separators", () => {
  equal(pascalize("hello_world-test"), "HelloWorldTest");
});
