// Regenerate the chars Unicode tables from Go's unicode package.
//
// The data source is one pinned file, not the latest Go release:
//
//   go1.24.0/src/unicode/tables.go
//   sha256 80a109e5dd4ed40a85d69ddf95175f647bbd68c577d27eb475cda63790bb2487
//   Unicode 15.0.0
//
// Usage:
//   bun eng/scripts/generate-chars-tables.ts            # fetch and write
//   bun eng/scripts/generate-chars-tables.ts --check    # fail on a diff
//   bun eng/scripts/generate-chars-tables.ts --source ./tables.go
//
// A newer Go release usually brings a newer Unicode version. Do not point this
// script at one without deciding that the published package should move to
// that Unicode version; the version check below makes that deliberate.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GO_RELEASE = "go1.24.0";
const GO_SOURCE_URL = `https://raw.githubusercontent.com/golang/go/${GO_RELEASE}/src/unicode/tables.go`;
const GO_SOURCE_SHA256 = "80a109e5dd4ed40a85d69ddf95175f647bbd68c577d27eb475cda63790bb2487";
const UNICODE_VERSION = "15.0.0";

const args = process.argv.slice(2);
const check = args.includes("--check");
const sourceIndex = args.indexOf("--source");
const sourcePath = sourceIndex === -1 ? undefined : args[sourceIndex + 1];
if (sourceIndex !== -1 && sourcePath === undefined) {
  throw new Error("--source needs a path");
}

const source = sourcePath === undefined
  ? await (await fetch(GO_SOURCE_URL)).text()
  : readFileSync(sourcePath, "utf8");
const digest = createHash("sha256").update(source).digest("hex");
if (digest !== GO_SOURCE_SHA256) {
  throw new Error(`unexpected ${GO_RELEASE} tables.go sha256: ${digest}`);
}

const version = /const Version = "([^"]+)"/.exec(source)?.[1];
if (version !== UNICODE_VERSION) {
  throw new Error(`tables.go is Unicode ${version}, expected ${UNICODE_VERSION}`);
}

type Range = [number, number, number];

function tableBlock(name: string): string {
  const start = source.indexOf(`var ${name} = &RangeTable{`);
  if (start === -1) throw new Error(`missing ${name}`);
  const end = source.indexOf("\n}\n", start + 20);
  if (end === -1) throw new Error(`unterminated ${name}`);
  return source.slice(start, end);
}

function rangeTable(name: string): { R16: Range[]; R32: Range[]; LatinOffset: number } {
  const block = tableBlock(name);
  const ranges = (field: string, kind: string): Range[] => {
    const start = block.indexOf(`${field}: []${kind}{`);
    if (start === -1) return [];
    const end = block.indexOf("\n\t},", start);
    const text = block.slice(start, end);
    return [...text.matchAll(/\{0x([0-9a-fA-F]+), 0x([0-9a-fA-F]+), (\d+)\}/g)]
      .map((match) => [Number.parseInt(match[1], 16), Number.parseInt(match[2], 16), Number(match[3])]);
  };
  const LatinOffset = Number(/LatinOffset:\s*(\d+)/.exec(block)?.[1]);
  if (!Number.isInteger(LatinOffset)) throw new Error(`missing LatinOffset in ${name}`);
  return { R16: ranges("R16", "Range16"), R32: ranges("R32", "Range32"), LatinOffset };
}

function hex(value: number, width = 4): string {
  return `0x${value.toString(16).padStart(width, "0")}`;
}

function rangeFile(
  name: string,
  tableName: string,
  exported: boolean,
): string {
  const table = rangeTable(tableName);
  const prefix = exported ? "export " : "";
  const lines = [
    `${prefix}const R16 = [`,
    ...table.R16.map(([lo, hi, stride]) => `  [${hex(lo)}, ${hex(hi)}, ${stride}],`),
    "];",
    "",
    `${prefix}const R32 = [`,
    ...table.R32.map(([lo, hi, stride]) => `  [${hex(lo, 5)}, ${hex(hi, 5)}, ${stride}],`),
    "];",
    "",
    `${prefix}const LatinOffset = ${table.LatinOffset};`,
    "",
    `export const ${name} = { R16, R32, LatinOffset };`,
    "",
  ];
  return `// Generated from ${GO_RELEASE} src/unicode/tables.go (Unicode ${UNICODE_VERSION}).\n\n${lines.join("\n")}`;
}

