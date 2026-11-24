// Conformance checks against the Unicode tables generated from Go 1.24.0.
//
// The tables are a copy of `src/unicode/tables.go` from Go 1.24.0, which is
// Unicode 15.0.0. These tests walk every range and every case mapping in those
// tables, so a change to a table or to the range-indexing logic has to agree
// with the data, not only with a handful of examples.

import { fail, ok } from "@neotales/assert";
import { test } from "@neotales/test";

import { AsciiFold, CaseOrbit, CaseRanges } from "./tables/case.ts";
import { L } from "./tables/l.ts";
import { latin1, pC } from "./tables/latin1.ts";
import { Ll } from "./tables/ll.ts";
import { Lu } from "./tables/lu.ts";
import { Nd } from "./tables/nd.ts";
import { P } from "./tables/p.ts";
import { S } from "./tables/s.ts";

import { isControl, isControlUnsafe } from "./is_control.ts";
import { isDigit, isDigitUnsafe } from "./is_digit.ts";
import { isLetter, isLetterUnsafe } from "./is_letter.ts";
import { isLetterOrDigit, isLetterOrDigitUnsafe } from "./is_letter_or_digit.ts";
import { isLower, isLowerUnsafe } from "./is_lower.ts";
import { isPunc, isPuncUnsafe } from "./is_punc.ts";
import { isSymbol, isSymbolUnsafe } from "./is_symbol.ts";
import { isUpper, isUpperUnsafe } from "./is_upper.ts";
import { simpleFold } from "./simple_fold.ts";
import { equalFold } from "./equal_fold.ts";
import { toLower } from "./to_lower.ts";
import { toUpper } from "./to_upper.ts";

// The lane launcher injects this marker for the JerryScript build. Runtime
// feature sniffing is wrong here: browsers and QuickJS-ng are not JerryScript.
const JERRY_LANE =
  (globalThis as { __NEOTALES_LANE__?: string }).__NEOTALES_LANE__ === "jerry";

function testConformance(name: string, fn: () => void): void {
  test(name, fn);
}

// Only the full sweeps are skipped on JerryScript. Cheap invalid, Latin-1,
// range-gap, orbit, and reported-example checks run on every lane.
function testExpensive(name: string, fn: () => void): void {
  test(name, (t) => {
    if (JERRY_LANE) t.skip("full Unicode sweep exceeds the 60-second JerryScript lane cap");
    fn();
  });
}


type Range = [number, number, number];
type CaseRange = [number, number, number[]];

const MAX_RUNE = 0x10ffff;
const UPPER_LOWER = MAX_RUNE + 1;

const caseRanges = CaseRanges as unknown as CaseRange[];

function check(value: boolean, what: string, char: number): void {
  if (!value) {
    fail(`${what} at U+${char.toString(16).toUpperCase().padStart(4, "0")}`);
  }
}

function ranges(table: { R16: number[][]; R32: number[][] }): Range[] {
  return [...table.R16, ...table.R32] as Range[];
}

function inRange(range: Range, char: number): boolean {
  const [lo, hi, stride] = range;
  return lo <= char && char <= hi && (stride === 1 || (char - lo) % stride === 0);
}

// Independent membership test over a table. This deliberately does not call
// the production is16/is32 helpers.
function inTable(table: { R16: number[][]; R32: number[][] }, char: number): boolean {
  for (const range of ranges(table)) {
    if (inRange(range, char)) {
      return true;
    }
  }
  return false;
}

function checkEveryMember(
  table: { R16: number[][]; R32: number[][] },
  predicate: (char: number) => boolean,
  unsafe: (char: number) => boolean,
  name: string,
): void {
  for (const [lo, hi, stride] of ranges(table)) {
    for (let char = lo; char <= hi; char += stride) {
      check(predicate(char), `${name} safe`, char);
      check(unsafe(char), `${name} unsafe`, char);
    }
  }
}

