import { test } from "@neotales/test";
import { deepStrictEqual as equal } from "@neotales/assert";
import { simpleFold } from "./simple_fold.ts";

test("chars::simpleFold", () => {
  equal(simpleFold(0x0041), 0x0061);
  equal(simpleFold(0x0061), 0x0041);
  equal(simpleFold(0x00b5), 0x039c);
  equal(simpleFold(0x039c), 0x03bc);
  equal(simpleFold(0x03bc), 0x00b5);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);

  equal(simpleFold(0x00df), 0x1e9e); // ß -> ẞ
  equal(simpleFold(0x1e9e), 0x00df);
  equal(simpleFold(0x0073), 0x017f); // s -> ſ
  equal(simpleFold(0x017f), 0x0053);
  equal(simpleFold(0x01c4), 0x01c5);
  equal(simpleFold(0x01c5), 0x01c6);
  equal(simpleFold(0x01c6), 0x01c4);
});

test("chars::simpleFold invalid values", () => {
  for (const value of [1.5, -1, -0.5, 0x110000, Infinity, -Infinity, NaN]) {
    equal(simpleFold(value), value);
  }
});
