import { test } from "@neotales/test";
import { ok } from "@neotales/assert";
import { isSymbol, isSymbolAt } from "./is_symbol.ts";

test("chars::isSymbol", () => {
  ok(isSymbol(0x0024));
  ok(isSymbol(0x002b));
  ok(!isSymbol(0x110000));
  ok(!isSymbol(0x10ffff));
  ok(!isSymbol(0.32));
  ok(!isSymbol(0.0));
  ok(!isSymbol(-0.0));
  ok(!isSymbol(0.0000000000001));
  ok(!isSymbol(1.0));
});

test("chars::isSymbolAt", () => {
  const str = "$22.50";
  ok(isSymbolAt(str, 0));
  ok(!isSymbolAt(str, 1));

  const str2 = "🦄";
  ok(isSymbolAt(str2, 0)); // U+1F984 is category So
  ok(isSymbol(0x1f600)); // U+1F600 is category So
  ok(isSymbol(0x1fbca)); // U+1FBCA is category So
  ok(!isSymbol(0x41)); // a letter is not a symbol
});