function checkGaps(
  table: { R16: number[][]; R32: number[][] },
  predicate: (char: number) => boolean,
  unsafe: (char: number) => boolean,
  name: string,
): void {
  const all = ranges(table).sort((a, b) => a[0] - b[0]);
  let previousHi = -1;
  for (const [lo, hi] of all) {
    if (lo > previousHi + 1) {
      for (const char of [lo - 1, Math.floor((previousHi + lo) / 2)]) {
        if (char >= 0 && char <= MAX_RUNE && char > previousHi && char < lo) {
          check(!predicate(char), `${name} gap safe`, char);
          check(!unsafe(char), `${name} gap unsafe`, char);
        }
      }
    }
    previousHi = Math.max(previousHi, hi);
  }
}

function lookupCaseRange(char: number): CaseRange | undefined {
  let lo = 0;
  let hi = caseRanges.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const range = caseRanges[mid];
    if (range[0] <= char && char <= range[1]) {
      return range;
    }
    if (char < range[0]) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return undefined;
}

// The exact conversion used by Go's unicode.convertCase.
function convertCase(char: number, range: CaseRange, caseIndex: number): number {
  const delta = range[2][caseIndex];
  if (delta > MAX_RUNE) {
    return range[0] + (((char - range[0]) & ~1) | (caseIndex & 1));
  }
  return char + delta;
}

function expectedToLower(char: number): number {
  if (char < 128) {
    return char >= 0x41 && char <= 0x5a ? char + 32 : char;
  }
  const range = lookupCaseRange(char);
  return range === undefined ? char : convertCase(char, range, 1);
}

function expectedToUpper(char: number): number {
  if (char < 128) {
    return char >= 0x61 && char <= 0x7a ? char - 32 : char;
  }
  const range = lookupCaseRange(char);
  return range === undefined ? char : convertCase(char, range, 0);
}

// The exact algorithm used by Go's unicode.SimpleFold.
function expectedSimpleFold(char: number): number {
  if (char < 0 || char > MAX_RUNE) {
    return char;
  }
  if (char < AsciiFold.length) {
    return AsciiFold[char];
  }
  let lo = 0;
  let hi = CaseOrbit.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (CaseOrbit[mid][0] < char) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  if (lo < CaseOrbit.length && CaseOrbit[lo][0] === char) {
    return CaseOrbit[lo][1];
  }
  const range = lookupCaseRange(char);
  if (range !== undefined) {
    const lower = convertCase(char, range, 1);
    if (lower !== char) {
      return lower;
    }
    return convertCase(char, range, 0);
  }
  return char;
}

function foldOrbit(char: number): number[] {
  const orbit = [char];
  let next = expectedSimpleFold(char);
  while (next !== char) {
    orbit.push(next);
    next = expectedSimpleFold(next);
  }
  return orbit;
}

function sample(): number[] {
  // Deterministic samples across the whole code space, including both
  // supplementary planes and unassigned code points.
  const out: number[] = [-1, 0, 1, 0x7f, 0x80, 0xff, 0x100, 0xffff, 0x10000, MAX_RUNE, MAX_RUNE + 1];
  let state = 0x12345678;
  for (let i = 0; i < 4096; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out.push(state % (MAX_RUNE + 1));
  }
  return out;
}

testExpensive("chars::tables::classify every generated range", () => {
  checkEveryMember(L, isLetter, isLetterUnsafe, "isLetter");
  checkEveryMember(Lu, isUpper, isUpperUnsafe, "isUpper");
  checkEveryMember(Ll, isLower, isLowerUnsafe, "isLower");
  checkEveryMember(Nd, isDigit, isDigitUnsafe, "isDigit");
  checkEveryMember(P, isPunc, isPuncUnsafe, "isPunc");
  checkEveryMember(S, isSymbol, isSymbolUnsafe, "isSymbol");
});

testConformance("chars::tables::reject every range gap", () => {
  checkGaps(L, isLetter, isLetterUnsafe, "isLetter");
  checkGaps(Lu, isUpper, isUpperUnsafe, "isUpper");
  checkGaps(Ll, isLower, isLowerUnsafe, "isLower");
  checkGaps(Nd, isDigit, isDigitUnsafe, "isDigit");
  checkGaps(P, isPunc, isPuncUnsafe, "isPunc");
  checkGaps(S, isSymbol, isSymbolUnsafe, "isSymbol");
});

