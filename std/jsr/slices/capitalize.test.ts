import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { capitalize } from "./capitalize.ts";

/** Helper to convert result to string */
function toCap(input: string, options?: { preserveCase?: boolean }): string {
  return String.fromCodePoint(...capitalize(input, options));
}

// =============================================================================
// capitalize - Basic Tests (default: lowercase rest)
// =============================================================================

test("slices::capitalize with lowercase word", () => {
  equal(toCap("hello"), "Hello");
});

test("slices::capitalize with uppercase word", () => {
  equal(toCap("HELLO"), "Hello");
});

test("slices::capitalize with mixed case", () => {
  equal(toCap("hElLo"), "Hello");
});

test("slices::capitalize with multiple words", () => {
  equal(toCap("hello world"), "Hello world");
  equal(toCap("HELLO WORLD"), "Hello world");
});

test("slices::capitalize with camelCase", () => {
  equal(toCap("helloWorld"), "Helloworld");
  equal(toCap("helloWorldTest"), "Helloworldtest");
});

test("slices::capitalize with PascalCase", () => {
  equal(toCap("HelloWorld"), "Helloworld");
});

test("slices::capitalize with numbers", () => {
  equal(toCap("hello123"), "Hello123");
  equal(toCap("hello123World"), "Hello123world");
  equal(toCap("123hello"), "123hello");
});

test("slices::capitalize already capitalized", () => {
  equal(toCap("Hello"), "Hello");
  equal(toCap("Hello world"), "Hello world");
});

// =============================================================================
// capitalize - preserveCase Option Tests
// =============================================================================

test("slices::capitalize preserveCase with lowercase", () => {
  equal(toCap("hello", { preserveCase: true }), "Hello");
});

test("slices::capitalize preserveCase with uppercase", () => {
  equal(toCap("HELLO", { preserveCase: true }), "HELLO");
});

test("slices::capitalize preserveCase with camelCase", () => {
  equal(toCap("helloWorld", { preserveCase: true }), "HelloWorld");
  equal(toCap("helloWorldTest", { preserveCase: true }), "HelloWorldTest");
});

test("slices::capitalize preserveCase with numbers", () => {
  equal(toCap("hello123World", { preserveCase: true }), "Hello123World");
  equal(toCap("helloWorld123", { preserveCase: true }), "HelloWorld123");
});

test("slices::capitalize preserveCase with multiple words", () => {
  equal(toCap("hello World", { preserveCase: true }), "Hello World");
  equal(toCap("HELLO WORLD", { preserveCase: true }), "HELLO WORLD");
});

// =============================================================================
// capitalize - Unicode Tests
// =============================================================================

test("slices::capitalize with accented characters", () => {
  equal(toCap("école"), "École");
  equal(toCap("ÉCOLE"), "École");
  equal(toCap("café"), "Café");
});

test("slices::capitalize with German umlauts", () => {
  equal(toCap("über"), "Über");
  equal(toCap("ÜBER"), "Über");
  equal(toCap("größe"), "Größe");
});

test("slices::capitalize with Greek letters", () => {
  equal(toCap("αβγ"), "Αβγ");
  equal(toCap("ΑΒΓ"), "Αβγ");
  equal(toCap("ωmega"), "Ωmega");
});

test("slices::capitalize with Cyrillic letters", () => {
  equal(toCap("привет"), "Привет");
  equal(toCap("ПРИВЕТ"), "Привет");
  equal(toCap("мир"), "Мир");
});

test("slices::capitalize preserveCase with accented", () => {
  equal(toCap("éCOLE", { preserveCase: true }), "ÉCOLE");
  equal(toCap("über MENSCH", { preserveCase: true }), "Über MENSCH");
});

test("slices::capitalize with emoji", () => {
  equal(toCap("🎉hello"), "🎉hello");
  equal(toCap("hello🎉"), "Hello🎉");
});

test("slices::capitalize with CJK characters", () => {
  // CJK has no case, first char unchanged if not a letter
  equal(toCap("你好"), "你好");
  equal(toCap("hello你好"), "Hello你好");
});

// =============================================================================
// capitalize - Edge Cases
// =============================================================================

test("slices::capitalize with empty string", () => {
  equal(toCap(""), "");
});

test("slices::capitalize with single character", () => {
  equal(toCap("a"), "A");
  equal(toCap("A"), "A");
  equal(toCap("z"), "Z");
});

test("slices::capitalize with whitespace", () => {
  equal(toCap(" hello"), " hello");
  equal(toCap("  hello"), "  hello");
});

test("slices::capitalize with tabs and newlines", () => {
  equal(toCap("\thello"), "\thello");
  equal(toCap("\nhello"), "\nhello");
});

test("slices::capitalize with special characters", () => {
  equal(toCap(".hello"), ".hello");
  equal(toCap("!hello"), "!hello");
  equal(toCap("123hello"), "123hello");
});

test("slices::capitalize with number first", () => {
  equal(toCap("123"), "123");
  equal(toCap("1st"), "1st");
});
