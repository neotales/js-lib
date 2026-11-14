import { deepStrictEqual as equal, ok, throws } from "@neotales/assert";
import { test } from "@neotales/test";
import { ReadOnlySlice, Slice } from "./slice.ts";

// =============================================================================
// Slice Tests
// =============================================================================

test("slices::Slice constructor creates slice with default offset", () => {
  const arr = [1, 2, 3, 4];
  const slice = new Slice(arr);
  equal(4, slice.length);
  equal(1, slice.at(0));
});

test("slices::Slice constructor creates slice with offset", () => {
  const arr = [1, 2, 3, 4];
  const slice = new Slice(arr, 1);
  equal(3, slice.length);
  equal(2, slice.at(0));
});

test("slices::Slice constructor creates slice with offset and length", () => {
  const arr = [1, 2, 3, 4, 5];
  const slice = new Slice(arr, 1, 3);
  equal(3, slice.length);
  equal(2, slice.at(0));
  equal(3, slice.at(1));
  equal(4, slice.at(2));
});

test("slices::Slice constructor throws on invalid offset", () => {
  const arr = [1, 2, 3];
  throws(() => new Slice(arr, -1));
  throws(() => new Slice(arr, 4));
});

test("slices::Slice constructor throws on invalid length", () => {
  const arr = [1, 2, 3];
  throws(() => new Slice(arr, 0, -1));
  throws(() => new Slice(arr, 0, 5));
  throws(() => new Slice(arr, 1, 4)); // offset + length > array length
});

test("slices::Slice.length gets correct length", () => {
  const slice = new Slice([1, 2, 3], 1);
  equal(2, slice.length);
});

test("slices::Slice.length with explicit length parameter", () => {
  const slice = new Slice([1, 2, 3, 4, 5], 1, 2);
  equal(2, slice.length);
});

test("slices::Slice.isEmpty returns true for empty slice", () => {
  const slice = new Slice([], 0);
  ok(slice.isEmpty);
});

test("slices::Slice.isEmpty returns false for non-empty slice", () => {
  const slice = new Slice([1, 2, 3], 0);
  ok(!slice.isEmpty);
});

test("slices::Slice.at gets element at index", () => {
  const slice = new Slice([1, 2, 3], 1);
  equal(2, slice.at(0));
  equal(3, slice.at(1));
});

test("slices::Slice.at throws on negative index", () => {
  const slice = new Slice([1, 2, 3], 0);
  throws(() => slice.at(-1));
});

test("slices::Slice.at throws on out of bounds index", () => {
  const slice = new Slice([1, 2, 3], 0);
  throws(() => slice.at(3));
  throws(() => slice.at(100));
});

test("slices::Slice.set updates element at index", () => {
  const arr = [1, 2, 3];
  const slice = new Slice(arr, 1);
  slice.set(0, 5);
  equal(5, arr[1]);
});

test("slices::Slice.set returns this for chaining", () => {
  const arr = [1, 2, 3, 4];
  const slice = new Slice(arr, 0);
  const result = slice.set(0, 10).set(1, 20);
  equal(result, slice);
  equal(10, arr[0]);
  equal(20, arr[1]);
});

test("slices::Slice.set throws on invalid index", () => {
  const slice = new Slice([1, 2, 3], 0);
  throws(() => slice.set(-1, 0));
  throws(() => slice.set(3, 0));
});

test("slices::Slice.update updates multiple elements", () => {
  const arr = [1, 2, 3, 4];
  const slice = new Slice(arr, 1);
  slice.update(0, [5, 6]);
  equal(5, arr[1]);
  equal(6, arr[2]);
});

test("slices::Slice.update returns this for chaining", () => {
  const arr = [1, 2, 3, 4, 5];
  const slice = new Slice(arr, 0);
  const result = slice.update(0, [10, 20]);
  equal(result, slice);
});

test("slices::Slice.update throws on invalid index", () => {
  const slice = new Slice([1, 2, 3], 0);
  throws(() => slice.update(-1, [1]));
  throws(() => slice.update(3, [1]));
});

test("slices::Slice.map transforms elements", () => {
  const slice = new Slice([1, 2, 3], 1);
  const mapped = slice.map((x) => x * 2);
  equal(4, mapped.at(0));
  equal(6, mapped.at(1));
});

test("slices::Slice.map creates new slice without modifying original", () => {
  const arr = [1, 2, 3];
  const slice = new Slice(arr, 0);
  const mapped = slice.map((x) => x * 10);
  equal(1, arr[0]); // Original unchanged
  equal(10, mapped.at(0)); // New slice has transformed value
});

test("slices::Slice.map with index parameter", () => {
  const slice = new Slice([10, 20, 30], 0);
  const mapped = slice.map((value, index) => value + index);
  equal(10, mapped.at(0)); // 10 + 0
  equal(21, mapped.at(1)); // 20 + 1
  equal(32, mapped.at(2)); // 30 + 2
});

