import { deepStrictEqual as equal, throws } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  trim,
  trimChar,
  trimEnd,
  trimEndChar,
  trimEndSlice,
  trimEndSpace,
  trimSlice,
  trimSpace,
  trimStart,
  trimStartChar,
  trimStartSlice,
  trimStartSpace,
} from "./trim.ts";

// Helper to convert result to string for easier assertions
function str(arr: Uint32Array): string {
  return String.fromCodePoint(...arr);
}

// =============================================================================
// trimEndSpace Tests
// =============================================================================

test("trim::trimEndSpace removes trailing whitespace", () => {
  const input = new Uint32Array([65, 66, 32, 32]); // "AB  "
  const expected = new Uint32Array([65, 66]); // "AB"
  const result = trimEndSpace(input);
  equal(expected, result);
});

test("trim::trimEndSpace removes trailing whitespace using string", () => {
  const expected = new Uint32Array([65, 66]); // "AB"
  const result = trimEndSpace("AB ");
  equal(expected, result);
});

test("trim::trimEndSpace removes tabs and newlines", () => {
  equal("hello", str(trimEndSpace("hello\t\n\r ")));
});

test("trim::trimEndSpace with no trailing whitespace", () => {
  equal("hello", str(trimEndSpace("hello")));
});

test("trim::trimEndSpace with all whitespace", () => {
  equal("", str(trimEndSpace("   ")));
});

test("trim::trimEndSpace preserves leading whitespace", () => {
  equal("  hello", str(trimEndSpace("  hello  ")));
});

// =============================================================================
// trimEnd Tests
// =============================================================================

test("trim::trimEnd removes trailing whitespace", () => {
  const input = new Uint32Array([65, 66, 32, 32]); // "AB  "
  const expected = new Uint32Array([65, 66]); // "AB"
  const result = trimEnd(input);
  equal(expected, result);
});

test("trim::trimEnd removes trailing whitespace using string", () => {
  const input = "AB  ";
  const expected = new Uint32Array([65, 66]); // "AB"
  const result = trimEnd(input);
  equal(expected, result);
});

test("trim::trimEnd with single char suffix", () => {
  equal("hello", str(trimEnd("hello...", ".")));
});

test("trim::trimEnd with multi-char suffix", () => {
  equal("hello", str(trimEnd("hello!?!", "!?")));
});

// =============================================================================
// trimEndChar Tests
// =============================================================================

test("trim::trimEndChar removes trailing character", () => {
  const input = new Uint32Array([65, 66, 46, 46]); // "AB.."
  const result = trimEndChar(input, 46); // 46 is '.'
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimEndChar with no matching chars", () => {
  equal("hello", str(trimEndChar("hello", 46)));
});

test("trim::trimEndChar removes all matching chars", () => {
  equal("", str(trimEndChar("....", 46)));
});

// =============================================================================
// trimEndSlice Tests
// =============================================================================

test("trim::trimEndSlice removes trailing characters using string", () => {
  const input = new Uint32Array([65, 66, 46, 33]); // "AB.!"
  const suffix = new Uint32Array([46, 33]); // ".!"
  const result = trimEndSlice(input, suffix);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimEndSlice removes trailing characters", () => {
  const suffix = new Uint32Array([46, 33]); // ".!"
  const result = trimEndSlice("AB.!", suffix);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimEndSlice with mixed order", () => {
  equal("hello", str(trimEndSlice("hello?!?!", "!?")));
});

// =============================================================================
// trimStartSpace Tests
// =============================================================================

test("trim::trimStartSpace removes leading whitespace", () => {
  const input = new Uint32Array([32, 32, 65, 66]); // "  AB"
  const result = trimStartSpace(input);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimStartSpace removes leading whitespace using string", () => {
  const input = "  AB";
  const result = trimStartSpace(input);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimStartSpace removes tabs and newlines", () => {
  equal("hello", str(trimStartSpace("\t\n\r hello")));
});

test("trim::trimStartSpace with no leading whitespace", () => {
  equal("hello", str(trimStartSpace("hello")));
});

test("trim::trimStartSpace with all whitespace", () => {
  equal("", str(trimStartSpace("   ")));
});

