import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { indexOf, indexOfFold } from "./index_of.ts";

// =============================================================================
// indexOf - case-sensitive search
// =============================================================================

test("strings::indexOf finds substring at beginning", () => {
  equal(indexOf("Hello World", "Hello"), 0);
});

test("strings::indexOf finds substring in middle", () => {
  equal(indexOf("Hello World", "World"), 6);
});

test("strings::indexOf returns -1 for case mismatch", () => {
  equal(indexOf("Hello World", "hello"), -1);
  equal(indexOf("Hello World", "WORLD"), -1);
});

test("strings::indexOf finds single character", () => {
  equal(indexOf("Hello", "e"), 1);
  equal(indexOf("Hello", "l"), 2);
});

test("strings::indexOf with start index", () => {
  equal(indexOf("Hello Hello", "Hello", 1), 6);
  equal(indexOf("abcabc", "abc", 3), 3);
});

test("strings::indexOf returns -1 when not found", () => {
  equal(indexOf("Hello World", "xyz"), -1);
});

test("strings::indexOf handles empty string search", () => {
  equal(indexOf("Hello", ""), -1);
});

test("strings::indexOf handles search longer than string", () => {
  equal(indexOf("Hi", "Hello"), -1);
});

// =============================================================================
// indexOfFold - case-insensitive search
// =============================================================================

test("strings::indexOfFold finds with different case", () => {
  equal(indexOfFold("Hello World", "hello"), 0);
  equal(indexOfFold("Hello World", "WORLD"), 6);
});

test("strings::indexOfFold finds with mixed case", () => {
  equal(indexOfFold("Hello World", "hElLo"), 0);
});

test("strings::indexOfFold with start index", () => {
  equal(indexOfFold("Hello Hello", "hello", 1), 6);
});

test("strings::indexOfFold returns -1 when not found", () => {
  equal(indexOfFold("Hello World", "xyz"), -1);
});

test("strings::indexOfFold handles unicode case folding", () => {
  equal(indexOfFold("Hello Wörld", "WÖRLD"), 6);
});