test("slices::Slice.indexOf finds element index", () => {
  const slice = new Slice([1, 2, 3], 1);
  equal(0, slice.indexOf(2));
  equal(1, slice.indexOf(3));
  equal(-1, slice.indexOf(4));
});

test("slices::Slice.indexOf returns -1 for element outside slice", () => {
  const slice = new Slice([1, 2, 3, 4], 1, 2); // [2, 3]
  equal(-1, slice.indexOf(1)); // 1 is not in slice
  equal(-1, slice.indexOf(4)); // 4 is not in slice
  equal(0, slice.indexOf(2));
});

test("slices::Slice.indexOf finds first occurrence", () => {
  const slice = new Slice([1, 2, 2, 3], 0);
  equal(1, slice.indexOf(2)); // Returns first occurrence
});

test("slices::Slice.slice creates sub-slice", () => {
  const slice = new Slice([1, 2, 3, 4], 1);
  const subSlice = slice.slice(1);
  equal(1, subSlice.length);
  equal(3, subSlice.at(0));
});

test("slices::Slice.slice with explicit length", () => {
  const slice = new Slice([1, 2, 3, 4, 5], 0);
  const subSlice = slice.slice(1, 2);
  equal(2, subSlice.length);
  equal(2, subSlice.at(0));
  equal(3, subSlice.at(1));
});

test("slices::Slice.slice throws on invalid start", () => {
  const slice = new Slice([1, 2, 3], 0);
  throws(() => slice.slice(-1));
  throws(() => slice.slice(3));
});

test("slices::Slice.slice shares underlying array", () => {
  const arr = [1, 2, 3, 4, 5];
  const slice = new Slice(arr, 0);
  const subSlice = slice.slice(1, 2);
  subSlice.set(0, 100);
  equal(100, arr[1]); // Original array is modified
});

test("slices::Slice.find finds matching element", () => {
  const slice = new Slice([1, 2, 3], 0);
  const found = slice.find((x) => x > 2);
  equal(3, found);
});

test("slices::Slice.find returns undefined when no match", () => {
  const slice = new Slice([1, 2, 3], 0);
  const found = slice.find((x) => x > 10);
  equal(undefined, found);
});

test("slices::Slice.find returns first matching element", () => {
  const slice = new Slice([1, 5, 10, 15], 0);
  const found = slice.find((x) => x > 3);
  equal(5, found);
});

test("slices::Slice.findIndex finds matching element index", () => {
  const slice = new Slice([1, 2, 3], 0);
  const index = slice.findIndex((x) => x > 2);
  equal(2, index);
});

test("slices::Slice.findIndex returns -1 when no match", () => {
  const slice = new Slice([1, 2, 3], 0);
  const index = slice.findIndex((x) => x > 10);
  equal(-1, index);
});

test("slices::Slice.findIndex with offset slice", () => {
  const slice = new Slice([1, 2, 3, 4, 5], 2); // [3, 4, 5]
  const index = slice.findIndex((x) => x > 3);
  equal(1, index); // Index relative to slice, not original array
});

test("slices::Slice.includes checks element existence", () => {
  const slice = new Slice([1, 2, 3], 1);
  ok(slice.includes(2));
  ok(!slice.includes(1));
});

test("slices::Slice.includes with object references", () => {
  const obj1 = { id: 1 };
  const obj2 = { id: 2 };
  const slice = new Slice([obj1, obj2], 0);
  ok(slice.includes(obj1));
  ok(slice.includes(obj2));
  ok(!slice.includes({ id: 1 })); // Different object reference
});

test("slices::Slice.reverse reverses elements in place", () => {
  const arr = [1, 2, 3, 4, 5];
  const slice = new Slice(arr, 1, 3); // [2, 3, 4]
  slice.reverse();
  equal(4, arr[1]);
  equal(3, arr[2]);
  equal(2, arr[3]);
  // Elements outside slice unchanged
  equal(1, arr[0]);
  equal(5, arr[4]);
});

test("slices::Slice.reverse returns this for chaining", () => {
  const arr = [1, 2, 3];
  const slice = new Slice(arr, 0);
  const result = slice.reverse();
  equal(result, slice);
});

test("slices::Slice.reverse with single element", () => {
  const arr = [1, 2, 3];
  const slice = new Slice(arr, 1, 1); // [2]
  slice.reverse();
  equal(2, arr[1]); // No change for single element
});

test("slices::Slice.reverse with two elements", () => {
  const arr = [1, 2, 3, 4];
  const slice = new Slice(arr, 1, 2); // [2, 3]
  slice.reverse();
  equal(3, arr[1]);
  equal(2, arr[2]);
});

