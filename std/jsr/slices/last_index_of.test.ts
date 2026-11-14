import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { lastIndexOf, lastIndexOfFold } from "./last_index_of.ts";

// =============================================================================
// lastIndexOf - Case-Sensitive Tests
// =============================================================================

test("slices::lastIndexOf finds last occurrence", () => {
  equal(lastIndexOf("foo bar foo", "foo"), 8);
});

test("slices::lastIndexOf finds first when only one match", () => {
  equal(lastIndexOf("hello world", "world"), 6);
});

test("slices::lastIndexOf returns -1 when not found", () => {
  equal(lastIndexOf("hello world", "xyz"), -1);
});

test("slices::lastIndexOf is case-sensitive", () => {
  equal(lastIndexOf("hello world", "WORLD"), -1);
  equal(lastIndexOf("Hello HELLO", "HELLO"), 6);
  equal(lastIndexOf("Hello HELLO hello", "hello"), 12); // Last "hello" is at index 12
});

test("slices::lastIndexOf with multiple occurrences", () => {
  equal(lastIndexOf("abcabcabc", "abc"), 6);
  equal(lastIndexOf("aaa", "a"), 2);
  equal(lastIndexOf("ababab", "ab"), 4);
});

test("slices::lastIndexOf with index limit", () => {
  // index param means search backwards starting from that position
  equal(lastIndexOf("foo bar foo", "foo", 7), 0); // Position 7 is before last "foo" at 8
  equal(lastIndexOf("abcabcabc", "abc", 5), 3); // Finds the middle one
  equal(lastIndexOf("abcabcabc", "abc", 8), 6); // Position 8 includes last match at 6
});

test("slices::lastIndexOf with index at exact match position", () => {
  equal(lastIndexOf("hello world", "world", 10), 6);
  equal(lastIndexOf("hello world", "world", 6), -1);
});

test("slices::lastIndexOf returns -1 for empty search", () => {
  equal(lastIndexOf("hello", ""), -1);
});

test("slices::lastIndexOf returns -1 for empty value", () => {
  equal(lastIndexOf("", "test"), -1);
});

test("slices::lastIndexOf returns -1 when test longer than value", () => {
  equal(lastIndexOf("abc", "abcdef"), -1);
});

test("slices::lastIndexOf finds single character", () => {
  equal(lastIndexOf("abcabc", "c"), 5);
  equal(lastIndexOf("hello", "l"), 3);
});

test("slices::lastIndexOf with overlapping patterns", () => {
  equal(lastIndexOf("aaaa", "aa"), 2);
  equal(lastIndexOf("ababa", "aba"), 2);
});

// Unicode Tests for lastIndexOf

test("slices::lastIndexOf with accented characters", () => {
  equal(lastIndexOf("café café", "café"), 5);
  equal(lastIndexOf("naïve naïve", "naïve"), 6);
});

test("slices::lastIndexOf with German umlauts", () => {
  equal(lastIndexOf("über über", "über"), 5);
  equal(lastIndexOf("größe größe", "größe"), 6);
});

test("slices::lastIndexOf with Greek letters", () => {
  equal(lastIndexOf("αβγ αβγ", "αβγ"), 4);
  equal(lastIndexOf("Ωmega Ωmega", "Ωmega"), 6);
});

test("slices::lastIndexOf with Cyrillic letters", () => {
  equal(lastIndexOf("привет привет", "привет"), 7);
  equal(lastIndexOf("мир мир", "мир"), 4);
});

test("slices::lastIndexOf with emoji", () => {
  equal(lastIndexOf("hello 🎉 world 🎉", "🎉"), 14);
  equal(lastIndexOf("🚀🌟🚀", "🚀"), 2);
});

test("slices::lastIndexOf with flag emoji", () => {
  // Flag emoji are 2 code points each (regional indicator symbols)
  equal(lastIndexOf("test 🇺🇸 more 🇺🇸", "🇺🇸"), 13);
});

test("slices::lastIndexOf with CJK characters", () => {
  equal(lastIndexOf("你好世界你好", "你好"), 4);
  equal(lastIndexOf("日本語日本語", "日本語"), 3);
});

test("slices::lastIndexOf with Arabic text", () => {
  equal(lastIndexOf("مرحبا مرحبا", "مرحبا"), 6);
});

test("slices::lastIndexOf with high code points", () => {
  equal(lastIndexOf("𝄞music𝄞", "𝄞"), 6);
  equal(lastIndexOf("𝕳𝖊𝖑𝖑𝖔 𝕳𝖊𝖑𝖑𝖔", "𝕳𝖊𝖑𝖑𝖔"), 6);
});

test("slices::lastIndexOf with mixed scripts", () => {
  // "hello мир 你好 hello" - last "hello" starts at index 13
  equal(lastIndexOf("hello мир 你好 hello", "hello"), 13);
});

// Edge Cases for lastIndexOf

test("slices::lastIndexOf with whitespace patterns", () => {
  equal(lastIndexOf("a b a b", " "), 5);
  equal(lastIndexOf("  hello  ", " "), 8);
});

test("slices::lastIndexOf with tabs and newlines", () => {
  equal(lastIndexOf("a\tb\ta", "\t"), 3);
  equal(lastIndexOf("line1\nline2\n", "\n"), 11);
});

