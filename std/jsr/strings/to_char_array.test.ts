import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { toCharArray, toString } from "./to_char_array.ts";

test("strings::toCharArray and toString convert Unicode code points", () => {
  equal([...toCharArray("abc")], [97, 98, 99]);
  equal([...toCharArray("a😀")], [97, 128_512]);
  equal(toString([97, 98, 99]), "abc");
  equal(toString("abc"), "abc");
  equal(toString(toCharArray("a😀")), "a😀");
});
