import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { readRegistryValue } from "./query_value.ts";
import { RegistryError } from "./registry_error.ts";
import {
  ERROR_ACCESS_DENIED,
  ERROR_FILE_NOT_FOUND,
  ERROR_MORE_DATA,
  ERROR_SUCCESS,
} from "./types.ts";

type Step = {
  status: number;
  type?: number;
  size?: number;
  bytes?: number[];
};

function sequence(steps: Step[]) {
  let calls = 0;
  return {
    call(data: Uint8Array, type: Uint8Array, size: Uint8Array): number {
      const step = steps[Math.min(calls, steps.length - 1)];
      calls++;
      if (step.type !== undefined) {
        new DataView(type.buffer).setUint32(0, step.type, true);
      }
      if (step.size !== undefined) {
        new DataView(size.buffer).setUint32(0, step.size, true);
      }
      if (step.bytes) data.set(step.bytes);
      return step.status;
    },
    calls: () => calls,
  };
}

test("readRegistryValue returns the exact bytes on the first success", () => {
  const fake = sequence([{ status: ERROR_SUCCESS, type: 1, size: 4, bytes: [1, 2, 3, 4] }]);
  const value = readRegistryValue(fake.call);
  ok(value);
  equal(value.type, 1);
  equal([...value.data], [1, 2, 3, 4]);
  equal(fake.calls(), 1);
});

test("readRegistryValue grows and retries after ERROR_MORE_DATA", () => {
  const fake = sequence([
    { status: ERROR_MORE_DATA, size: 8 },
    { status: ERROR_SUCCESS, type: 3, size: 6, bytes: [1, 2, 3, 4, 5, 6] },
  ]);
  const value = readRegistryValue(fake.call, 4);
  ok(value);
  equal(value.type, 3);
  equal([...value.data], [1, 2, 3, 4, 5, 6]);
  equal(fake.calls(), 2);
});

test("readRegistryValue honors a smaller size on the retry", () => {
  const fake = sequence([
    { status: ERROR_MORE_DATA, size: 8 },
    { status: ERROR_SUCCESS, type: 1, size: 3, bytes: [9, 8, 7, 6, 5, 4, 3, 2] },
  ]);
  const value = readRegistryValue(fake.call, 4);
  ok(value);
  equal([...value.data], [9, 8, 7]);
  equal(fake.calls(), 2);
});

test("readRegistryValue returns null only for a missing value", () => {
  const fake = sequence([{ status: ERROR_FILE_NOT_FOUND }]);
  equal(readRegistryValue(fake.call), null);
  equal(fake.calls(), 1);
});

test("readRegistryValue propagates an access-denied failure", () => {
  const fake = sequence([{ status: ERROR_ACCESS_DENIED }]);
  try {
    readRegistryValue(fake.call);
    throw new Error("expected RegistryError");
  } catch (error) {
    ok(error instanceof RegistryError);
  }
  equal(fake.calls(), 1);
});

test("readRegistryValue doubles capacity when an opened handle reports no size", () => {
  const fake = sequence([
    { status: ERROR_MORE_DATA, size: 0 },
    { status: ERROR_SUCCESS, type: 1, size: 5, bytes: [1, 2, 3, 4, 5] },
  ]);
  const value = readRegistryValue(fake.call, 4);
  ok(value);
  equal([...value.data], [1, 2, 3, 4, 5]);
  equal(fake.calls(), 2);
});

test("readRegistryValue ignores a bogus size for any handle", () => {
  const fake = sequence([
    { status: ERROR_MORE_DATA, size: 0xffffffff },
    { status: ERROR_SUCCESS, type: 1, size: 4, bytes: [1, 2, 3, 4] },
  ]);
  const value = readRegistryValue(fake.call, 4);
  ok(value);
  equal([...value.data], [1, 2, 3, 4]);
  equal(fake.calls(), 2);
});

test("readRegistryValue caps growth when a bogus size is reported", () => {
  const fake = sequence([{ status: ERROR_MORE_DATA, size: 0xffffffff }]);
  try {
    readRegistryValue(fake.call, 4, 24, 8);
    throw new Error("expected RegistryError");
  } catch (error) {
    ok(error instanceof RegistryError);
  }
  equal(fake.calls(), 2);
});

test("readRegistryValue stops at the capacity cap", () => {
  const fake = sequence([{ status: ERROR_MORE_DATA, size: 0 }]);
  try {
    readRegistryValue(fake.call, 4, 8, 8);
    throw new Error("expected RegistryError");
  } catch (error) {
    ok(error instanceof RegistryError);
  }
  equal(fake.calls(), 2);
});

test("readRegistryValue bounds repeated ERROR_MORE_DATA retries", () => {
  const fake = sequence([
    { status: ERROR_MORE_DATA, size: 2 },
    { status: ERROR_MORE_DATA, size: 3 },
    { status: ERROR_MORE_DATA, size: 4 },
  ]);
  try {
    readRegistryValue(fake.call, 1, 2);
    throw new Error("expected RegistryError");
  } catch (error) {
    ok(error instanceof RegistryError);
  }
  equal(fake.calls(), 3);
});
