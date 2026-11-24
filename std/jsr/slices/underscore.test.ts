import { deepStrictEqual as equal, throws } from "@neotales/assert";
import { test } from "@neotales/test";
import { underscore } from "./underscore.ts";

// Helper to convert result to string
function toSnake(s: string, options?: { screaming?: boolean; preserveCase?: boolean }): string {
  return String.fromCodePoint(...underscore(s, options));
}

// =============================================================================
// Error Handling Tests
// =============================================================================

test("slices::underscore throws when preserveCase and screaming are both true", () => {
  throws(() => {
    underscore("hello world", { preserveCase: true, screaming: true });
  });
});

// =============================================================================
// Basic Conversion Tests
// =============================================================================

test("slices::underscore with space-separated words", () => {
  equal("hello_world", toSnake("hello world"));
  equal("hello_world_today", toSnake("hello world today"));
  equal("get_user_name", toSnake("get user name"));
});

test("slices::underscore with camelCase", () => {
  equal("hello_world", toSnake("helloWorld"));
  equal("hello_world_today", toSnake("helloWorldToday"));
  equal("get_user_name", toSnake("getUserName"));
});

test("slices::underscore with PascalCase", () => {
  equal("hello_world", toSnake("HelloWorld"));
  equal("hello_world_today", toSnake("HelloWorldToday"));
  equal("get_user_name", toSnake("GetUserName"));
});

test("slices::underscore with hyphen-separated words", () => {
  equal("hello_world", toSnake("hello-world"));
  equal("hello_world_today", toSnake("hello-world-today"));
  equal("get_user_name", toSnake("get-user-name"));
});

test("slices::underscore with existing underscores", () => {
  equal("hello_world", toSnake("hello_world"));
  equal("hello_world_today", toSnake("hello_world_today"));
});

test("slices::underscore with mixed separators", () => {
  equal("hello_world_today", toSnake("hello world-today"));
  equal("hello_world_today", toSnake("hello-world today"));
  equal("hello_world_today", toSnake("hello_world today"));
});

// =============================================================================
// Options Tests
// =============================================================================

test("slices::underscore with screaming option", () => {
  equal("HELLO_WORLD", toSnake("hello world", { screaming: true }));
  equal("HELLO_WORLD", toSnake("helloWorld", { screaming: true }));
  equal("HELLO_WORLD", toSnake("HelloWorld", { screaming: true }));
  equal("HELLO_WORLD", toSnake("hello-world", { screaming: true }));
});

test("slices::underscore with preserveCase option", () => {
  equal("hello_world", toSnake("hello world", { preserveCase: true }));
  equal("hello_World", toSnake("helloWorld", { preserveCase: true }));
  equal("Hello_World", toSnake("HelloWorld", { preserveCase: true }));
  equal("hello_world", toSnake("hello-world", { preserveCase: true }));
});

test("slices::underscore with no options defaults to lowercase", () => {
  equal("hello_world", toSnake("HELLO WORLD"));
  equal("hello_world", toSnake("HELLO-WORLD"));
});

// =============================================================================
// Unicode Tests
// =============================================================================

test("slices::underscore with accented characters", () => {
  equal("hello_wörld", toSnake("hello wörld"));
  equal("hello_wörld", toSnake("helloWörld"));
  equal("café_latté", toSnake("café latté"));
});

test("slices::underscore with German umlauts", () => {
  equal("größe_öffnung", toSnake("größe öffnung"));
  equal("größe_öffnung", toSnake("größeÖffnung"));
});

test("slices::underscore with accented screaming", () => {
  equal("HELLO_WÖRLD", toSnake("hello wörld", { screaming: true }));
  equal("HELLO_WÖRLD", toSnake("helloWörld", { screaming: true }));
});

test("slices::underscore with accented preserveCase", () => {
  equal("hello_wörld", toSnake("hello wörld", { preserveCase: true }));
  equal("hello_Wörld", toSnake("helloWörld", { preserveCase: true }));
});

test("slices::underscore with mixed case accents", () => {
  equal("hello_wör_ld", toSnake("hello WÖrLD"));
  equal("hello_WÖr_LD", toSnake("hello WÖrLD", { preserveCase: true }));
});