test("trim::trimStartSpace preserves trailing whitespace", () => {
  equal("hello  ", str(trimStartSpace("  hello  ")));
});

// =============================================================================
// trimStart Tests
// =============================================================================

test("trim::trimStart removes leading whitespace", () => {
  const input = new Uint32Array([32, 32, 65, 66]); // "  AB"
  const result = trimStart(input);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimStart removes leading whitespace using string", () => {
  const input = "  AB";
  const result = trimStart(input);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimStart with single char prefix", () => {
  equal("hello", str(trimStart("...hello", ".")));
});

test("trim::trimStart with multi-char prefix", () => {
  equal("hello", str(trimStart("!?!hello", "!?")));
});

// =============================================================================
// trimStartChar Tests
// =============================================================================

test("trim::trimStartChar removes leading character", () => {
  const input = new Uint32Array([46, 46, 65, 66]); // "..AB"
  const result = trimStartChar(input, 46); // 46 is '.'
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimStartChar removes leading character using string", () => {
  const input = "..AB";
  const result = trimStartChar(input, 46); // 46 is '.'
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimStartChar throws on invalid code point", () => {
  const input = new Uint32Array([65, 66]);
  throws(() => trimStartChar(input, -1));
  throws(() => trimStartChar(input, 0x110000));
  throws(() => trimStartChar(input, 1.5));
});

test("trim::trimStartChar with no matching chars", () => {
  equal("hello", str(trimStartChar("hello", 46)));
});

test("trim::trimStartChar removes all matching chars", () => {
  equal("", str(trimStartChar("....", 46)));
});

// =============================================================================
// trimStartSlice Tests
// =============================================================================

test("trim::trimStartSlice removes leading characters", () => {
  const input = new Uint32Array([46, 33, 65, 66]); // ".!AB"
  const prefix = new Uint32Array([46, 33]); // ".!"
  const result = trimStartSlice(input, prefix);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimStartSlice with mixed order", () => {
  equal("hello", str(trimStartSlice("?!?!hello", "!?")));
});

// =============================================================================
// trimSpace Tests
// =============================================================================

test("trim::trimSpace removes leading and trailing whitespace", () => {
  const input = new Uint32Array([32, 32, 65, 66, 32, 32]); // "  AB  "
  const result = trimSpace(input);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimSpace with tabs and newlines", () => {
  equal("hello", str(trimSpace("\t\nhello\r ")));
});

test("trim::trimSpace with no whitespace", () => {
  equal("hello", str(trimSpace("hello")));
});

test("trim::trimSpace with all whitespace", () => {
  equal("", str(trimSpace("   ")));
});

// =============================================================================
// trimChar Tests
// =============================================================================

test("trim::trimChar removes leading and trailing character", () => {
  const input = new Uint32Array([46, 65, 66, 46]); // ".AB."
  const result = trimChar(input, 46); // 46 is '.'
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimChar throws on invalid code point", () => {
  throws(() => trimChar("hello", -1));
  throws(() => trimChar("hello", 0x110000));
});

test("trim::trimChar with no matching chars", () => {
  equal("hello", str(trimChar("hello", 46)));
});

test("trim::trimChar removes all matching chars", () => {
  equal("", str(trimChar("....", 46)));
});

// =============================================================================
// trimSlice Tests
// =============================================================================

test("trim::trimSlice removes leading and trailing characters", () => {
  const input = new Uint32Array([46, 33, 65, 66, 33, 46]); // ".!AB!."
  const chars = new Uint32Array([46, 33]); // ".!"
  const result = trimSlice(input, chars);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trimSlice with mixed order", () => {
  equal("hello", str(trimSlice("?!?!hello!?!?", "!?")));
});

// =============================================================================
// trim Tests
// =============================================================================

