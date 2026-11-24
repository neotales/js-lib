import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  trim,
  trimChar,
  trimEnd,
  trimEndChar,
  trimEndSlice,
  trimSlice,
  trimStart,
  trimStartChar,
  trimStartSlice,
} from "./trim.ts";

test("strings::trimEndChar removes trailing character", () => {
  equal(trimEndChar("hello.", 46), "hello"); // 46 is "." character code
});

test("strings::trimEndSlice removes trailing characters", () => {
  equal(trimEndSlice("hello123", [49, 50, 51]), "hello"); // "123" character codes
});

test("strings::trimEnd removes trailing whitespace when no suffix provided", () => {
  equal(trimEnd("hello   "), "hello");
});

test("strings::trimEnd with char removes trailing character", () => {
  equal(trimEnd("hello.", [46]), "hello");
});

test("strings::trimStartChar removes leading character", () => {
  equal(trimStartChar(".hello", 46), "hello");
});

test("strings::trimStartSlice removes leading characters", () => {
  equal("hello", trimStartSlice("123hello", [49, 50, 51]));
});

test("strings::trimStart removes leading whitespace when no prefix provided", () => {
  equal("hello", trimStart("   hello"));
});

test("strings::trimStart with char removes leading character", () => {
  equal("hello", trimStart(".hello", [46]));
});

test("strings::trimChar removes leading and trailing character", () => {
  equal(trimChar(".hello.", 46), "hello");
});

test("strings::trimSlice removes leading and trailing characters", () => {
  equal("hello", trimSlice("123hello123", [49, 50, 51]));
});

test("strings::trim removes whitespace when no chars provided", () => {
  equal("hello", trim("  hello  "));
});

test("strings::trim with char removes leading and trailing character", () => {
  equal("hello", trim(".hello.", [46]));
});

test("strings::trim with multiple chars removes leading and trailing characters", () => {
  equal("hello", trim("123hello123", [49, 50, 51]));
});
