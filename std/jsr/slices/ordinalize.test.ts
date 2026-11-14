import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { ordinalize } from "./ordinalize.ts";

// Helper to convert result to string
function toOrdinal(s: string): string {
  return String.fromCodePoint(...ordinalize(s));
}

// =============================================================================
// Basic Ordinal Tests (1-10)
// =============================================================================

test("slices::ordinalize with 1st", () => {
  equal("1st", toOrdinal("1"));
});

test("slices::ordinalize with 2nd", () => {
  equal("2nd", toOrdinal("2"));
});

test("slices::ordinalize with 3rd", () => {
  equal("3rd", toOrdinal("3"));
});

test("slices::ordinalize with 4th through 10th", () => {
  equal("4th", toOrdinal("4"));
  equal("5th", toOrdinal("5"));
  equal("6th", toOrdinal("6"));
  equal("7th", toOrdinal("7"));
  equal("8th", toOrdinal("8"));
  equal("9th", toOrdinal("9"));
  equal("10th", toOrdinal("10"));
});

// =============================================================================
// Special Teen Cases (11, 12, 13)
// =============================================================================

test("slices::ordinalize with 11th (special case)", () => {
  equal("11th", toOrdinal("11"));
});

test("slices::ordinalize with 12th (special case)", () => {
  equal("12th", toOrdinal("12"));
});

test("slices::ordinalize with 13th (special case)", () => {
  equal("13th", toOrdinal("13"));
});

test("slices::ordinalize with other teens", () => {
  equal("14th", toOrdinal("14"));
  equal("15th", toOrdinal("15"));
  equal("16th", toOrdinal("16"));
  equal("17th", toOrdinal("17"));
  equal("18th", toOrdinal("18"));
  equal("19th", toOrdinal("19"));
});

// =============================================================================
// Larger Numbers (20+)
// =============================================================================

test("slices::ordinalize with twenties", () => {
  equal("20th", toOrdinal("20"));
  equal("21st", toOrdinal("21"));
  equal("22nd", toOrdinal("22"));
  equal("23rd", toOrdinal("23"));
  equal("24th", toOrdinal("24"));
});

test("slices::ordinalize with thirties", () => {
  equal("30th", toOrdinal("30"));
  equal("31st", toOrdinal("31"));
  equal("32nd", toOrdinal("32"));
  equal("33rd", toOrdinal("33"));
});

test("slices::ordinalize with hundreds", () => {
  equal("100th", toOrdinal("100"));
  equal("101st", toOrdinal("101"));
  equal("102nd", toOrdinal("102"));
  equal("103rd", toOrdinal("103"));
  equal("104th", toOrdinal("104"));
});

test("slices::ordinalize with 111, 112, 113 (special)", () => {
  // These end in 11, 12, 13 so should be "th"
  equal("111th", toOrdinal("111"));
  equal("112th", toOrdinal("112"));
  equal("113th", toOrdinal("113"));
});

test("slices::ordinalize with thousands", () => {
  equal("1000th", toOrdinal("1000"));
  equal("1001st", toOrdinal("1001"));
  equal("1002nd", toOrdinal("1002"));
  equal("1003rd", toOrdinal("1003"));
});

// =============================================================================
// Numbers in Text
// =============================================================================

test("slices::ordinalize with number in sentence", () => {
  equal("On the 1st day", toOrdinal("On the 1 day"));
  equal("The 2nd time", toOrdinal("The 2 time"));
  equal("My 3rd attempt", toOrdinal("My 3 attempt"));
});

test("slices::ordinalize with number at end of string", () => {
  equal("Chapter 1st", toOrdinal("Chapter 1"));
  equal("Item 2nd", toOrdinal("Item 2"));
  equal("Part 3rd", toOrdinal("Part 3"));
  equal("Section 4th", toOrdinal("Section 4"));
});

test("slices::ordinalize with multiple numbers", () => {
  equal("1st and 2nd", toOrdinal("1 and 2"));
  equal("From 1st to 10th", toOrdinal("From 1 to 10"));
});

test("slices::ordinalize with number not followed by space", () => {
  // Numbers followed by non-space characters don't get ordinalized mid-string
  equal("test123abc", toOrdinal("test123abc"));
  // But numbers at end still get ordinalized
  equal("v2.0th", toOrdinal("v2.0"));
  equal("123abc", toOrdinal("123abc"));
});

// =============================================================================
// Text Without Numbers
// =============================================================================

test("slices::ordinalize with text only", () => {
  equal("hello world", toOrdinal("hello world"));
  equal("HelloWorld", toOrdinal("HelloWorld"));
  equal("helloWorld", toOrdinal("helloWorld"));
});

test("slices::ordinalize with special characters", () => {
  equal("hello!", toOrdinal("hello!"));
  equal("test@example", toOrdinal("test@example"));
});

// =============================================================================
// Unicode Tests
// =============================================================================

test("slices::ordinalize with accented characters", () => {
  equal("The 1st café", toOrdinal("The 1 café"));
  equal("Größe 2nd", toOrdinal("Größe 2"));
});

test("slices::ordinalize with Greek text", () => {
  equal("αλφα 1st", toOrdinal("αλφα 1"));
  equal("The 2nd βητα", toOrdinal("The 2 βητα"));
});

test("slices::ordinalize with Cyrillic text", () => {
  equal("привет 1st", toOrdinal("привет 1"));
  equal("The 2nd мир", toOrdinal("The 2 мир"));
});

test("slices::ordinalize with emoji", () => {
  equal("🎉 1st place", toOrdinal("🎉 1 place"));
  equal("The 2nd 🎊", toOrdinal("The 2 🎊"));
});

test("slices::ordinalize with CJK characters", () => {
  equal("第 1st 章", toOrdinal("第 1 章"));
});

// =============================================================================
// Edge Cases
// =============================================================================

test("slices::ordinalize with empty string", () => {
  equal("", toOrdinal(""));
});

test("slices::ordinalize with zero", () => {
  equal("0th", toOrdinal("0"));
});

test("slices::ordinalize with leading zeros", () => {
  equal("01st", toOrdinal("01"));
  equal("02nd", toOrdinal("02"));
  equal("03rd", toOrdinal("03"));
});

test("slices::ordinalize with very large numbers", () => {
  equal("1000000th", toOrdinal("1000000"));
  equal("1000001st", toOrdinal("1000001"));
});

test("slices::ordinalize with number followed by tab", () => {
  equal("1st\tday", toOrdinal("1\tday"));
});

test("slices::ordinalize with number followed by newline", () => {
  equal("1st\nday", toOrdinal("1\nday"));
});

test("slices::ordinalize preserves multiple spaces", () => {
  equal("The  1st  day", toOrdinal("The  1  day"));
});
