import { test } from "../../../test/run.ts";
import { ok } from "../../../test/assert.ts";
import { isLower, isLowerAt } from "./is_lower.ts";

test("chars::isLower", () => {
  ok(isLower(97)); // a
  ok(isLower(98)); // b
  ok(isLower(99)); // c
  ok(isLower(122)); // z

  ok(!isLower(65)); // A
  ok(!isLower(90)); // Z
  ok(!isLower(48)); // 0
  ok(!isLower(57)); // 9

  ok(!isLower(0xa64e)); // Ꙏ
  ok(isLower(0xa64f)); // ꙏ
});

test("chars::isLowerAt", () => {
  const str = "Holy 💩ꙏ";
  ok(!isLowerAt(str, 0));
  ok(isLowerAt(str, 1));
  ok(isLowerAt(str, 2));
  ok(isLowerAt(str, 3));
  ok(!isLowerAt(str, 4));
  ok(!isLowerAt(str, 5));
  ok(!isLowerAt(str, 6));
  ok(isLowerAt(str, 7));
});
