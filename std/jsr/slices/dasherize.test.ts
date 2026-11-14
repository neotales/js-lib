import { deepStrictEqual as equal, throws } from "@neotales/assert";
import { test } from "@neotales/test";
import { dasherize } from "./dasherize.ts";

/** Helper to convert result to string */
function toDash(input: string, options?: { screaming?: boolean; preserveCase?: boolean }): string {
  return String.fromCodePoint(...dasherize(input, options));
}

// =============================================================================
// dasherize - Basic Tests
// =============================================================================

test("slices::dasherize throws when preserveCase and screaming both true", () => {
  throws(() => dasherize("hello world", { preserveCase: true, screaming: true }));
});

test("slices::dasherize with space-separated words", () => {
  equal(toDash("hello world"), "hello-world");
  equal(toDash("one two three"), "one-two-three");
});

test("slices::dasherize with camelCase", () => {
  equal(toDash("helloWorld"), "hello-world");
  equal(toDash("oneTwoThree"), "one-two-three");
});

test("slices::dasherize with PascalCase", () => {
  equal(toDash("HelloWorld"), "hello-world");
  equal(toDash("OneTwoThree"), "one-two-three");
});

test("slices::dasherize with snake_case", () => {
  equal(toDash("hello_world"), "hello-world");
  equal(toDash("one_two_three"), "one-two-three");
});

test("slices::dasherize with existing hyphens", () => {
  equal(toDash("hello-world"), "hello-world");
  equal(toDash("already-dashed"), "already-dashed");
});

test("slices::dasherize with mixed separators", () => {
  equal(toDash("hello_world test"), "hello-world-test");
  equal(toDash("one-two_three four"), "one-two-three-four");
});

test("slices::dasherize with single word", () => {
  equal(toDash("hello"), "hello");
  equal(toDash("HELLO"), "hello");
});

test("slices::dasherize with numbers", () => {
  equal(toDash("hello123"), "hello123");
  equal(toDash("version2"), "version2");
  equal(toDash("test123test"), "test123test");
});

// =============================================================================
// dasherize - Options Tests
// =============================================================================

test("slices::dasherize with screaming option", () => {
  equal(toDash("hello world", { screaming: true }), "HELLO-WORLD");
  equal(toDash("helloWorld", { screaming: true }), "HELLO-WORLD");
  equal(toDash("HelloWorld", { screaming: true }), "HELLO-WORLD");
});

test("slices::dasherize with preserveCase option", () => {
  equal(toDash("hello world", { preserveCase: true }), "hello-world");
  equal(toDash("helloWorld", { preserveCase: true }), "hello-World");
  equal(toDash("HelloWorld", { preserveCase: true }), "Hello-World");
});

test("slices::dasherize screaming with snake_case", () => {
  equal(toDash("hello_world", { screaming: true }), "HELLO-WORLD");
});

test("slices::dasherize preserveCase with mixed case", () => {
  equal(toDash("hello WÖrLD", { preserveCase: true }), "hello-WÖr-LD");
});

// =============================================================================
// dasherize - Unicode Tests
// =============================================================================

test("slices::dasherize with accented characters", () => {
  equal(toDash("café latte"), "café-latte");
  equal(toDash("caféLatte"), "café-latte");
  equal(toDash("naïve approach"), "naïve-approach");
});

test("slices::dasherize with German umlauts", () => {
  equal(toDash("über alles"), "über-alles");
  equal(toDash("größe test"), "größe-test");
  equal(toDash("helloWörld"), "hello-wörld");
});

test("slices::dasherize with accented screaming", () => {
  equal(toDash("café latte", { screaming: true }), "CAFÉ-LATTE");
  equal(toDash("über alles", { screaming: true }), "ÜBER-ALLES");
});

test("slices::dasherize with accented preserveCase", () => {
  equal(toDash("Café Latte", { preserveCase: true }), "Café-Latte");
});

test("slices::dasherize with Greek letters", () => {
  equal(toDash("αβγ test"), "αβγ-test");
  equal(toDash("helloΩmega"), "hello-ωmega");
});

test("slices::dasherize with Cyrillic letters", () => {
  equal(toDash("привет мир"), "привет-мир");
});

// =============================================================================
// dasherize - Edge Cases
// =============================================================================

test("slices::dasherize with empty string", () => {
  equal(toDash(""), "");
});

test("slices::dasherize with single character", () => {
  equal(toDash("a"), "a");
  equal(toDash("A"), "a");
});

test("slices::dasherize with multiple consecutive spaces", () => {
  equal(toDash("hello  world"), "hello-world");
  equal(toDash("one   two"), "one-two");
});

test("slices::dasherize with leading/trailing spaces", () => {
  // Leading spaces are trimmed, trailing spaces become dashes
  equal(toDash(" hello"), "hello");
  equal(toDash("hello "), "hello-");
  equal(toDash(" hello "), "hello-");
});

test("slices::dasherize with multiple consecutive underscores", () => {
  equal(toDash("hello__world"), "hello-world");
});

test("slices::dasherize with all uppercase", () => {
  equal(toDash("HELLOWORLD"), "helloworld");
  equal(toDash("HELLO WORLD"), "hello-world");
});

test("slices::dasherize with acronyms", () => {
  equal(toDash("getHTTPResponse"), "get-httpresponse");
  equal(toDash("parseXMLData"), "parse-xmldata");
});

test("slices::dasherize with consecutive uppercase", () => {
  equal(toDash("getID"), "get-id");
  equal(toDash("XMLParser"), "xmlparser");
});

test("slices::dasherize preserves existing kebab-case", () => {
  equal(toDash("hello-world"), "hello-world");
  equal(toDash("foo-bar-baz"), "foo-bar-baz");
});
