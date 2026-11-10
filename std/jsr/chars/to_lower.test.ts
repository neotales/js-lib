import { test } from "../../../test/run.ts";
import { deepStrictEqual as equal } from "../../../test/assert.ts";
import { toLower } from "./to_lower.ts";

test("chars::toLower", () => {
  equal(toLower(0x0041), 0x0061);
  equal(toLower(0x0061), 0x0061);
  equal(toLower(0x00b5), 0x00b5);
  equal(toLower(0x039c), 0x03bc);
  equal(toLower(0x03bc), 0x03bc);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
  equal(toLower(0x1f600), 0x1f600);
});
