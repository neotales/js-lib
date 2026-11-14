import { ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { endsWith, endsWithFold } from "./ends_with.ts";

// =============================================================================
// endsWith - Case-Sensitive Tests
// =============================================================================

test("slices::endsWith with matching suffix", () => {
  ok(endsWith("hello world", "world"));
});

test("slices::endsWith returns false for non-suffix", () => {
  ok(!endsWith("hello world", "hello"));
  ok(!endsWith("hello world", "worl"));
});

test("slices::endsWith is case-sensitive", () => {
  ok(!endsWith("hello world", "WORLD"));
  ok(!endsWith("hello World", "world"));
  ok(endsWith("hello WORLD", "WORLD"));
});

test("slices::endsWith returns false when suffix longer", () => {
  ok(!endsWith("hi", "hello"));
  ok(!endsWith("ld", "world"));
});

test("slices::endsWith with empty suffix", () => {
  ok(endsWith("hello", ""));
});

test("slices::endsWith with empty value", () => {
  ok(!endsWith("", "test"));
  ok(endsWith("", ""));
});

test("slices::endsWith with entire string as suffix", () => {
  ok(endsWith("hello", "hello"));
});

test("slices::endsWith with single character", () => {
  ok(endsWith("hello", "o"));
  ok(!endsWith("hello", "l"));
});

// Unicode Tests for endsWith

test("slices::endsWith with accented characters", () => {
  ok(endsWith("bonjour café", "café"));
  ok(!endsWith("bonjour café", "cafe"));
  ok(endsWith("naïve", "ïve"));
});

test("slices::endsWith with German umlauts", () => {
  ok(endsWith("guten tag über", "über"));
  ok(endsWith("größe", "öße"));
});

test("slices::endsWith with Greek letters", () => {
  ok(endsWith("hello αβγ", "αβγ"));
  ok(!endsWith("hello αβγ", "ΑΒΓ"));
  ok(endsWith("Ωmega", "mega"));
});

test("slices::endsWith with Cyrillic letters", () => {
  ok(endsWith("hello привет", "привет"));
  ok(!endsWith("hello привет", "ПРИВЕТ"));
});

test("slices::endsWith with emoji", () => {
  ok(endsWith("hello 🎉", "🎉"));
  ok(!endsWith("hello 🎉", "🎊"));
  ok(endsWith("test 🚀🌟", "🌟"));
});

test("slices::endsWith with flag emoji", () => {
  ok(endsWith("USA 🇺🇸", "🇺🇸"));
  ok(!endsWith("USA 🇺🇸", "🇬🇧"));
});

test("slices::endsWith with CJK characters", () => {
  ok(endsWith("hello 你好", "你好"));
  ok(endsWith("日本語テスト", "テスト"));
});

test("slices::endsWith with Arabic text", () => {
  ok(endsWith("hello مرحبا", "مرحبا"));
});

test("slices::endsWith with high code points", () => {
  ok(endsWith("music 𝄞", "𝄞"));
  ok(endsWith("test 𝕳𝖊𝖑𝖑𝖔", "𝕳𝖊𝖑𝖑𝖔"));
});

// Edge Cases for endsWith

test("slices::endsWith with whitespace suffix", () => {
  ok(endsWith("hello ", " "));
  ok(endsWith("hello world ", " "));
  ok(!endsWith("hello", " "));
});

test("slices::endsWith with tabs and newlines", () => {
  ok(endsWith("hello\t", "\t"));
  ok(endsWith("line1\nline2\n", "\n"));
});

test("slices::endsWith with special characters", () => {
  ok(endsWith("file.txt", ".txt"));
  ok(endsWith("a.b.c", ".c"));
  ok(endsWith("test*", "*"));
});

// =============================================================================
// endsWithFold - Case-Insensitive Tests
// =============================================================================

test("slices::endsWithFold with matching suffix", () => {
  ok(endsWithFold("hello world", "world"));
});

test("slices::endsWithFold with different case", () => {
  ok(endsWithFold("hello world", "WORLD"));
  ok(endsWithFold("hello WORLD", "world"));
  ok(endsWithFold("hello WoRLd", "wOrLd"));
});

test("slices::endsWithFold returns false for non-suffix", () => {
  ok(!endsWithFold("hello world", "hello"));
  ok(!endsWithFold("hello world", "worl"));
});

test("slices::endsWithFold returns false when suffix longer", () => {
  ok(!endsWithFold("hi", "hello"));
});

test("slices::endsWithFold with empty suffix", () => {
  ok(endsWithFold("hello", ""));
});

test("slices::endsWithFold with entire string as suffix", () => {
  ok(endsWithFold("HELLO", "hello"));
  ok(endsWithFold("hello", "HELLO"));
});

test("slices::endsWithFold with single character", () => {
  ok(endsWithFold("hellO", "o"));
  ok(endsWithFold("hello", "O"));
});

// Unicode Tests for endsWithFold

test("slices::endsWithFold with accented characters", () => {
  ok(endsWithFold("bonjour CAFÉ", "café"));
  ok(endsWithFold("bonjour café", "CAFÉ"));
});

test("slices::endsWithFold with German umlauts", () => {
  ok(endsWithFold("guten tag ÜBER", "über"));
  ok(endsWithFold("guten tag über", "ÜBER"));
});

test("slices::endsWithFold with Greek letters", () => {
  ok(endsWithFold("hello ΑΒΓ", "αβγ"));
  ok(endsWithFold("hello αβγ", "ΑΒΓ"));
});

test("slices::endsWithFold with Cyrillic letters", () => {
  ok(endsWithFold("hello ПРИВЕТ", "привет"));
  ok(endsWithFold("hello привет", "ПРИВЕТ"));
});

test("slices::endsWithFold with emoji (no case)", () => {
  ok(endsWithFold("HELLO 🎉", "🎉"));
});

test("slices::endsWithFold with CJK characters (no case)", () => {
  ok(endsWithFold("hello 你好", "你好"));
});

test("slices::endsWithFold with mixed case accents", () => {
  ok(endsWithFold("test ÉLAN", "élan"));
  ok(endsWithFold("test Ñoño", "ÑOÑO"));
});

// Edge Cases for endsWithFold

test("slices::endsWithFold with file extensions", () => {
  ok(endsWithFold("file.TXT", ".txt"));
  ok(endsWithFold("FILE.txt", ".TXT"));
  ok(endsWithFold("image.PNG", ".png"));
});

test("slices::endsWithFold with special characters", () => {
  ok(endsWithFold("TEST.TXT", ".txt"));
});

test("slices::endsWithFold with high code points", () => {
  ok(endsWithFold("MUSIC 𝄞", "𝄞"));
});
