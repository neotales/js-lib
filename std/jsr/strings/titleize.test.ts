import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { titleize } from "./titleize.ts";

// =============================================================================
// Basic conversions
// =============================================================================

test("strings::titleize converts underscore case", () => {
  equal(titleize("hello_world"), "Hello World");
});

test("strings::titleize converts camelCase", () => {
  equal(titleize("helloWorld"), "Hello World");
});

test("strings::titleize converts PascalCase", () => {
  equal(titleize("HELLoWorld"), "Hello World");
});

test("strings::titleize converts kebab case", () => {
  equal(titleize("HELLo-World"), "Hello World");
});

test("strings::titleize handles mixed case input", () => {
  equal(titleize("HELLo World"), "Hello World");
});

// =============================================================================
// Complex cases
// =============================================================================

test("strings::titleize handles acronyms", () => {
  equal(titleize("BobTheOG"), "Bob the Og");
});

test("strings::titleize handles multiple words", () => {
  equal(titleize("the_quick_brown_fox"), "the Quick Brown Fox");
});

test("strings::titleize handles consecutive capitals", () => {
  equal(titleize("XMLParser"), "Xmlparser");
});

// =============================================================================
// Edge cases
// =============================================================================

test("strings::titleize handles empty string", () => {
  equal(titleize(""), "");
});

test("strings::titleize handles single word", () => {
  equal(titleize("hello"), "Hello");
});

test("strings::titleize handles single character", () => {
  equal(titleize("a"), "a");
});

test("strings::titleize handles all caps", () => {
  equal(titleize("HELLO"), "Hello");
});

// =============================================================================
// Unicode support
// =============================================================================

test("strings::titleize handles unicode characters", () => {
  equal(titleize("hello_wörld"), "Hello Wörld");
});

test("strings::titleize handles accented characters", () => {
  equal(titleize("café_au_lait"), "Café Au Lait");
});
