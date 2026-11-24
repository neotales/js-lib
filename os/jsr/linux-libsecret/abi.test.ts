import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  copyExactBytes,
  detectPointerWidth,
  readGSize,
  require64Bit,
  requireLittleEndian64,
  widthFromArch,
  widthFromByteSize,
} from "./abi.ts";

function expectError(fn: () => unknown, pattern: RegExp): void {
  try {
    fn();
  } catch (error) {
    ok(error instanceof Error);
    ok(pattern.test(error.message), error.message);
    return;
  }
  throw new Error("expected an error");
}

test("linux-libsecret abi maps known architectures", () => {
  equal(widthFromArch("x86_64"), 64);
  equal(widthFromArch("aarch64"), 64);
  equal(widthFromArch("x64"), 64);
  equal(widthFromArch("ia32"), 32);
  equal(widthFromArch("armv7"), 32);
  equal(widthFromArch("mips64"), null);
  const detected = detectPointerWidth();
  if (detected === null) {
    expectError(() => require64Bit(detected), /verified 64-bit/);
  } else {
    equal(detected, 64);
  }
});

test("linux-libsecret abi maps FFI byte sizes", () => {
  equal(widthFromByteSize(8), 64);
  equal(widthFromByteSize(4), 32);
  equal(widthFromByteSize(undefined), null);
  equal(widthFromByteSize(16), null);
});

test("linux-libsecret abi requires little-endian 64-bit", () => {
  equal(requireLittleEndian64(64, "little"), 64);
  expectError(() => requireLittleEndian64(64, "big"), /little-endian/);
  expectError(() => requireLittleEndian64(64, null), /little-endian/);
  expectError(() => requireLittleEndian64(32, "little"), /64-bit/);
});

test("linux-libsecret abi refuses an unknown or 32-bit width", () => {
  expectError(() => require64Bit(null), /verified 64-bit/);
  expectError(() => require64Bit(32), /verified 64-bit/);
  equal(require64Bit(64), 64);
});

test("linux-libsecret abi reads an exact gsize", () => {
  const buffer = new Uint8Array(8);
  new DataView(buffer.buffer).setBigUint64(0, 7n, true);
  equal(readGSize(buffer, 64), 7);
  new DataView(buffer.buffer).setBigUint64(0, 0xffffffffffffffffn, true);
  expectError(() => readGSize(buffer, 64), /MAX_SAFE_INTEGER/);
});

test("linux-libsecret abi copies exact bytes without a terminator", () => {
  const source = new Uint8Array([0x41, 0x00, 0x42]);
  const copy = copyExactBytes(source.length, (index) => source[index]);
  equal([...copy], [0x41, 0x00, 0x42]);
  equal([...copyExactBytes(0, () => {
    throw new Error("read past zero length");
  })], []);
});

test("linux-libsecret abi rejects invalid lengths", () => {
  expectError(() => copyExactBytes(-1, () => 0), /invalid secret length/);
  expectError(() => copyExactBytes(1.5, () => 0), /invalid secret length/);
  expectError(() => copyExactBytes(0x80000000, () => 0), /invalid secret length/);
});