testExpensive("chars::tables::sample the whole code space", () => {
  for (const char of sample()) {
    check(isLetter(char) === inTable(L, char), "isLetter sample", char);
    check(isUpper(char) === inTable(Lu, char), "isUpper sample", char);
    check(isLower(char) === inTable(Ll, char), "isLower sample", char);
    check(isDigit(char) === inTable(Nd, char), "isDigit sample", char);
    check(isPunc(char) === inTable(P, char), "isPunc sample", char);
    check(isSymbol(char) === inTable(S, char), "isSymbol sample", char);
    check(
      isLetterOrDigit(char) === (inTable(L, char) || inTable(Nd, char)),
      "isLetterOrDigit sample",
      char,
    );
  }
});

testConformance("chars::tables::isDigit is Nd only", () => {
  for (let char = 0; char < 256; char++) {
    check(isDigit(char) === (char >= 0x30 && char <= 0x39), "isDigit Latin-1", char);
  }

  // Numerals outside Nd must not be digits.
  for (const char of [0x00b2, 0x00b3, 0x00b9, 0x00bc, 0x00bd, 0x00be, 0x2160, 0x2460]) {
    check(!isDigit(char), "isDigit non-Nd numeral", char);
  }

  // Nd itself, including supplementary planes.
  for (const char of [0x30, 0x39, 0x0660, 0x06f9, 0xff10, 0x104a0, 0x1d7ce, 0x1fbf0]) {
    check(isDigit(char), "isDigit Nd", char);
    check(isDigitUnsafe(char), "isDigitUnsafe Nd", char);
  }
});

testExpensive("chars::tables::case conversion matches every CaseRange", () => {
  for (const [lo, hi] of caseRanges) {
    for (let char = lo; char <= hi; char++) {
      const lower = expectedToLower(char);
      const upper = expectedToUpper(char);
      check(toLower(char) === lower, "toLower", char);
      check(toUpper(char) === upper, "toUpper", char);
      for (const member of foldOrbit(char)) {
        check(equalFold(char, member), "equalFold orbit", char);
        check(equalFold(member, char), "equalFold orbit reverse", char);
      }
    }
  }

  for (const char of [0x41, 0x5a, 0x61, 0x7a, 0x00b5, 0x00df, 0x0130, 0x0131]) {
    check(toLower(char) === expectedToLower(char), "toLower sample", char);
    check(toUpper(char) === expectedToUpper(char), "toUpper sample", char);
  }
});

testExpensive("chars::tables::simpleFold matches every mapping", () => {
  for (let char = 0; char < AsciiFold.length; char++) {
    check(simpleFold(char) === AsciiFold[char], "simpleFold ASCII", char);
  }

  for (const [from, to] of CaseOrbit) {
    check(simpleFold(from) === to, "simpleFold orbit", from);
  }

  for (const [lo, hi] of caseRanges) {
    for (let char = lo; char <= hi; char++) {
      check(simpleFold(char) === expectedSimpleFold(char), "simpleFold case range", char);
    }
  }

  for (const char of sample()) {
    check(simpleFold(char) === expectedSimpleFold(char), "simpleFold sample", char);
    if (Number.isInteger(char) && char >= 0 && char <= MAX_RUNE) {
      check(equalFold(char, simpleFold(char)), "equalFold fold", char);
      check(equalFold(simpleFold(char), char), "equalFold fold reverse", char);
    } else {
      check(!equalFold(char, char), "equalFold invalid sample", char);
    }
  }
});

testConformance("chars::tables::equalFold is a symmetric orbit", () => {
  // The reported regression: 0x01C4/0x01C6 are the same fold orbit in both
  // directions even though neither is the direct successor of the other.
  ok(equalFold(0x01c4, 0x01c6));
  ok(equalFold(0x01c6, 0x01c4));
  ok(equalFold(0x01c5, 0x01c4));
  ok(equalFold(0x01c4, 0x01c5));

  // Three- and four-member orbits.
  ok(equalFold(0x004b, 0x006b));
  ok(equalFold(0x006b, 0x212a));
  ok(equalFold(0x212a, 0x004b));
  ok(equalFold(0x212a, 0x006b));

  // Not every numeral or letter in a nearby block folds together.
  ok(!equalFold(0x01c4, 0x01c7));
  ok(!equalFold(0x0041, 0x0042));
  ok(!equalFold(0x004b, 0x0053));
  ok(!equalFold(0x00df, 0x0073));
});

