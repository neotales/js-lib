import { test } from "../../../test/run.ts";
import { deepStrictEqual as equal } from "../../../test/assert.ts";
import { toUpper } from "./to_upper.ts";

test("chars::toUpper", () => {
  equal(toUpper(0x0041), 0x0041);
  equal(toUpper(0x0061), 0x0041);
  equal(toUpper(0x00b5), 0x039c);
  equal(toUpper(0x039c), 0x039c);
  equal(toUpper(0x03bc), 0x039c);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
  equal(toUpper(0x1f600), 0x1f600);
});