function caseFile(): string {
  const start = source.indexOf("var _CaseRanges = []CaseRange{");
  const end = source.indexOf("\n}\n", start + 20);
  const block = source.slice(start, end);
  const cases = [...block.matchAll(/\{0x([0-9a-fA-F]+), 0x([0-9a-fA-F]+), d\{([^}]+)\}\}/g)]
    .map((match) => {
      const deltas = match[3].split(",").map((value) => {
        const trimmed = value.trim();
        return trimmed === "UpperLower" ? "UpperLower" : String(Number(trimmed));
      });
      return `  [${hex(Number.parseInt(match[1], 16))}, ${hex(Number.parseInt(match[2], 16))}, [${deltas.join(", ")}]],`;
    });

  const asciiStart = source.indexOf("var asciiFold = [MaxASCII + 1]uint16{");
  const asciiEnd = source.indexOf("\n}\n", asciiStart + 20);
  const ascii = [...source.slice(asciiStart, asciiEnd).matchAll(/^\t0x([0-9a-fA-F]+),$/gm)]
    .map((match) => `  ${hex(Number.parseInt(match[1], 16))},`);

  const orbitStart = source.indexOf("var caseOrbit = []foldPair{");
  const orbitEnd = source.indexOf("\n}\n", orbitStart + 20);
  const orbit = [...source.slice(orbitStart, orbitEnd).matchAll(/\{0x([0-9a-fA-F]+), 0x([0-9a-fA-F]+)\}/g)]
    .map((match) => `  [${hex(Number.parseInt(match[1], 16))}, ${hex(Number.parseInt(match[2], 16))}],`);

  return [
    `// Generated from ${GO_RELEASE} src/unicode/tables.go (Unicode ${UNICODE_VERSION}).`,
    "",
    "export const UpperLower = 0x10ffff + 1;",
    "",
    "export const CaseRanges = [",
    ...cases,
    "];",
    "",
    "export const AsciiFold = [",
    ...ascii,
    "];",
    "",
    "export const CaseOrbit: Array<number[]> = [",
    ...orbit,
    "];",
    "",
  ].join("\n");
}

function latin1File(): string {
  const start = source.indexOf("var properties = [MaxLatin1 + 1]uint8{");
  const end = source.indexOf("\n}\n", start + 20);
  const block = source.slice(start, end);
  const entries = [...block.matchAll(/^\t0x([0-9a-fA-F]{2}): ([^,]+),\s*\/\/ (.*)$/gm)];
  if (entries.length !== 256) {
    throw new Error(`expected 256 Latin-1 properties, got ${entries.length}`);
  }
  const lines = entries.map((match) => {
    const value = match[2].trim();
    return `  ${value}, // ${match[3]}`;
  });

  return `// Generated from ${GO_RELEASE} src/unicode/tables.go (Unicode ${UNICODE_VERSION}).

export const pC = 1 << 0; // a control character.
export const pP = 1 << 1; // a punctuation character.
export const pN = 1 << 2; // a numeral.
export const pS = 1 << 3; // a symbolic character.
export const pZ = 1 << 4; // a spacing character.
export const pLu = 1 << 5; // an upper-case letter.
export const pLl = 1 << 6; // a lower-case letter.
export const pp = 1 << 7; // a printable character according to Go's definition.
export const pg = pp | pZ; // a graphical character according to the Unicode definition.
export const pLo = pLl | pLu; // a letter that is neither upper nor lower case.
export const pLmask = pLo;

export const latin1 = [
${lines.join("\n")}
];

const LINEAR_MAX = 18;

export function is16(v: Array<number[]>, char: number) {
  if (v.length <= LINEAR_MAX || char <= 255) {
    for (const range of v) {
      const [l, h, stride] = range;
      if (l <= char && char <= h) {
        return stride === 1 || (char - l) % stride === 0;
      }
    }

    return false;
  }

  let lo = 0,
    hi = v.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const range = v[mid];
    const [l, h, stride] = range;
    if (l <= char && char <= h) {
      return stride === 1 || (char - l) % stride === 0;
    }
    if (char < l) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return false;
}

export function is32(v: Array<number[]>, char: number) {
  if (v.length <= LINEAR_MAX) {
    for (const range of v) {
      const [l, h, stride] = range;
      if (l <= char && char <= h) {
        return stride === 1 || (char - l) % stride === 0;
      }
    }

    return false;
  }

  let lo = 0,
    hi = v.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const range = v[mid];
    const [l, h, stride] = range;
    if (l <= char && char <= h) {
      return stride === 1 || (char - l) % stride === 0;
    }
    if (char < l) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return false;
}
`;
}

const outputs = new Map<string, string>([
  ["l.ts", rangeFile("L", "_L", false)],
  ["lu.ts", rangeFile("Lu", "_Lu", false)],
  ["ll.ts", rangeFile("Ll", "_Ll", false)],
  ["nd.ts", rangeFile("Nd", "_Nd", false)],
  ["p.ts", rangeFile("P", "_P", false)],
  ["s.ts", rangeFile("S", "_S", false)],
  ["case.ts", caseFile()],
  ["latin1.ts", latin1File()],
]);

const root = join(import.meta.dir, "../..");
const tableDir = join(root, "std/jsr/chars/tables");
let different = 0;

for (const [name, content] of outputs) {
  const path = join(tableDir, name);
  const current = readFileSync(path, "utf8");
  if (current === content) {
    console.log(`unchanged ${name}`);
    continue;
  }
  different++;
  if (check) {
    console.error(`different ${name}`);
  } else {
    writeFileSync(path, content);
    console.log(`wrote ${name}`);
  }
}

if (check && different > 0) {
  throw new Error(`${different} table file(s) differ from ${GO_RELEASE}`);
}
