import { test } from "@neotales/test";
import { ok } from "@neotales/assert";
import { equalFold } from "./equal_fold.ts";

test("chars::equalFold", () => {
  ok(equalFold(0x0041, 0x0061));
  ok(equalFold(0x0061, 0x0041));
  ok(equalFold(0x00b5, 0x039c));
  ok(equalFold(0x039c, 0x03bc));
  ok(equalFold(0x03bc, 0x00b5));

  // Orbits can have three or more members, and both directions must work.
  ok(equalFold(0x01c4, 0x01c6));
  ok(equalFold(0x01c6, 0x01c4));
  ok(equalFold(0x01c4, 0x01c5));
  ok(equalFold(0x01c5, 0x01c4));
  ok(equalFold(0x004b, 0x212a));
  ok(equalFold(0x212a, 0x004b));
  ok(equalFold(0x00df, 0x1e9e));
  ok(equalFold(0x1e9e, 0x00df));

  ok(!equalFold(0x00df, 0x0073)); // ß folds to ẞ, not s
  ok(!equalFold(0x0130, 0x0069)); // İ is its own simple-fold orbit
  ok(!equalFold(0x01c4, 0x01c7));
  ok(!equalFold(0x004b, 0x0053));
});

test("chars::equalFold invalid values", () => {
  const invalid = [1.5, -1, -0.5, 0x110000, Infinity, -Infinity, NaN];

  for (const value of invalid) {
    ok(!equalFold(value, value), `equalFold(${value}, ${value})`);
    ok(!equalFold(value, 0x41), `equalFold(${value}, 'A')`);
    ok(!equalFold(0x41, value), `equalFold('A', ${value})`);
  }

  // A valid pair still folds after the guard.
  ok(equalFold(0x41, 0x61));
});
