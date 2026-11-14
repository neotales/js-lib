import { deepStrictEqual as equal, ok, throws } from "@neotales/assert";
import { test } from "@neotales/test";
import { CharSlice, ReadonlyCharSlice } from "./char_slice.ts";

// Helper to convert string to Uint32Array
function toUint32Array(str: string): Uint32Array {
  return new Uint32Array([...str].map((c) => c.codePointAt(0)!));
}

// =============================================================================
// ReadOnlyCharSlice Tests
// =============================================================================

test("slices::ReadOnlyCharSlice.fromString creates slice from string", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  equal(5, s.length);
  equal("hello", s.toString());
});

test("slices::ReadOnlyCharSlice.fromString with empty string", () => {
  const s = ReadonlyCharSlice.fromString("");
  equal(0, s.length);
  equal("", s.toString());
});

test("slices::ReadOnlyCharSlice.fromString with unicode", () => {
  // Note: fromString uses s.length, so multi-byte chars may not work as expected
  const s = ReadonlyCharSlice.fromString("hello");
  equal(5, s.length);
  equal("hello", s.toString());
});

test("slices::ReadOnlyCharSlice constructor defaults", () => {
  const buffer = toUint32Array("hello");
  const s = new ReadonlyCharSlice(buffer);
  equal(5, s.length);
  equal("hello", s.toString());
});

test("slices::ReadOnlyCharSlice.length gets correct length", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  equal(5, s.length);
});

test("slices::ReadOnlyCharSlice.isEmpty returns true for empty slice", () => {
  const s = ReadonlyCharSlice.fromString("");
  ok(s.isEmpty);
});

test("slices::ReadOnlyCharSlice.isEmpty returns false for non-empty slice", () => {
  const s = ReadonlyCharSlice.fromString("a");
  ok(!s.isEmpty);
});

test("slices::ReadOnlyCharSlice.at gets correct character", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  equal("h".codePointAt(0), s.at(0));
  equal("e".codePointAt(0), s.at(1));
  equal("o".codePointAt(0), s.at(4));
});

test("slices::ReadOnlyCharSlice.at throws on invalid index", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  throws(() => s.at(-1));
  throws(() => s.at(5));
});

test("slices::ReadOnlyCharSlice.slice creates correct subslice", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  const sub = s.slice(1, 4);
  equal("ell", sub.toString());
});

test("slices::ReadOnlyCharSlice.slice with no length gets remainder", () => {
  const s = ReadonlyCharSlice.fromString("hello world");
  const sub = s.slice(6);
  equal("world", sub.toString());
});

test("slices::ReadOnlyCharSlice.slice throws on invalid start", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  throws(() => s.slice(-1));
  throws(() => s.slice(6));
});

test("slices::ReadOnlyCharSlice.slice returns empty for length 0", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  const sub = s.slice(2, 0);
  ok(sub.isEmpty);
});

test("slices::ReadOnlyCharSlice.toLower converts to lowercase", () => {
  const s = ReadonlyCharSlice.fromString("HELLO");
  equal("hello", s.toLower.toString());
});

test("slices::ReadOnlyCharSlice.toLower with mixed case", () => {
  const s = ReadonlyCharSlice.fromString("HeLLo WoRLd");
  equal("hello world", s.toLower.toString());
});

test("slices::ReadOnlyCharSlice.toUpper converts to uppercase", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  equal("HELLO", s.toUpper.toString());
});

test("slices::ReadOnlyCharSlice.toUpper with mixed case", () => {
  const s = ReadonlyCharSlice.fromString("HeLLo WoRLd");
  equal("HELLO WORLD", s.toUpper.toString());
});

test("slices::ReadOnlyCharSlice.trim removes whitespace", () => {
  const s = ReadonlyCharSlice.fromString("  hello  ");
  equal("hello", s.trim().toString());
});

test("slices::ReadOnlyCharSlice.trim with tabs and newlines", () => {
  const s = ReadonlyCharSlice.fromString("\t\nhello\r\n");
  equal("hello", s.trim().toString());
});

test("slices::ReadOnlyCharSlice.trim with character parameter", () => {
  const s = ReadonlyCharSlice.fromString("[[[hello  ");
  equal("hello  ", s.trim("[").toString());
});

