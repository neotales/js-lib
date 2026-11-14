import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { NoCapitalizeWords, titleize } from "./titleize.ts";
import { toCharArray } from "./utils.ts";

// Helper to convert titleize result to string
function toTitle(s: string): string {
  return String.fromCodePoint(...titleize(s));
}

// Helper to check if a word is in NoCapitalizeWords
function hasWord(word: string): boolean {
  return NoCapitalizeWords.indexOf(toCharArray(word)) !== -1;
}

// =============================================================================
// NoCapitalizeWords Tests
// =============================================================================

test("slices::NoCapitalizeWords contains common articles", () => {
  ok(hasWord("a"));
  ok(hasWord("an"));
  ok(hasWord("the"));
});

test("slices::NoCapitalizeWords contains conjunctions", () => {
  ok(hasWord("and"));
  ok(hasWord("or"));
  ok(hasWord("but"));
  ok(hasWord("nor"));
  ok(hasWord("so"));
});

test("slices::NoCapitalizeWords contains prepositions", () => {
  ok(hasWord("to"));
  ok(hasWord("of"));
  ok(hasWord("at"));
  ok(hasWord("by"));
  ok(hasWord("from"));
  ok(hasWord("into"));
  ok(hasWord("on"));
  ok(hasWord("in"));
  ok(hasWord("with"));
  ok(hasWord("for"));
});

// =============================================================================
// Basic Titleize Tests
// =============================================================================

test("slices::titleize with simple words", () => {
  equal("Hello", toTitle("hello"));
  equal("Hello World", toTitle("hello world"));
  equal("Hello World Today", toTitle("hello world today"));
});

test("slices::titleize with camelCase", () => {
  equal("Hello World", toTitle("helloWorld"));
  equal("Hello World Today", toTitle("helloWorldToday"));
  equal("Get User Name", toTitle("getUserName"));
});

test("slices::titleize with PascalCase", () => {
  equal("Hello World", toTitle("HelloWorld"));
  equal("Hello World Today", toTitle("HelloWorldToday"));
  equal("Get User Name", toTitle("GetUserName"));
});

test("slices::titleize with snake_case", () => {
  equal("Hello World", toTitle("hello_world"));
  equal("Hello World Today", toTitle("hello_world_today"));
  equal("Get User Name", toTitle("get_user_name"));
});

test("slices::titleize preserves non-capitalize words", () => {
  equal("Bob the King", toTitle("BobTheKing"));
  equal("Bob the King", toTitle("bob_the_king"));
  equal("King of the Hill", toTitle("kingOfTheHill"));
  equal("Lord of the Rings", toTitle("lord_of_the_rings"));
  equal("War and Peace", toTitle("warAndPeace"));
});

test("slices::titleize handles multiple underscores", () => {
  equal("Hello World", toTitle("hello__world"));
  equal("Hello World", toTitle("hello___world"));
});

test("slices::titleize handles leading/trailing underscores", () => {
  equal("Hello World", toTitle("_hello_world"));
  equal("Hello World", toTitle("hello_world_"));
  equal("Hello World", toTitle("_hello_world_"));
});

// =============================================================================
// Unicode Tests
// =============================================================================

test("slices::titleize with accented characters", () => {
  equal("Hello Wörld", toTitle("hello wörld"));
  equal("Hello Wörld", toTitle("helloWörld"));
  equal("Élève École", toTitle("élève école"));
  equal("Café Latté", toTitle("café latté"));
});

test("slices::titleize with German umlauts", () => {
  equal("Über Änderung", toTitle("über änderung"));
  equal("Größe Öffnung", toTitle("größe öffnung"));
});

test("slices::titleize with mixed case accents", () => {
  // Note: The function converts to lowercase then capitalizes first letter
  equal("Hello Wör Ld", toTitle("hello WÖrLD"));
});

test("slices::titleize with Greek letters", () => {
  equal("Αλφα Βητα", toTitle("αλφα βητα"));
  equal("Αλφα Βητα", toTitle("ΑΛΦΑ ΒΗΤΑ"));
});

test("slices::titleize with Cyrillic letters", () => {
  equal("Привет Мир", toTitle("привет мир"));
  equal("Привет Мир", toTitle("ПРИВЕТ МИР"));
});

// =============================================================================
// Emoji and High Code Point Tests
// =============================================================================

test("slices::titleize preserves emoji", () => {
  // Emoji are not letters, so they get filtered out but don't break tokenization
  equal("Hello World", toTitle("hello 🎉 world"));
  equal("Party Time", toTitle("party 🎉 time"));
});

test("slices::titleize with emoji between words", () => {
  // Emoji are not letter/digit/underscore/space, so they are ignored
  // but don't split the word - "hello🎉world" is treated as one word
  equal("Helloworld", toTitle("hello🎉world"));
});

test("slices::titleize handles CJK characters", () => {
  // CJK characters are not considered letters by isLetter(), so they are stripped
  equal("", toTitle("你好 世界"));
});

test("slices::titleize handles mixed Latin and CJK", () => {
  // CJK characters are stripped, only Latin remains
  equal("Hello", toTitle("hello 你好"));
});

// =============================================================================
// Edge Cases
// =============================================================================

test("slices::titleize with empty string", () => {
  equal("", toTitle(""));
});

test("slices::titleize with single character", () => {
  // "a" is in NoCapitalizeWords so it stays lowercase
  equal("a", toTitle("a"));
  // "z" is not in NoCapitalizeWords so it gets capitalized
  equal("Z", toTitle("z"));
});

test("slices::titleize with single word", () => {
  equal("Hello", toTitle("hello"));
  equal("World", toTitle("WORLD"));
});

test("slices::titleize with all uppercase", () => {
  equal("Hello World", toTitle("HELLO WORLD"));
  // All uppercase without spaces is treated as single word (no lowercase-to-uppercase transition)
  equal("Helloworld", toTitle("HELLOWORLD"));
});

test("slices::titleize with numbers", () => {
  equal("Hello123world", toTitle("hello123world"));
  equal("Test 123 Value", toTitle("test_123_value"));
});

test("slices::titleize with mixed separators", () => {
  equal("Hello World Today", toTitle("hello_world today"));
  equal("Hello World Today", toTitle("hello world_today"));
});
