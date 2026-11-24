import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { dasherize } from "./dasherize.ts";

// =============================================================================
// Basic conversions
// =============================================================================

test("strings::dasherize converts underscore case", () => {
  equal(dasherize("hello_world"), "hello-world");
});

test("strings::dasherize converts camelCase", () => {
  equal(dasherize("helloWorld"), "hello-world");
});

test("strings::dasherize converts PascalCase", () => {
  equal(dasherize("HelloWorld"), "hello-world");
});

test("strings::dasherize preserves existing dashes", () => {
  equal(dasherize("hello-world"), "hello-world");
});

test("strings::dasherize converts UPPER-CASE", () => {
  equal(dasherize("HELLO-WORLD"), "hello-world");
});

// =============================================================================
// Space handling
// =============================================================================

test("strings::dasherize converts spaces to dashes", () => {
  equal(dasherize("hello world"), "hello-world");
});

test("strings::dasherize handles multiple spaces", () => {
  equal(dasherize("hello  world"), "hello-world");
  equal(dasherize("hello   world"), "hello-world");
});

test("strings::dasherize handles leading/trailing spaces", () => {
  equal(dasherize(" hello world "), "hello-world-");
});

// =============================================================================
// Mixed formats
// =============================================================================

test("strings::dasherize handles mixed separators", () => {
  equal(dasherize("hello_world-test"), "hello-world-test");
});

test("strings::dasherize handles mixed case and separators", () => {
  equal(dasherize("HelloWorld_Test"), "hello-world-test");
});

test("strings::dasherize handles consecutive capitals", () => {
  equal(dasherize("XMLParser"), "xmlparser");
  equal(dasherize("parseXML"), "parse-xml");
});

// =============================================================================
// Edge cases
// =============================================================================

test("strings::dasherize handles empty string", () => {
  equal(dasherize(""), "");
});

test("strings::dasherize handles single word", () => {
  equal(dasherize("hello"), "hello");
  equal(dasherize("Hello"), "hello");
});

test("strings::dasherize handles single character", () => {
  equal(dasherize("a"), "a");
  equal(dasherize("A"), "a");
});

test("strings::dasherize handles numbers", () => {
  equal(dasherize("test123"), "test123");
  equal(dasherize("test123Value"), "test123value");
});

// =============================================================================
// Unicode support
// =============================================================================

test("strings::dasherize handles unicode characters", () => {
  equal(dasherize("helloWörld"), "hello-wörld");
  equal(dasherize("hello_wörld"), "hello-wörld");
});