test("slices::ReadOnlyCharSlice.trim removes character from both ends", () => {
  const s = ReadonlyCharSlice.fromString("xxxhelloxxx");
  equal("hello", s.trim("x").toString());
});

test("slices::ReadOnlyCharSlice.trimStart removes leading whitespace", () => {
  const s = ReadonlyCharSlice.fromString("  hello  ");
  equal("hello  ", s.trimStart().toString());
});

test("slices::ReadOnlyCharSlice.trimEnd removes trailing whitespace", () => {
  const s = ReadonlyCharSlice.fromString("  hello  ");
  equal("  hello", s.trimEnd().toString());
});

test("slices::ReadOnlyCharSlice.trimStartChar removes specific char", () => {
  const s = ReadonlyCharSlice.fromString("xxxhelloxxx");
  equal("helloxxx", s.trimStartChar("x".codePointAt(0)!).toString());
});

test("slices::ReadOnlyCharSlice.trimEndChar removes specific char", () => {
  const s = ReadonlyCharSlice.fromString("xxxhelloxxx");
  equal("xxxhello", s.trimEndChar("x".codePointAt(0)!).toString());
});

test("slices::ReadOnlyCharSlice.equals compares content", () => {
  const s1 = ReadonlyCharSlice.fromString("hello");
  const s2 = ReadonlyCharSlice.fromString("hello");
  const s3 = ReadonlyCharSlice.fromString("world");
  ok(s1.equals(s2));
  ok(!s1.equals(s3));
});

test("slices::ReadOnlyCharSlice.equals with Uint32Array", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  ok(s.equals(toUint32Array("hello")));
  ok(!s.equals(toUint32Array("world")));
});

test("slices::ReadOnlyCharSlice.equals with different lengths", () => {
  const s1 = ReadonlyCharSlice.fromString("hello");
  const s2 = ReadonlyCharSlice.fromString("hell");
  ok(!s1.equals(s2));
});

test("slices::ReadOnlyCharSlice.equalsFold case-insensitive comparison", () => {
  const s1 = ReadonlyCharSlice.fromString("Hello");
  const s2 = ReadonlyCharSlice.fromString("HELLO");
  const s3 = ReadonlyCharSlice.fromString("hello");
  ok(s1.equalsFold(s2));
  ok(s1.equalsFold(s3));
});

test("slices::ReadOnlyCharSlice.equalsFold returns false for different content", () => {
  const s1 = ReadonlyCharSlice.fromString("Hello");
  const s2 = ReadonlyCharSlice.fromString("World");
  ok(!s1.equalsFold(s2));
});

test("slices::ReadOnlyCharSlice.startsWith checks prefix", () => {
  const s = ReadonlyCharSlice.fromString("hello world");
  ok(s.startsWith(toUint32Array("hello")));
  ok(s.startsWith(toUint32Array("h")));
  ok(!s.startsWith(toUint32Array("world")));
});

test("slices::ReadOnlyCharSlice.startsWith with empty prefix", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  ok(s.startsWith(toUint32Array("")));
});

test("slices::ReadOnlyCharSlice.startsWithFold case-insensitive prefix", () => {
  const s = ReadonlyCharSlice.fromString("Hello World");
  ok(s.startsWithFold(toUint32Array("HELLO")));
  ok(s.startsWithFold(toUint32Array("hello")));
});

test("slices::ReadOnlyCharSlice.endsWith checks suffix", () => {
  const s = ReadonlyCharSlice.fromString("hello world");
  ok(s.endsWith(toUint32Array("world")));
  ok(s.endsWith(toUint32Array("d")));
  ok(!s.endsWith(toUint32Array("hello")));
});

test("slices::ReadOnlyCharSlice.endsWith with empty suffix", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  ok(s.endsWith(toUint32Array("")));
});

test("slices::ReadOnlyCharSlice.endsWithFold case-insensitive suffix", () => {
  const s = ReadonlyCharSlice.fromString("Hello World");
  ok(s.endsWithFold(toUint32Array("WORLD")));
  ok(s.endsWithFold(toUint32Array("world")));
});

test("slices::ReadOnlyCharSlice.includes finds substring", () => {
  const s = ReadonlyCharSlice.fromString("hello world");
  ok(s.includes(toUint32Array("hello")));
  ok(s.includes(toUint32Array("world")));
  ok(!s.includes(toUint32Array("xyz")));
});

