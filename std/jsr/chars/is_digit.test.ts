import { test } from "@neotales/test";
import { ok } from "@neotales/assert";
import { isDigit, isDigitAt, isDigitUnsafe } from "./is_digit.ts";

test("chars::isDigit", () => {
  ok(isDigit(48)); // 0
  ok(isDigit(49)); // 1
  ok(isDigit(50)); // 2
  ok(isDigit(51)); // 3

  ok(!isDigit(1)); // \x01
  ok(isDigit(0x0e50)); // ๐
  ok(isDigit(0x0e51)); // ๑
  ok(isDigit(0x0e52)); // ๒

  // Nd only: superscripts and fractions are No, not decimal digits.
  ok(!isDigit(0x00b2)); // ²
  ok(!isDigit(0x00b3)); // ³
  ok(!isDigit(0x00b9)); // ¹
  ok(!isDigit(0x00bc)); // ¼
  ok(!isDigit(0x00bd)); // ½
  ok(!isDigit(0x00be)); // ¾
  ok(!isDigit(0x2160)); // Ⅰ, Roman numeral one
  ok(!isDigit(0x2460)); // ①, circled digit one

  // Every Nd block, including supplementary planes.
  ok(isDigit(0x0660));
  ok(isDigit(0xff10));
  ok(isDigit(0x104a0));
  ok(isDigit(0x1d7ce));
  ok(isDigitUnsafe(0x1d7ce));
  ok(!isDigitUnsafe(0x00b2));
  ok(!isDigitUnsafe(0x00bc));
});

test("chars::isDigitAt", () => {
  const str = "Hello 123!";
  ok(!isDigitAt(str, 0));
  ok(!isDigitAt(str, 1));
  ok(isDigitAt(str, 6));

  const str2 = "๐ ๑ ๒ ๓ ๔ ๕ ๖ ๗ ๘ ๙";
  ok(isDigitAt(str2, 0));
  ok(!isDigitAt(str2, 1));
  ok(isDigitAt(str2, 2));
  ok(isDigitAt(str2, 4));

  ok(isDigitAt("𝟎", 0)); // U+1D7CE MATHEMATICAL BOLD DIGIT ZERO
  ok(isDigitAt("x𝟎", 1));
  ok(!isDigitAt("²", 0));
});
