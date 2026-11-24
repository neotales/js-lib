import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { lastIndexOf, lastIndexOfFold } from "./last_index_of.ts";

test("strings::lastIndexOf finds last occurrence of chars", () => {
  equal(lastIndexOf("hello world", "o"), 7);
  equal(lastIndexOf("hello world", "o"), 7);
  equal(lastIndexOf("hello world", "l"), 9);
  equal(lastIndexOf("hello world", "z"), -1);
});

test("strings::lastIndexOf with index finds last occurrence before index", () => {
  equal(lastIndexOf("hello world", "o", 6), 4);
  equal(lastIndexOf("hello hello", "l", 5), 3);
});

test("strings::lastIndexOfFold finds last occurrence case-insensitive", () => {
  equal(lastIndexOfFold("Hello WORLD", "o"), 7);
  equal(lastIndexOfFold("Hello WORLD", "O"), 7);
  equal(lastIndexOfFold("Hello WORLD", ["o".codePointAt(0)]), 7);
  equal(lastIndexOfFold("Hello WORLD", "w"), 6);
  equal(lastIndexOfFold("Hello WORLD", "z"), -1);
});

test("strings::lastIndexOfFold with index finds last occurrence case-insensitive before index", () => {
  equal(lastIndexOfFold("Hello WORLD", "O", 6), 4);
  equal(lastIndexOfFold("hello HELLO", "L", 5), 3);
});
