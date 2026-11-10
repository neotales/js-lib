import { test } from "../../../test/run.ts";
import { ok } from "../../../test/assert.ts";
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
  ok(!isSymbolAt(str2, 0));
});
