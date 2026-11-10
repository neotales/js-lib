import { test } from "../../../test/run.ts";
import { ok } from "../../../test/assert.ts";
import { equalFold } from "./equal_fold.ts";

test("chars::equalFold", () => {
  ok(equalFold(0x0041, 0x0061));
  ok(equalFold(0x0061, 0x0041));
  ok(equalFold(0x00b5, 0x039c));
  ok(equalFold(0x039c, 0x03bc));
  ok(equalFold(0x03bc, 0x00b5));
});