test("slices::lastIndexOf with special characters", () => {
  equal(lastIndexOf("a.b.c.d", "."), 5);
  equal(lastIndexOf("a*b*c", "*"), 3);
});

test("slices::lastIndexOf entire string match", () => {
  equal(lastIndexOf("hello", "hello"), 0);
});

test("slices::lastIndexOf with index 0", () => {
  equal(lastIndexOf("hello", "h", 0), 0);
  equal(lastIndexOf("hello", "e", 0), -1);
});

// =============================================================================
// lastIndexOfFold - Case-Insensitive Tests
// Note: lastIndexOfFold has default index=0, so must pass Infinity for full search
// =============================================================================

test("slices::lastIndexOfFold finds last occurrence case-insensitive", () => {
  equal(lastIndexOfFold("foo FOO Foo", "foo", Infinity), 8);
});

test("slices::lastIndexOfFold with mixed case", () => {
  equal(lastIndexOfFold("Hello HELLO hello", "HELLO", Infinity), 12);
  equal(lastIndexOfFold("ABC abc ABC", "abc", Infinity), 8);
});

test("slices::lastIndexOfFold returns -1 when not found", () => {
  equal(lastIndexOfFold("hello world", "xyz", Infinity), -1);
});

test("slices::lastIndexOfFold with multiple occurrences", () => {
  equal(lastIndexOfFold("AbCaBcAbC", "abc", Infinity), 6);
});

test("slices::lastIndexOfFold with index limit", () => {
  equal(lastIndexOfFold("foo FOO foo", "foo", 7), 4);
  equal(lastIndexOfFold("ABC abc ABC", "abc", 6), 4);
});

test("slices::lastIndexOfFold returns -1 for empty search", () => {
  equal(lastIndexOfFold("hello", "", Infinity), -1);
});

test("slices::lastIndexOfFold returns -1 for empty value", () => {
  equal(lastIndexOfFold("", "test", Infinity), -1);
});

test("slices::lastIndexOfFold returns -1 when test longer than value", () => {
  equal(lastIndexOfFold("abc", "abcdef", Infinity), -1);
});

// Unicode Tests for lastIndexOfFold

test("slices::lastIndexOfFold with accented characters", () => {
  equal(lastIndexOfFold("café CAFÉ café", "CAFÉ", Infinity), 10);
  equal(lastIndexOfFold("NAÏVE naïve", "naïve", Infinity), 6);
});

test("slices::lastIndexOfFold with German umlauts", () => {
  equal(lastIndexOfFold("über ÜBER", "ÜBER", Infinity), 5);
  equal(lastIndexOfFold("GRÖSSE größe", "größe", Infinity), 7); // GRÖSSE(6) + space(1) = größe starts at 7
});

test("slices::lastIndexOfFold with Greek letters", () => {
  equal(lastIndexOfFold("αβγ ΑΒΓ αβγ", "ΑΒΓ", Infinity), 8);
  equal(lastIndexOfFold("ΩMEGA ωmega", "ωmega", Infinity), 6);
});

test("slices::lastIndexOfFold with Cyrillic letters", () => {
  equal(lastIndexOfFold("привет ПРИВЕТ", "ПРИВЕТ", Infinity), 7);
  equal(lastIndexOfFold("МИР мир МИР", "мир", Infinity), 8);
});

test("slices::lastIndexOfFold with emoji (no case)", () => {
  equal(lastIndexOfFold("hello 🎉 world 🎉", "🎉", Infinity), 14);
  equal(lastIndexOfFold("🚀🌟🚀", "🚀", Infinity), 2);
});

test("slices::lastIndexOfFold with CJK characters (no case)", () => {
  equal(lastIndexOfFold("你好世界你好", "你好", Infinity), 4);
});

test("slices::lastIndexOfFold with mixed case accents", () => {
  equal(lastIndexOfFold("Élan ÉLAN élan", "élan", Infinity), 10);
  equal(lastIndexOfFold("Ñoño ÑOÑO", "ñoño", Infinity), 5);
});

test("slices::lastIndexOfFold with Turkish dotless i", () => {
  // Turkish has special casing for i/İ and ı/I
  equal(lastIndexOfFold("istanbul ISTANBUL", "istanbul", Infinity), 9);
});

// Edge Cases for lastIndexOfFold

test("slices::lastIndexOfFold with whitespace", () => {
  equal(lastIndexOfFold("A B A B", " ", Infinity), 5);
});

test("slices::lastIndexOfFold with special characters", () => {
  equal(lastIndexOfFold("a.B.c.D", ".", Infinity), 5);
});

test("slices::lastIndexOfFold entire string match", () => {
  equal(lastIndexOfFold("HELLO", "hello", Infinity), 0);
  equal(lastIndexOfFold("hello", "HELLO", Infinity), 0);
});

test("slices::lastIndexOfFold with single character", () => {
  equal(lastIndexOfFold("AbCdE", "e", Infinity), 4);
  equal(lastIndexOfFold("aAaAa", "A", Infinity), 4);
});

test("slices::lastIndexOfFold with high code points", () => {
  equal(lastIndexOfFold("𝄞music𝄞", "𝄞", Infinity), 6);
});