testConformance("chars::tables::Latin-1 properties", () => {
  for (let char = 0; char < 256; char++) {
    check(isControl(char) === ((latin1[char] & pC) !== 0), "isControl", char);
    check(isControlUnsafe(char) === isControl(char), "isControlUnsafe", char);
  }

  // pLo characters carry both case bits and must not satisfy either test.
  for (const char of [0x00aa, 0x00ba]) {
    ok(!isUpper(char));
    ok(!isLower(char));
    ok(isLetter(char));
  }
});

testConformance("chars::tables::safe APIs reject invalid values", () => {
  const invalid = [
    -1,
    -0.5,
    0.5,
    NaN,
    Infinity,
    -Infinity,
    MAX_RUNE + 1,
    Number.MAX_SAFE_INTEGER,
  ];

  for (const value of invalid) {
    check(!isLetter(value), "isLetter invalid", value);
    check(!isDigit(value), "isDigit invalid", value);
    check(!isPunc(value), "isPunc invalid", value);
    check(!isSymbol(value), "isSymbol invalid", value);
    check(!isUpper(value), "isUpper invalid", value);
    check(!isLower(value), "isLower invalid", value);
    check(!isLetterOrDigit(value), "isLetterOrDigit invalid", value);
    check(!isControl(value), "isControl invalid", value);
    check(!equalFold(value, value), "equalFold invalid", value);
    check(!equalFold(value, 0x41), "equalFold invalid first", value);
    check(!equalFold(0x41, value), "equalFold invalid second", value);
  }

  // The safe and unsafe variants agree on every valid code point; unsafe is
  // only allowed to skip the checks, not to give a different answer.
  for (const char of [0, 1, 0x7f, 0x80, 0xff, 0x100, 0xffff, 0x10000, MAX_RUNE]) {
    check(isLetter(char) === isLetterUnsafe(char), "isLetter boundary", char);
    check(isDigit(char) === isDigitUnsafe(char), "isDigit boundary", char);
    check(isPunc(char) === isPuncUnsafe(char), "isPunc boundary", char);
    check(isSymbol(char) === isSymbolUnsafe(char), "isSymbol boundary", char);
    check(isUpper(char) === isUpperUnsafe(char), "isUpper boundary", char);
    check(isLower(char) === isLowerUnsafe(char), "isLower boundary", char);
    check(isLetterOrDigit(char) === isLetterOrDigitUnsafe(char), "isLetterOrDigit boundary", char);
    check(isControl(char) === isControlUnsafe(char), "isControl boundary", char);
  }
});

testConformance("chars::tables::reported examples", () => {
  // The classifier bugs that motivated this suite.
  ok(isLetter(0x0100));
  ok(isLetter(0x10ffff) === false);
  ok(!isUpper(0x00aa));
  ok(!isUpper(0x00ba));
  ok(!isLower(0x00aa));
  ok(!isLower(0x00ba));
  ok(isPunc(0x037e));
  ok(isPunc(0x1e95f));
  ok(isSymbol(0x02c2));
  ok(isSymbol(0x1fbca));
  ok(!isSymbol(0x110000));

  // Conversion through an UpperLower range whose Lo is odd.
  ok(toUpper(0x0139) === 0x0139);
  ok(toLower(0x0139) === 0x013a);
  ok(toUpper(0x013a) === 0x0139);
  ok(toLower(0x013a) === 0x013a);

  // Simple fold is an orbit, not a single lower-case conversion.
  ok(simpleFold(0x00df) === 0x1e9e);
  ok(simpleFold(0x1e9e) === 0x00df);
  ok(simpleFold(0x0073) === 0x017f);
  ok(simpleFold(0x017f) === 0x0053);
});