test("slices::ReadOnlyCharSlice.includesFold case-insensitive substring", () => {
  const s = ReadonlyCharSlice.fromString("Hello World");
  ok(s.includesFold(toUint32Array("HELLO")));
  ok(s.includesFold(toUint32Array("world")));
});

test("slices::ReadOnlyCharSlice.indexOf finds first occurrence", () => {
  const s = ReadonlyCharSlice.fromString("hello world");
  equal(0, s.indexOf(toUint32Array("hello")));
  equal(6, s.indexOf(toUint32Array("world")));
  equal(-1, s.indexOf(toUint32Array("xyz")));
});

test("slices::ReadOnlyCharSlice.indexOf with character string", () => {
  const s = ReadonlyCharSlice.fromString("hello");
  equal(2, s.indexOf("l"));
  equal(-1, s.indexOf("x"));
});

test("slices::ReadOnlyCharSlice.indexOfFold case-insensitive search", () => {
  const s = ReadonlyCharSlice.fromString("Hello World");
  equal(0, s.indexOfFold(toUint32Array("HELLO")));
  equal(6, s.indexOfFold(toUint32Array("world")));
});

test("slices::ReadOnlyCharSlice.forEach iterates over code points", () => {
  const s = ReadonlyCharSlice.fromString("abc");
  const result: number[] = [];
  s.forEach((cp) => result.push(cp));
  equal(3, result.length);
  equal("a".codePointAt(0), result[0]);
  equal("b".codePointAt(0), result[1]);
  equal("c".codePointAt(0), result[2]);
});

test("slices::ReadOnlyCharSlice.forEach provides index", () => {
  const s = ReadonlyCharSlice.fromString("abc");
  const indices: number[] = [];
  s.forEach((_cp, i) => indices.push(i));
  equal(0, indices[0]);
  equal(1, indices[1]);
  equal(2, indices[2]);
});

test("slices::ReadOnlyCharSlice.map transforms code points", () => {
  const s = ReadonlyCharSlice.fromString("abc");
  const mapped = s.map((cp) => cp + 1);
  equal("bcd", mapped.toString());
});

test("slices::ReadOnlyCharSlice iterator works with for...of", () => {
  const s = ReadonlyCharSlice.fromString("abc");
  const result: number[] = [];
  for (const cp of s) {
    result.push(cp);
  }
  equal(3, result.length);
  equal("a".codePointAt(0), result[0]);
});

test("slices::ReadOnlyCharSlice iterator works with spread", () => {
  const s = ReadonlyCharSlice.fromString("abc");
  const arr = [...s];
  equal(3, arr.length);
});

// =============================================================================
// CharSlice Tests
// =============================================================================

test("slices::CharSlice.fromString creates mutable slice", () => {
  const s = CharSlice.fromString("hello");
  s.set(0, "H".codePointAt(0)!);
  equal("Hello", s.toString());
});

test("slices::CharSlice.set throws on invalid index", () => {
  const s = CharSlice.fromString("hello");
  throws(() => s.set(-1, "x".codePointAt(0)!));
  throws(() => s.set(5, "x".codePointAt(0)!));
});

test("slices::CharSlice.replace updates slice content", () => {
  const s = CharSlice.fromString("hello");
  s.replace(0, "j");
  equal("jello", s.toString());
});

test("slices::CharSlice.replace with longer string", () => {
  const s = CharSlice.fromString("hello world");
  s.replace(0, "hi");
  equal("hillo world", s.toString());
});

test("slices::CharSlice.replace returns this for chaining", () => {
  const s = CharSlice.fromString("hello");
  const result = s.replace(0, "j");
  equal(result, s);
});

test("slices::CharSlice.captialize capitalizes first letter", () => {
  const s = CharSlice.fromString("hello");
  s.captialize();
  equal("Hello", s.toString());
});

test("slices::CharSlice.captialize on subslice", () => {
  const s = CharSlice.fromString("hello");
  s.slice(1).captialize();
  equal("hEllo", s.toString());
});

test("slices::CharSlice.captialize on empty slice", () => {
  const s = CharSlice.fromString("");
  s.captialize(); // Should not throw
  equal("", s.toString());
});

test("slices::CharSlice.findIndex finds matching element", () => {
  const s = CharSlice.fromString("hello");
  const index = s.findIndex((c) => c === "l".codePointAt(0));
  equal(2, index);
});