test("slices::Slice iterator works with for...of", () => {
  const slice = new Slice([1, 2, 3, 4], 1, 2);
  const values: number[] = [];
  for (const value of slice) {
    values.push(value);
  }
  equal(2, values.length);
  equal(2, values[0]);
  equal(3, values[1]);
});

test("slices::Slice iterator works with spread operator", () => {
  const slice = new Slice([1, 2, 3, 4], 1, 2);
  const arr = [...slice];
  equal(2, arr.length);
  equal(2, arr[0]);
  equal(3, arr[1]);
});

// =============================================================================
// ReadOnlySlice Tests
// =============================================================================

test("slices::ReadOnlySlice provides read-only view", () => {
  const arr = [1, 2, 3];
  const slice = new ReadOnlySlice(arr, 1);
  equal(2, slice.length);
  equal(2, slice.at(0));
  equal(3, slice.at(1));
});

test("slices::ReadOnlySlice constructor with offset and length", () => {
  const arr = [1, 2, 3, 4, 5];
  const slice = new ReadOnlySlice(arr, 1, 3);
  equal(3, slice.length);
  equal(2, slice.at(0));
  equal(4, slice.at(2));
});

test("slices::ReadOnlySlice constructor throws on invalid offset", () => {
  const arr = [1, 2, 3];
  throws(() => new ReadOnlySlice(arr, -1));
  throws(() => new ReadOnlySlice(arr, 3));
});

test("slices::ReadOnlySlice constructor throws on invalid length", () => {
  const arr = [1, 2, 3];
  throws(() => new ReadOnlySlice(arr, 0, -1));
  throws(() => new ReadOnlySlice(arr, 0, 5));
});

test("slices::ReadOnlySlice.length gets correct length", () => {
  const slice = new ReadOnlySlice([1, 2, 3, 4], 1, 2);
  equal(2, slice.length);
});

test("slices::ReadOnlySlice.isEmpty returns true for empty slice", () => {
  const slice = new ReadOnlySlice([1, 2, 3], 0, 0);
  ok(slice.isEmpty);
});

test("slices::ReadOnlySlice.isEmpty returns false for non-empty slice", () => {
  const slice = new ReadOnlySlice([1, 2, 3], 0);
  ok(!slice.isEmpty);
});

test("slices::ReadOnlySlice.at gets element at index", () => {
  const slice = new ReadOnlySlice([10, 20, 30, 40], 1, 2);
  equal(20, slice.at(0));
  equal(30, slice.at(1));
});

test("slices::ReadOnlySlice.at throws on invalid index", () => {
  const slice = new ReadOnlySlice([1, 2, 3], 0);
  throws(() => slice.at(-1));
  throws(() => slice.at(3));
});

test("slices::ReadOnlySlice.indexOf finds element", () => {
  const slice = new ReadOnlySlice([1, 2, 3, 4], 1); // [2, 3, 4]
  equal(0, slice.indexOf(2));
  equal(2, slice.indexOf(4));
  equal(-1, slice.indexOf(1)); // Not in slice
});

test("slices::ReadOnlySlice.indexOf returns -1 for not found", () => {
  const slice = new ReadOnlySlice([1, 2, 3], 0);
  equal(-1, slice.indexOf(99));
});

test("slices::ReadOnlySlice.slice creates sub-slice", () => {
  const slice = new ReadOnlySlice([1, 2, 3, 4, 5], 0);
  const sub = slice.slice(1, 3);
  equal(3, sub.length);
  equal(2, sub.at(0));
  equal(4, sub.at(2));
});

test("slices::ReadOnlySlice.slice throws on invalid start", () => {
  const slice = new ReadOnlySlice([1, 2, 3], 0);
  throws(() => slice.slice(-1));
  throws(() => slice.slice(3));
});

test("slices::ReadOnlySlice.includes checks element existence", () => {
  const slice = new ReadOnlySlice([1, 2, 3, 4], 1); // [2, 3, 4]
  ok(slice.includes(2));
  ok(slice.includes(4));
  ok(!slice.includes(1)); // Not in slice
  ok(!slice.includes(99)); // Does not exist
});

test("slices::ReadOnlySlice iterator works with for...of", () => {
  const slice = new ReadOnlySlice([1, 2, 3, 4], 1, 2);
  const values: number[] = [];
  for (const value of slice) {
    values.push(value);
  }
  equal(2, values.length);
  equal(2, values[0]);
  equal(3, values[1]);
});

test("slices::ReadOnlySlice iterator works with spread operator", () => {
  const slice = new ReadOnlySlice([1, 2, 3, 4], 1, 2);
  const arr = [...slice];
  equal(2, arr.length);
  equal(2, arr[0]);
  equal(3, arr[1]);
});
