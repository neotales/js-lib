import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { assertText, decodeSecretText, decodeUtf8 } from "./encoding.ts";

function expectRangeError(fn: () => unknown, pattern: RegExp): void {
  try {
    fn();
  } catch (error) {
    ok(error instanceof RangeError);
    ok(pattern.test(error.message), error.message);
    return;
  }
  throw new Error("expected a RangeError");
}

test("linux-libsecret encoding rejects NUL in text", () => {
  expectRangeError(() => assertText("service", "a\0b"), /NUL/);
  expectRangeError(() => assertText("account", "\0"), /NUL/);
});

test("linux-libsecret encoding rejects unpaired surrogates", () => {
  expectRangeError(() => assertText("service", "\ud800"), /unpaired surrogate/);
  expectRangeError(() => assertText("account", "\udc00"), /unpaired surrogate/);
  assertText("service", "service-\ud83d\ude00");
});

test("linux-libsecret encoding accepts ordinary UTF-8 text", () => {
  if (typeof TextDecoder === "undefined") return;
  assertText("service", "こんにちは");
  equal(decodeSecretText(new TextEncoder().encode("こんにちは")), "こんにちは");
});

test("linux-libsecret encoding preserves a UTF-8 BOM", () => {
  if (typeof TextDecoder === "undefined") return;
  const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x41]);
  const text = decodeUtf8(bytes);
  equal(text, "\ufeffA");
  equal(decodeSecretText(bytes), "\ufeffA");
  equal([...new TextEncoder().encode(text)], [0xef, 0xbb, 0xbf, 0x41]);
});

test("linux-libsecret encoding rejects invalid UTF-8 and NUL bytes", () => {
  if (typeof TextDecoder === "undefined") return;
  expectRangeError(() => decodeSecretText(new Uint8Array([0xff])), /valid UTF-8/);
  expectRangeError(() => decodeSecretText(new Uint8Array([0x41, 0x00])), /NUL/);
});