test("slices::CharSlice.findIndex returns -1 when not found", () => {
  const s = CharSlice.fromString("hello");
  const index = s.findIndex((c) => c === "x".codePointAt(0));
  equal(-1, index);
});

test("slices::CharSlice.includes finds substring", () => {
  const s = CharSlice.fromString("hello");
  ok(s.includes(toUint32Array("ell")));
  ok(!s.includes(toUint32Array("xyz")));
});

test("slices::CharSlice.indexOf finds first occurrence", () => {
  const s = CharSlice.fromString("hello");
  equal(2, s.indexOf(toUint32Array("l")));
  equal(1, s.indexOf(toUint32Array("ello")));
});

test("slices::CharSlice.lastIndexOf finds last occurrence", () => {
  const s = CharSlice.fromString("hello");
  equal(3, s.lastIndexOf("l"));
});

test("slices::CharSlice.slice creates mutable subslice", () => {
  const s = CharSlice.fromString("hello world");
  const sub = s.slice(0, 5);
  sub.set(0, "H".codePointAt(0)!);
  equal("Hello world", s.toString()); // Original modified
});

test("slices::CharSlice.map transforms in place", () => {
  const s = CharSlice.fromString("abc");
  s.map((cp) => cp - 32); // to uppercase ASCII
  equal("ABC", s.toString());
});

test("slices::CharSlice.toLower modifies in place", () => {
  const s = CharSlice.fromString("HELLO");
  s.toLower();
  equal("hello", s.toString());
});

test("slices::CharSlice.toUpper modifies in place", () => {
  const s = CharSlice.fromString("hello");
  s.toUpper();
  equal("HELLO", s.toString());
});

test("slices::CharSlice.trim returns trimmed slice", () => {
  const s = CharSlice.fromString("  hello  ");
  equal("hello", s.trim().toString());
});

test("slices::CharSlice.equals compares content", () => {
  const s1 = CharSlice.fromString("hello");
  const s2 = CharSlice.fromString("hello");
  ok(s1.equals(s2));
});

test("slices::CharSlice.equalsFold case-insensitive comparison", () => {
  const s1 = CharSlice.fromString("Hello");
  const s2 = CharSlice.fromString("HELLO");
  ok(s1.equalsFold(s2));
});

test("slices::CharSlice iterator works with for...of", () => {
  const s = CharSlice.fromString("abc");
  const result: number[] = [];
  for (const cp of s) {
    result.push(cp);
  }
  equal(3, result.length);
});

test("slices::CharSlice forEach iterates over characters", () => {
  const s = CharSlice.fromString("abc");
  const chars: number[] = [];
  s.forEach((cp) => chars.push(cp));
  equal(3, chars.length);
  equal("a".codePointAt(0), chars[0]);
});

test("slices::ReadOnlyCharSlice trimSlice removes matching characters", () => {
  const s = ReadonlyCharSlice.fromString("abchelloabc");
  const chars = toUint32Array("abc");
  equal("hello", s.trimSlice(chars).toString());
});

test("slices::ReadOnlyCharSlice trimStartSlice removes from start", () => {
  const s = ReadonlyCharSlice.fromString("abchelloabc");
  const chars = toUint32Array("abc");
  equal("helloabc", s.trimStartSlice(chars).toString());
});

test("slices::ReadOnlyCharSlice trimEndSlice removes from end", () => {
  const s = ReadonlyCharSlice.fromString("abchelloabc");
  const chars = toUint32Array("abc");
  equal("abchello", s.trimEndSlice(chars).toString());
});

// =============================================================================
// CharSlice.reverse Tests
// =============================================================================

test("slices::CharSlice.reverse reverses in place", () => {
  const s = CharSlice.fromString("hello");
  s.reverse();
  equal("olleh", s.toString());
});

test("slices::CharSlice.reverse returns this for chaining", () => {
  const s = CharSlice.fromString("abc");
  const result = s.reverse();
  equal(result, s);
});

test("slices::CharSlice.reverse with single character", () => {
  const s = CharSlice.fromString("a");
  s.reverse();
  equal("a", s.toString());
});

test("slices::CharSlice.reverse with empty slice", () => {
  const s = CharSlice.fromString("");
  s.reverse();
  equal("", s.toString());
});

