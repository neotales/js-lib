import { test } from "../../../test/run.ts";
import { deepStrictEqual as equal } from "../../../test/assert.ts";
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
});
