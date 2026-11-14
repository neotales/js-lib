import { test } from "@neotales/test";
import { ok } from "@neotales/assert";
import { isChar } from "./is_char.ts";

test("chars::isChar", () => {
  ok(isChar(0x1f600));
  ok(!isChar(0x110000));
  ok(isChar(0x10ffff));
  ok(!isChar(0.32));
  ok(isChar(0.0));
  ok(isChar(-0.0));
  ok(!isChar(0.0000000000001));
  ok(isChar(1.0));
});