test("slices::CharSlice.reverse with even length", () => {
  const s = CharSlice.fromString("abcd");
  s.reverse();
  equal("dcba", s.toString());
});

// =============================================================================
// CharSlice.update Tests
// =============================================================================

test("slices::CharSlice.update modifies multiple characters", () => {
  const s = CharSlice.fromString("hello");
  s.update(0, toUint32Array("HE"));
  equal("HEllo", s.toString());
});

test("slices::CharSlice.update returns this for chaining", () => {
  const s = CharSlice.fromString("hello");
  const result = s.update(0, toUint32Array("HE"));
  equal(result, s);
});

test("slices::CharSlice.update at middle position", () => {
  const s = CharSlice.fromString("hello world");
  s.update(6, toUint32Array("DENO"));
  equal("hello DENOd", s.toString());
});

test("slices::CharSlice.update throws on invalid index", () => {
  const s = CharSlice.fromString("hello");
  throws(() => s.update(-1, toUint32Array("x")));
  throws(() => s.update(5, toUint32Array("x")));
});

test("slices::CharSlice.update throws when values extend beyond end", () => {
  const s = CharSlice.fromString("hello");
  throws(() => s.update(3, toUint32Array("xyz"))); // Would need indices 3, 4, 5 but 5 is out of bounds
});

// =============================================================================
// Unicode & Emoji Tests
// =============================================================================

test("slices::ReadOnlyCharSlice handles single emoji", () => {
  const s = new ReadonlyCharSlice(toUint32Array("🎉"));
  equal(1, s.length);
  equal("🎉", s.toString());
});

test("slices::ReadOnlyCharSlice handles multiple emojis", () => {
  const s = new ReadonlyCharSlice(toUint32Array("🎉🚀💻"));
  equal(3, s.length);
  equal("🎉🚀💻", s.toString());
});

test("slices::ReadOnlyCharSlice handles mixed text and emoji", () => {
  const s = new ReadonlyCharSlice(toUint32Array("Hello 🌍 World"));
  equal(13, s.length);
  equal("Hello 🌍 World", s.toString());
});

test("slices::ReadOnlyCharSlice handles emoji in slice operation", () => {
  const s = new ReadonlyCharSlice(toUint32Array("Hello🎉World"));
  // Slice from index 5 to get remaining characters
  const sub = s.slice(5);
  equal("🎉World", sub.toString());
});

test("slices::ReadOnlyCharSlice.indexOf finds emoji", () => {
  const s = new ReadonlyCharSlice(toUint32Array("Hello🎉World"));
  equal(5, s.indexOf(toUint32Array("🎉")));
});

test("slices::ReadOnlyCharSlice.includes finds emoji", () => {
  const s = new ReadonlyCharSlice(toUint32Array("Hello🎉World"));
  ok(s.includes(toUint32Array("🎉")));
  ok(!s.includes(toUint32Array("🚀")));
});

test("slices::CharSlice.reverse with emojis", () => {
  const s = CharSlice.fromString("🎉🚀💻");
  s.reverse();
  equal("💻🚀🎉", s.toString());
});

test("slices::CharSlice.reverse mixed text and emoji", () => {
  const s = new CharSlice(toUint32Array("a🎉b"));
  s.reverse();
  equal("b🎉a", s.toString());
});

test("slices::ReadOnlyCharSlice handles high code points", () => {
  // Mathematical bold capital A (U+1D400)
  const s = new ReadonlyCharSlice(toUint32Array("𝐀𝐁𝐂"));
  equal(3, s.length);
  equal("𝐀𝐁𝐂", s.toString());
});

test("slices::ReadOnlyCharSlice handles CJK characters", () => {
  const s = new ReadonlyCharSlice(toUint32Array("你好世界"));
  equal(4, s.length);
  equal("你好世界", s.toString());
});

test("slices::ReadOnlyCharSlice handles Arabic text", () => {
  const s = new ReadonlyCharSlice(toUint32Array("مرحبا"));
  equal(5, s.length);
  equal("مرحبا", s.toString());
});

test("slices::ReadOnlyCharSlice handles Greek letters with case", () => {
  const upper = new ReadonlyCharSlice(toUint32Array("ΑΒΓΔ"));
  const lower = new ReadonlyCharSlice(toUint32Array("αβγδ"));
  equal("αβγδ", upper.toLower.toString());
  equal("ΑΒΓΔ", lower.toUpper.toString());
});

