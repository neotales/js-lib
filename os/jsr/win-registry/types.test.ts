import { deepStrictEqual as deepEqual, equal } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  multiStringToWide,
  stringToWide,
  wideToMultiString,
  wideToString,
} from "./types.ts";

test("wideToString decodes ASCII and non-BMP text", () => {
  const text = "A😀𐀀Z";
  equal(wideToString(stringToWide(text)), text);
});

test("wideToString stops at the first UTF-16 null terminator", () => {
  const buf = new Uint8Array(16);
  const text = stringToWide("Theme");
  buf.set(text);
  buf.set([0x41, 0x00], text.length);
  equal(wideToString(buf), "Theme");
});

test("wideToString replaces odd trailing bytes and lone surrogates", () => {
  equal(wideToString(new Uint8Array([0x41])), "\uFFFD");
  equal(wideToString(new Uint8Array([0x41, 0x00, 0x42])), "A\uFFFD");
  equal(wideToString(new Uint8Array([0x00, 0xd8])), "\uFFFD");
  equal(wideToString(new Uint8Array([0x00, 0xdc])), "\uFFFD");
  equal(wideToString(new Uint8Array([0x00, 0xd8, 0x41])), "\uFFFD");
  equal(wideToString(new Uint8Array([0x00, 0xd8, 0x41, 0x00])), "\uFFFDA");
  equal(wideToString(new Uint8Array([0x00, 0xd8, 0x00, 0xdc])), "𐀀");
});

test("wideToString removes one leading UTF-16LE BOM", () => {
  equal(wideToString(new Uint8Array([0xff, 0xfe, 0x41, 0x00])), "A");
  equal(wideToString(new Uint8Array([0xff, 0xfe])), "");
});

test("wideToMultiString preserves UTF-16LE entries and non-BMP text", () => {
  const values = ["one", "two😀𐀀", "three"];
  deepEqual(wideToMultiString(multiStringToWide(values)), values);
});

test("wideToMultiString strips a BOM from each entry", () => {
  const bytes = new Uint8Array([
    0xff, 0xfe, 0x41, 0x00, 0x00, 0x00,
    0xff, 0xfe, 0x42, 0x00, 0x00, 0x00,
    0x00, 0x00,
  ]);
  deepEqual(wideToMultiString(bytes), ["A", "B"]);
});

test("wideToMultiString keeps an unterminated trailing entry", () => {
  const bytes = new Uint8Array([0x61, 0x00, 0x00, 0x00, 0x62, 0x00]);
  deepEqual(wideToMultiString(bytes), ["a", "b"]);
  const odd = new Uint8Array([0x61, 0x00, 0x00, 0x00, 0x62, 0x00, 0x41]);
  deepEqual(wideToMultiString(odd), ["a", "b\uFFFD"]);
});

function hasUtf16Reference(): boolean {
  try {
    return new TextDecoder("utf-16le").decode(new Uint8Array([0x41, 0x00])) === "A";
  } catch {
    return false;
  }
}

function referenceWideToString(buffer: Uint8Array): string {
  const decoded = new TextDecoder("utf-16le").decode(buffer);
  const nul = decoded.indexOf("\0");
  return nul < 0 ? decoded : decoded.slice(0, nul);
}

function referenceWideToMultiString(buffer: Uint8Array): string[] {
  const result: string[] = [];
  let start = 0;
  let terminated = false;
  for (let i = 0; i < buffer.length - 1; i += 2) {
    if (buffer[i] === 0 && buffer[i + 1] === 0) {
      if (i === start) {
        terminated = true;
        break;
      }
      result.push(new TextDecoder("utf-16le").decode(buffer.subarray(start, i)));
      start = i + 2;
    }
  }
  if (!terminated && start < buffer.length) {
    result.push(new TextDecoder("utf-16le").decode(buffer.subarray(start)));
  }
  return result;
}

test("string decoding matches independent TextDecoder fixtures", (t) => {
  if (!hasUtf16Reference()) t.skip("TextDecoder does not support utf-16le");

  const fixtures: Array<[string, number[]]> = [
    ["high surrogate plus odd byte", [0x00, 0xd8, 0x41]],
    ["odd ascii", [0x41]],
    ["odd after text", [0x41, 0x00, 0x42]],
    ["bom", [0xff, 0xfe, 0x41, 0x00]],
    ["high surrogate", [0x00, 0xd8]],
    ["low surrogate", [0x00, 0xdc]],
    ["high followed by non-low", [0x00, 0xd8, 0x41, 0x00]],
    ["valid surrogate pair", [0x00, 0xd8, 0x00, 0xdc]],
  ];
  for (const [name, values] of fixtures) {
    const bytes = new Uint8Array(values);
    equal(wideToString(bytes), referenceWideToString(bytes), name);
  }

  const multiFixtures: Array<[string, number[]]> = [
    ["bom per entry", [0xff, 0xfe, 0x41, 0x00, 0x00, 0x00, 0xff, 0xfe, 0x42, 0x00, 0x00, 0x00, 0x00, 0x00]],
    ["unterminated final entry", [0x61, 0x00, 0x00, 0x00, 0x62, 0x00]],
    ["unterminated final entry with odd byte", [0x61, 0x00, 0x00, 0x00, 0x62, 0x00, 0x41]],
    ["empty terminator", [0x00, 0x00]],
  ];
  for (const [name, values] of multiFixtures) {
    const bytes = new Uint8Array(values);
    deepEqual(wideToMultiString(bytes), referenceWideToMultiString(bytes), name);
  }
});

test("UTF-16LE decoding does not depend on TextDecoder", () => {
  const globals = globalThis as {
    TextDecoder?: typeof TextDecoder;
  };
  const original = globals.TextDecoder;
  try {
    delete globals.TextDecoder;
    equal(wideToString(stringToWide("Hello😀")), "Hello😀");
    deepEqual(wideToMultiString(multiStringToWide(["a", "b"])), ["a", "b"]);

    globals.TextDecoder = class {
      constructor(label?: string) {
        if (label === "utf-16le") throw new Error("utf-16le is unsupported");
      }
      decode(): string {
        throw new Error("TextDecoder.decode must not be called");
      }
    } as unknown as typeof TextDecoder;

    equal(wideToString(stringToWide("Theme")), "Theme");
    deepEqual(wideToMultiString(multiStringToWide(["one", "two"])), [
      "one",
      "two",
    ]);
  } finally {
    if (original === undefined) delete globals.TextDecoder;
    else globals.TextDecoder = original;
  }
});