test("slices::underscore with Greek letters", () => {
  equal("αλφα_βητα", toSnake("αλφα βητα"));
  equal("αλφα_βητα", toSnake("ΑΛΦΑ ΒΗΤΑ"));
  equal("ΑΛΦΑ_ΒΗΤΑ", toSnake("αλφα βητα", { screaming: true }));
});

test("slices::underscore with Cyrillic letters", () => {
  equal("привет_мир", toSnake("привет мир"));
  equal("привет_мир", toSnake("ПРИВЕТ МИР"));
  equal("ПРИВЕТ_МИР", toSnake("привет мир", { screaming: true }));
});

// =============================================================================
// Emoji and High Code Point Tests
// =============================================================================

test("slices::underscore strips emoji", () => {
  // Emoji are not letters or digits, so they're stripped
  equal("hello_world", toSnake("hello 🎉 world"));
  equal("helloworld", toSnake("hello🎉world"));
});

test("slices::underscore strips special characters", () => {
  // Special characters are stripped, spaces create separators
  equal("hello_world", toSnake("hello! world?"));
  // No separator without space
  equal("helloworld", toSnake("hello@world"));
});

test("slices::underscore keeps CJK characters", () => {
  // CJK characters are category Lo, so isLetter() keeps them.
  // The space before them creates an underscore.
  equal("hello_你好", toSnake("hello 你好"));
  // No separator without space.
  equal("hello你好", toSnake("hello你好"));
});

// =============================================================================
// Digit Tests
// =============================================================================

test("slices::underscore preserves digits", () => {
  equal("hello123world", toSnake("hello123world"));
  equal("hello_123_world", toSnake("hello 123 world"));
  // Digits don't trigger word boundaries on their own
  equal("get_user_by_id42", toSnake("getUserById42"));
});

test("slices::underscore with version numbers", () => {
  // Period is stripped, no separator created
  equal("version_20", toSnake("version 2.0"));
  // 2 is a digit, so no transition detected to uppercase R
  equal("v2release", toSnake("v2Release"));
});

// =============================================================================
// Edge Cases
// =============================================================================

test("slices::underscore with empty string", () => {
  equal("", toSnake(""));
});

test("slices::underscore with single character", () => {
  equal("a", toSnake("a"));
  equal("a", toSnake("A"));
  equal("A", toSnake("a", { screaming: true }));
  equal("A", toSnake("A", { preserveCase: true }));
});

test("slices::underscore with single word", () => {
  equal("hello", toSnake("hello"));
  equal("hello", toSnake("HELLO"));
  equal("HELLO", toSnake("hello", { screaming: true }));
});

test("slices::underscore with multiple consecutive separators", () => {
  equal("hello_world", toSnake("hello  world"));
  equal("hello_world", toSnake("hello--world"));
  equal("hello_world", toSnake("hello__world"));
  equal("hello_world", toSnake("hello - world"));
});

test("slices::underscore with leading/trailing separators", () => {
  // Leading separators are stripped
  equal("hello_world", toSnake(" hello world"));
  // Trailing separators are kept if followed by stripped chars
  equal("hello_world_", toSnake("hello world "));
  equal("hello_world_", toSnake(" hello world "));
  // Leading separators stripped, trailing kept
  equal("hello_world_", toSnake("-hello-world-"));
  equal("hello_world_", toSnake("_hello_world_"));
});

test("slices::underscore with all uppercase input", () => {
  equal("helloworld", toSnake("HELLOWORLD"));
  equal("hello_world", toSnake("HELLO WORLD"));
  equal("HELLOWORLD", toSnake("HELLOWORLD", { screaming: true }));
  equal("HELLOWORLD", toSnake("HELLOWORLD", { preserveCase: true }));
});

test("slices::underscore with acronyms", () => {
  // Consecutive uppercase letters don't create boundaries between them
  // Only lowercase-to-uppercase transitions create boundaries
  equal("htmlparser", toSnake("HTMLParser"));
  // get -> H transition creates underscore, then all caps run through
  equal("get_htmlcontent", toSnake("getHTMLContent"));
  // parse -> X transition creates underscore
  equal("parse_xmldata", toSnake("parseXMLData"));
});

test("slices::underscore consecutive uppercase", () => {
  // When there are consecutive uppercase letters, no underscore is added between them
  equal("abcd", toSnake("ABCD"));
  equal("ab_cd", toSnake("AB CD"));
});