test("trim::trim removes whitespace by default", () => {
  const input = new Uint32Array([32, 32, 65, 66, 32, 32]); // "  AB  "
  const result = trim(input);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trim removes specified single character", () => {
  const input = new Uint32Array([46, 65, 66, 46]); // ".AB."
  const chars = new Uint32Array([46]); // "."
  const result = trim(input, chars);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

test("trim::trim removes specified characters", () => {
  const input = new Uint32Array([46, 33, 65, 66, 33, 46]); // ".!AB!."
  const chars = new Uint32Array([46, 33]); // ".!"
  const result = trim(input, chars);
  const expected = new Uint32Array([65, 66]); // "AB"
  equal(expected, result);
});

// =============================================================================
// Unicode Tests
// =============================================================================

test("trim::trimSpace with accented characters", () => {
  equal("héllo wörld", str(trimSpace("  héllo wörld  ")));
});

test("trim::trimSpace with German umlauts", () => {
  equal("Größe Öffnung", str(trimSpace("  Größe Öffnung  ")));
});

test("trim::trim with Greek letters", () => {
  equal("αλφα βητα", str(trim("  αλφα βητα  ")));
});

test("trim::trim with Cyrillic letters", () => {
  equal("привет мир", str(trim("  привет мир  ")));
});

test("trim::trimChar with accented character", () => {
  // Trim é (U+00E9) from both ends
  equal("hello", str(trimChar("éééhelloééé", 0x00e9)));
});

test("trim::trimSlice with accented characters in set", () => {
  equal("hello", str(trimSlice("àéhelloéà", "àé")));
});

// =============================================================================
// Emoji and High Code Point Tests
// =============================================================================

test("trim::trimSpace preserves emoji in middle", () => {
  equal("hello 🎉 world", str(trimSpace("  hello 🎉 world  ")));
});

test("trim::trimChar with emoji code point", () => {
  // Trim 🎉 (U+1F389) from both ends
  const partyEmoji = 0x1f389;
  equal("hello", str(trimChar("🎉🎉hello🎉🎉", partyEmoji)));
});

test("trim::trimSlice with emoji in set", () => {
  // Trim multiple emoji from ends
  equal("hello", str(trimSlice("🎉🎊hello🎊🎉", "🎉🎊")));
});

test("trim::trimStart with flag emoji", () => {
  // Trim 🇺 (U+1F1FA) from start
  const flagU = 0x1f1fa;
  equal("hello", str(trimStartChar("🇺🇺hello", flagU)));
});

test("trim::trim preserves CJK characters", () => {
  equal("你好世界", str(trim("  你好世界  ")));
});

test("trim::trimChar with CJK character", () => {
  // Trim 你 from both ends
  equal("好世界", str(trimChar("你你好世界你你", 0x4f60)));
});

test("trim::trim with musical symbols", () => {
  equal("𝄞 music 𝄢", str(trim("  𝄞 music 𝄢  ")));
});

test("trim::trimChar with high code point", () => {
  // Trim 𝄞 (U+1D11E) from both ends
  const trebleClef = 0x1d11e;
  equal("hello", str(trimChar("𝄞𝄞hello𝄞𝄞", trebleClef)));
});

// =============================================================================
// Edge Cases
// =============================================================================

test("trim::trim with empty string", () => {
  equal("", str(trim("")));
});

test("trim::trimStart with empty string", () => {
  equal("", str(trimStart("")));
});

test("trim::trimEnd with empty string", () => {
  equal("", str(trimEnd("")));
});

test("trim::trim with single character", () => {
  equal("a", str(trim("a")));
  equal("", str(trim(" ")));
});

test("trim::trim with only whitespace variations", () => {
  // Mix of various Unicode spaces
  equal("hello", str(trim(" \t\n\rhello \t\n\r")));
});

test("trim::trimSlice with empty set", () => {
  equal("hello", str(trimSlice("hello", "")));
});

test("trim::trimChar at boundary (max code point)", () => {
  // U+10FFFF is the maximum valid code point
  const maxCodePoint = 0x10ffff;
  const arr = new Uint32Array([maxCodePoint, 65, 66, maxCodePoint]);
  const result = trimChar(arr, maxCodePoint);
  equal("AB", str(result));
});

test("trim::trim preserves interior spaces", () => {
  equal("hello   world", str(trim("  hello   world  ")));
});

test("trim::trimSlice with overlapping chars in input", () => {
  equal("hello", str(trimSlice("ababhelloabab", "ab")));
});
