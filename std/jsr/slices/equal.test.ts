import { ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { equal, equalFold } from "./equal.ts";

// =============================================================================
// equal - Case-Sensitive Tests
// =============================================================================

test("slices::equal with identical strings", () => {
  ok(equal("hello", "hello"));
});

test("slices::equal returns false for different case", () => {
  ok(!equal("hello", "HELLO"));
  ok(!equal("Hello", "hello"));
});

test("slices::equal returns false for different content", () => {
  ok(!equal("hello", "world"));
  ok(!equal("abc", "abd"));
});

test("slices::equal returns false for different lengths", () => {
  ok(!equal("hello", "hello "));
  ok(!equal("hello ", "hello"));
  ok(!equal("hi", "hello"));
});

test("slices::equal with empty strings", () => {
  ok(equal("", ""));
});

test("slices::equal empty vs non-empty", () => {
  ok(!equal("", "a"));
  ok(!equal("a", ""));
});

test("slices::equal with single characters", () => {
  ok(equal("a", "a"));
  ok(!equal("a", "b"));
  ok(!equal("a", "A"));
});

// Unicode Tests for equal

test("slices::equal with accented characters", () => {
  ok(equal("café", "café"));
  ok(!equal("cafe", "café"));
  ok(!equal("café", "cafe"));
});

test("slices::equal with German umlauts", () => {
  ok(equal("über", "über"));
  ok(!equal("uber", "über"));
  ok(equal("größe", "größe"));
});

test("slices::equal with Greek letters", () => {
  ok(equal("αβγ", "αβγ"));
  ok(!equal("αβγ", "ΑΒΓ"));
  ok(equal("Ωmega", "Ωmega"));
});

test("slices::equal with Cyrillic letters", () => {
  ok(equal("привет", "привет"));
  ok(!equal("привет", "ПРИВЕТ"));
  ok(equal("мир", "мир"));
});

test("slices::equal with emoji", () => {
  ok(equal("hello 🎉", "hello 🎉"));
  ok(!equal("hello 🎉", "hello 🎊"));
  ok(equal("🚀🌟", "🚀🌟"));
});

test("slices::equal with flag emoji", () => {
  ok(equal("🇺🇸", "🇺🇸"));
  ok(!equal("🇺🇸", "🇬🇧"));
});

test("slices::equal with CJK characters", () => {
  ok(equal("你好", "你好"));
  ok(!equal("你好", "您好"));
  ok(equal("日本語", "日本語"));
});

test("slices::equal with Arabic text", () => {
  ok(equal("مرحبا", "مرحبا"));
  ok(!equal("مرحبا", "مرحبأ"));
});

test("slices::equal with high code points", () => {
  ok(equal("𝄞music", "𝄞music"));
  ok(equal("𝕳𝖊𝖑𝖑𝖔", "𝕳𝖊𝖑𝖑𝖔"));
});

test("slices::equal with mixed scripts", () => {
  ok(equal("hello мир 你好", "hello мир 你好"));
  ok(!equal("hello мир 你好", "hello мир 您好"));
});

// Edge Cases for equal

test("slices::equal with whitespace", () => {
  ok(equal("hello world", "hello world"));
  ok(!equal("hello world", "hello  world"));
  ok(!equal(" hello", "hello"));
});

test("slices::equal with tabs and newlines", () => {
  ok(equal("a\tb", "a\tb"));
  ok(!equal("a\tb", "a b"));
  ok(equal("line1\nline2", "line1\nline2"));
});

test("slices::equal with special characters", () => {
  ok(equal("a.b.c", "a.b.c"));
  ok(equal("a*b*c", "a*b*c"));
  ok(!equal("a.b.c", "a-b-c"));
});

// =============================================================================
// equalFold - Case-Insensitive Tests
// =============================================================================

test("slices::equalFold with identical strings", () => {
  ok(equalFold("hello", "hello"));
});

test("slices::equalFold with different case", () => {
  ok(equalFold("hello", "HELLO"));
  ok(equalFold("HELLO", "hello"));
  ok(equalFold("HeLLo", "hElLO"));
});

test("slices::equalFold returns false for different content", () => {
  ok(!equalFold("hello", "world"));
  ok(!equalFold("abc", "abd"));
});

test("slices::equalFold returns false for different lengths", () => {
  ok(!equalFold("hello", "hello "));
  ok(!equalFold(" hello", "hello"));
});

test("slices::equalFold with empty strings", () => {
  ok(equalFold("", ""));
});

test("slices::equalFold empty vs non-empty", () => {
  ok(!equalFold("", "a"));
  ok(!equalFold("a", ""));
});

test("slices::equalFold with single characters", () => {
  ok(equalFold("a", "A"));
  ok(equalFold("A", "a"));
  ok(!equalFold("a", "b"));
});

// Unicode Tests for equalFold

test("slices::equalFold with accented characters", () => {
  ok(equalFold("café", "CAFÉ"));
  ok(equalFold("CAFÉ", "café"));
  ok(equalFold("Café", "cAfÉ"));
});

test("slices::equalFold with German umlauts", () => {
  ok(equalFold("über", "ÜBER"));
  ok(equalFold("ÜBER", "über"));
  ok(equalFold("größe", "GRÖßE"));
});

test("slices::equalFold with Greek letters", () => {
  ok(equalFold("αβγ", "ΑΒΓ"));
  ok(equalFold("ΑΒΓ", "αβγ"));
  ok(equalFold("Ωmega", "ωMEGA"));
});

test("slices::equalFold with Cyrillic letters", () => {
  ok(equalFold("привет", "ПРИВЕТ"));
  ok(equalFold("ПРИВЕТ", "привет"));
  ok(equalFold("мир", "МИР"));
});

test("slices::equalFold with emoji (no case)", () => {
  ok(equalFold("hello 🎉", "HELLO 🎉"));
  ok(!equalFold("hello 🎉", "hello 🎊"));
});

test("slices::equalFold with CJK characters (no case)", () => {
  ok(equalFold("你好", "你好"));
  ok(!equalFold("你好", "您好"));
});

test("slices::equalFold with mixed case accents", () => {
  ok(equalFold("Élan", "ÉLAN"));
  ok(equalFold("ÉLAN", "élan"));
  ok(equalFold("Ñoño", "ÑOÑO"));
});

test("slices::equalFold with mixed scripts and case", () => {
  ok(equalFold("Hello Мир", "HELLO МИР"));
  ok(equalFold("HELLO МИР", "hello мир"));
});

// Edge Cases for equalFold

test("slices::equalFold with whitespace", () => {
  ok(equalFold("HELLO WORLD", "hello world"));
  ok(!equalFold("hello world", "hello  world"));
});

test("slices::equalFold with special characters", () => {
  ok(equalFold("A.B.C", "a.b.c"));
  ok(equalFold("A*B*C", "a*b*c"));
});

test("slices::equalFold with high code points", () => {
  ok(equalFold("𝄞MUSIC", "𝄞music"));
});