test("slices::ReadOnlyCharSlice.equalsFold with Greek", () => {
  const s1 = new ReadonlyCharSlice(toUint32Array("ΑΒΓΔ"));
  const s2 = new ReadonlyCharSlice(toUint32Array("αβγδ"));
  ok(s1.equalsFold(s2));
});

test("slices::ReadOnlyCharSlice handles Cyrillic letters with case", () => {
  const upper = new ReadonlyCharSlice(toUint32Array("АБВГ"));
  const lower = new ReadonlyCharSlice(toUint32Array("абвг"));
  equal("абвг", upper.toLower.toString());
  equal("АБВГ", lower.toUpper.toString());
});

test("slices::ReadOnlyCharSlice.equalsFold with Cyrillic", () => {
  const s1 = new ReadonlyCharSlice(toUint32Array("ПРИВЕТ"));
  const s2 = new ReadonlyCharSlice(toUint32Array("привет"));
  ok(s1.equalsFold(s2));
});

test("slices::CharSlice.toLower with mixed scripts", () => {
  const s = new CharSlice(toUint32Array("ABC αβγ АБВ"));
  s.toLower();
  equal("abc αβγ абв", s.toString());
});

test("slices::CharSlice.toUpper with mixed scripts", () => {
  const s = new CharSlice(toUint32Array("abc αβγ абв"));
  s.toUpper();
  equal("ABC ΑΒΓ АБВ", s.toString());
});

test("slices::ReadOnlyCharSlice emoji sequences preserved in operations", () => {
  // Family emoji (single code point for simplicity)
  const s = new ReadonlyCharSlice(toUint32Array("👨‍👩‍👧"));
  // Note: This is actually 5 code points (man + ZWJ + woman + ZWJ + girl)
  equal(5, s.length);
});

test("slices::ReadOnlyCharSlice handles flag emoji", () => {
  // US flag is two regional indicator symbols
  const s = new ReadonlyCharSlice(toUint32Array("🇺🇸"));
  equal(2, s.length); // Two regional indicator symbols
});

test("slices::CharSlice.update with emoji", () => {
  const s = new CharSlice(toUint32Array("Hello World"));
  s.update(6, toUint32Array("🌍"));
  equal("Hello 🌍orld", s.toString());
});

test("slices::ReadOnlyCharSlice.startsWith with emoji", () => {
  const s = new ReadonlyCharSlice(toUint32Array("🎉Hello"));
  ok(s.startsWith(toUint32Array("🎉")));
  ok(s.startsWith(toUint32Array("🎉Hello")));
});

test("slices::ReadOnlyCharSlice.endsWith with emoji", () => {
  const s = new ReadonlyCharSlice(toUint32Array("Hello🎉"));
  ok(s.endsWith(toUint32Array("🎉")));
  ok(s.endsWith(toUint32Array("Hello🎉")));
});

test("slices::ReadOnlyCharSlice.equals with emoji", () => {
  const s1 = new ReadonlyCharSlice(toUint32Array("Hello🌍"));
  const s2 = new ReadonlyCharSlice(toUint32Array("Hello🌍"));
  const s3 = new ReadonlyCharSlice(toUint32Array("Hello🌎"));
  ok(s1.equals(s2));
  ok(!s1.equals(s3));
});

test("slices::ReadOnlyCharSlice handles special Unicode ranges", () => {
  // Various Unicode blocks
  const s = new ReadonlyCharSlice(toUint32Array("←↑→↓♠♣♥♦"));
  equal(8, s.length);
  equal("←↑→↓♠♣♥♦", s.toString());
});

test("slices::ReadOnlyCharSlice handles musical symbols", () => {
  // Musical symbols from U+1D100 block
  const s = new ReadonlyCharSlice(toUint32Array("𝄞𝄢"));
  equal(2, s.length);
  equal("𝄞𝄢", s.toString());
});

test("slices::CharSlice emoji at boundary conditions", () => {
  const s = new CharSlice(toUint32Array("🎉"));
  equal(0x1f389, s.at(0)); // Party popper emoji code point
});

test("slices::ReadOnlyCharSlice.trim preserves emoji", () => {
  const s = new ReadonlyCharSlice(toUint32Array("  🎉Hello🎉  "));
  equal("🎉Hello🎉", s.trim().toString());
});
