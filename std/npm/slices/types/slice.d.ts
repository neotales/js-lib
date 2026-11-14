/**
 * The Slice module includes the Slice class which provides
 * a mutable view of an array. The Slice class allows you to
 * create a slice of an array, modify the elements in the slice,
 * and iterate over the elements in the slice without copying the array.
 *
 * The ReadOnlySlice class provides a read-only view of the array
 * where you can view the elements in the slice but not modify them.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { Slice, ReadOnlySlice } from '@neotales/slices';
 *
 * // Create a mutable slice
 * const arr = [1, 2, 3, 4, 5];
 * const slice = new Slice(arr, 1, 3); // [2, 3, 4]
 * slice.set(0, 10);
 * console.log(arr); // [1, 10, 3, 4, 5]
 *
 * // Create a read-only slice
 * const roSlice = new ReadOnlySlice(arr, 0, 2);
 * console.log(roSlice.at(0)); // 1
 * ```
 */
/**
 * A mutable slice of an array. The slice is a view of the array
 * and the array is not copied.
 *
 * @typeParam T - The type of elements in the slice.
 *
 * @experimental
 * API is experimental and subject to change.
 *
 * @example
 * ```typescript
 * import { Slice } from '@neotales/slices';
 *
 * const arr = [1, 2, 3, 4, 5];
 * const slice = new Slice(arr, 1, 3);
 * console.log(slice.at(0)); // 2
 * slice.set(0, 10);
 * console.log(arr[1]); // 10 (original array is modified)
 * ```
 */
export declare class Slice<T> implements Iterable<T> {
    #private;
    /**
     * Creates a new instance of the Slice class.
     *
     * @param set - The array to create a slice from.
     * @param offset - The starting index of the slice. Defaults to `0`.
     * @param length - The length of the slice. Defaults to `set.length - offset`.
     * @throws {RangeError} If offset is negative or greater than or equal to the array length.
     * @throws {RangeError} If length is negative or extends beyond the array bounds.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const arr = [1, 2, 3, 4, 5];
     *
     * // Slice from index 1 with length 3
     * const slice1 = new Slice(arr, 1, 3);
     * console.log([...slice1]); // [2, 3, 4]
     *
     * // Slice from index 2 to end
     * const slice2 = new Slice(arr, 2);
     * console.log([...slice2]); // [3, 4, 5]
     *
     * // Full array slice
     * const slice3 = new Slice(arr);
     * console.log([...slice3]); // [1, 2, 3, 4, 5]
     * ```
     */
    constructor(set: Array<T>, offset?: number, length?: number);
    /**
     * Gets the length of the slice.
     */
    get length(): number;
    /**
     * Gets a value indicating whether the slice is empty.
     */
    get isEmpty(): boolean;
    /**
     * Gets the element at the specified index.
     *
     * @param index - The zero-based index of the element to get.
     * @returns The element at the specified index.
     * @throws {RangeError} If the index is less than 0 or greater than or equal to the length of the slice.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const slice = new Slice([10, 20, 30, 40], 1, 2);
     * console.log(slice.at(0)); // 20
     * console.log(slice.at(1)); // 30
     * ```
     */
    at(index: number): T;
    /**
     * Sets the element at the specified index. This modifies the underlying array.
     *
     * @param index - The zero-based index of the element to set.
     * @param value - The value to set at the specified index.
     * @returns The current `Slice` instance for chaining.
     * @throws {RangeError} If the index is less than 0 or greater than or equal to the length of the slice.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const arr = [1, 2, 3, 4];
     * const slice = new Slice(arr, 1, 2);
     * slice.set(0, 100).set(1, 200);
     * console.log(arr); // [1, 100, 200, 4]
     * ```
     */
    set(index: number, value: T): this;
    /**
     * Updates multiple elements starting at the specified index with the provided values.
     * This modifies the underlying array.
     *
     * @param index - The zero-based starting index for the update.
     * @param value - The array of values to write starting at the index.
     * @returns The current `Slice` instance for chaining.
     * @throws {RangeError} If the index is less than 0 or greater than or equal to the length of the slice.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const arr = [1, 2, 3, 4, 5];
     * const slice = new Slice(arr, 1, 3);
     * slice.update(0, [10, 20]);
     * console.log(arr); // [1, 10, 20, 4, 5]
     * ```
     */
    update(index: number, value: T[]): this;
    /**
     * Creates a new slice with the results of calling a provided function
     * on every element in this slice.
     *
     * A new array is allocated because the operation transforms values
     * and needs a new container to store the results.
     *
     * @typeParam U - The type of elements in the resulting slice.
     * @param callbackfn - The function to apply to each element.
     *   - `value`: The current element being processed.
     *   - `index`: The index of the current element within the slice.
     *   - `set`: The underlying array.
     * @returns A new `Slice` containing the transformed elements.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const slice = new Slice([1, 2, 3, 4], 1, 2);
     * const doubled = slice.map((x) => x * 2);
     * console.log([...doubled]); // [4, 6]
     * ```
     */
    map<U>(callbackfn: (value: T, index: number, set: Array<T>) => U): Slice<U>;
    /**
     * Gets the index of the first occurrence of a specified value in the slice.
     *
     * @param value - The value to search for.
     * @returns The zero-based index of the first occurrence of the value in the slice,
     *   or `-1` if the value is not found.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const slice = new Slice([10, 20, 30, 20], 0);
     * console.log(slice.indexOf(20)); // 1
     * console.log(slice.indexOf(40)); // -1
     * ```
     */
    indexOf(value: T): number;
    /**
     * Creates a new slice that contains a subset of the elements of the current slice.
     * The new slice is still a view of the same underlying array.
     *
     * @param start - The zero-based start index of the new slice.
     * @param end - The length of the new slice. If not provided, extends to the end of the current slice.
     * @returns A new `Slice` that contains a subset of the elements.
     * @throws {RangeError} If the start index is less than 0 or greater than or equal to the length of the slice.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const slice = new Slice([1, 2, 3, 4, 5], 0);
     * const sub = slice.slice(1, 3);
     * console.log([...sub]); // [2, 3, 4]
     *
     * const rest = slice.slice(2);
     * console.log([...rest]); // [3, 4, 5]
     * ```
     */
    slice(start: number, end?: number): Slice<T>;
    /**
     * Finds the first element in the slice that satisfies the provided predicate function.
     *
     * @param predicate - The function to test each element.
     *   - `value`: The current element being tested.
     *   - `index`: The index of the current element.
     *   - `set`: The underlying array.
     * @returns The first element that passes the test, or `undefined` if no element passes.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const slice = new Slice([1, 5, 10, 15], 0);
     * const found = slice.find((x) => x > 7);
     * console.log(found); // 10
     *
     * const notFound = slice.find((x) => x > 100);
     * console.log(notFound); // undefined
     * ```
     */
    find(predicate: (value: T, index: number, set: Array<T>) => boolean): T | undefined;
    /**
     * Finds the index of the first element in the slice that satisfies the provided predicate function.
     *
     * @param predicate - The function to test each element.
     *   - `value`: The current element being tested.
     *   - `index`: The index of the current element.
     *   - `set`: The underlying array.
     * @returns The zero-based index of the first element that passes the test,
     *   or `-1` if no element passes.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const slice = new Slice([1, 5, 10, 15], 0);
     * const index = slice.findIndex((x) => x > 7);
     * console.log(index); // 2
     *
     * const notFound = slice.findIndex((x) => x > 100);
     * console.log(notFound); // -1
     * ```
     */
    findIndex(predicate: (value: T, index: number, set: Array<T>) => boolean): number;
    /**
     * Determines whether the slice includes a specified value.
     *
     * @param value - The value to search for.
     * @returns `true` if the slice contains the specified value; otherwise, `false`.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const slice = new Slice([1, 2, 3, 4], 1); // [2, 3, 4]
     * console.log(slice.includes(2)); // true
     * console.log(slice.includes(1)); // false (1 is not in the slice)
     * ```
     */
    includes(value: T): boolean;
    /**
     * Reverses the order of the elements in the slice in-place.
     * This modifies the underlying array.
     *
     * @returns The current `Slice` instance for chaining.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const arr = [1, 2, 3, 4, 5];
     * const slice = new Slice(arr, 1, 3); // [2, 3, 4]
     * slice.reverse();
     * console.log(arr); // [1, 4, 3, 2, 5]
     * ```
     */
    reverse(): this;
    /**
     * Returns an iterator that allows you to iterate over the elements of the slice.
     *
     * @returns An iterator for the elements in the slice.
     *
     * @example
     * ```typescript
     * import { Slice } from '@neotales/slices';
     *
     * const slice = new Slice([1, 2, 3, 4], 1, 2);
     * for (const value of slice) {
     *   console.log(value);
     * }
     * // Output:
     * // 2
     * // 3
     *
     * // Or spread into an array
     * console.log([...slice]); // [2, 3]
     * ```
     */
    [Symbol.iterator](): Iterator<T>;
}
/**
 * A read-only slice of an array. The slice is a view of the array
 * and the array is not copied. Unlike `Slice`, this class does not
 * provide methods to modify the underlying array.
 *
 * @typeParam T - The type of elements in the slice.
 *
 * @example
 * ```typescript
 * import { ReadOnlySlice } from '@neotales/slices';
 *
 * const arr = [1, 2, 3, 4, 5];
 * const slice = new ReadOnlySlice(arr, 1, 3);
 * console.log(slice.at(0)); // 2
 * console.log(slice.length); // 3
 * ```
 */
export declare class ReadOnlySlice<T> implements Iterable<T> {
    #private;
    /**
     * Creates a new instance of the ReadOnlySlice class.
     *
     * @param set - The array to create a read-only slice from.
     * @param offset - The starting index of the slice. Defaults to `0`.
     * @param length - The length of the slice. Defaults to `set.length - offset`.
     * @throws {RangeError} If offset is negative or greater than or equal to the array length.
     * @throws {RangeError} If length is negative or extends beyond the array bounds.
     *
     * @example
     * ```typescript
     * import { ReadOnlySlice } from '@neotales/slices';
     *
     * const arr = [1, 2, 3, 4, 5];
     * const slice = new ReadOnlySlice(arr, 1, 3); // View of [2, 3, 4]
     * console.log([...slice]); // [2, 3, 4]
     * ```
     */
    constructor(set: Array<T>, offset?: number, length?: number);
    /**
     * Gets the length of the slice (number of elements).
     *
     * @example
     * ```typescript
     * import { ReadOnlySlice } from '@neotales/slices';
     *
     * const slice = new ReadOnlySlice([1, 2, 3, 4], 1, 2);
     * console.log(slice.length); // 2
     * ```
     */
    get length(): number;
    /**
     * Gets a value indicating whether the slice is empty.
     *
     * @example
     * ```typescript
     * import { ReadOnlySlice } from '@neotales/slices';
     *
     * const slice = new ReadOnlySlice([1, 2, 3], 0, 0);
     * console.log(slice.isEmpty); // true
     * ```
     */
    get isEmpty(): boolean;
    /**
     * Returns an iterator that allows you to iterate over the elements of the slice.
     *
     * @returns An iterator for the elements in the slice.
     *
     * @example
     * ```typescript
     * import { ReadOnlySlice } from '@neotales/slices';
     *
     * const slice = new ReadOnlySlice([1, 2, 3, 4], 1, 2);
     * for (const value of slice) {
     *   console.log(value);
     * }
     * // Output:
     * // 2
     * // 3
     * ```
     */
    [Symbol.iterator](): Iterator<T>;
    /**
     * Gets the element at the specified index.
     *
     * @param index - The zero-based index of the element to get.
     * @returns The element at the specified index.
     * @throws {RangeError} If the index is less than 0 or greater than or equal to the length of the slice.
     *
     * @example
     * ```typescript
     * import { ReadOnlySlice } from '@neotales/slices';
     *
     * const slice = new ReadOnlySlice([10, 20, 30, 40], 1, 2);
     * console.log(slice.at(0)); // 20
     * console.log(slice.at(1)); // 30
     * ```
     */
    at(index: number): T;
    /**
     * Gets the index of the first occurrence of a specified value in the slice.
     *
     * @param value - The value to search for.
     * @returns The zero-based index of the first occurrence of the value,
     *   or `-1` if the value is not found.
     *
     * @example
     * ```typescript
     * import { ReadOnlySlice } from '@neotales/slices';
     *
     * const slice = new ReadOnlySlice([10, 20, 30, 20], 0);
     * console.log(slice.indexOf(20)); // 1
     * console.log(slice.indexOf(40)); // -1
     * ```
     */
    indexOf(value: T): number;
    /**
     * Creates a new read-only slice that contains a subset of the elements of the current slice.
     * The new slice is still a view of the same underlying array.
     *
     * @param start - The zero-based start index of the new slice.
     * @param end - The length of the new slice. If not provided, extends to the end of the current slice.
     * @returns A new `ReadOnlySlice` that contains a subset of the elements.
     * @throws {RangeError} If the start index is less than 0 or greater than or equal to the length.
     *
     * @example
     * ```typescript
     * import { ReadOnlySlice } from '@neotales/slices';
     *
     * const slice = new ReadOnlySlice([1, 2, 3, 4, 5], 0);
     * const sub = slice.slice(1, 3);
     * console.log([...sub]); // [2, 3, 4]
     *
     * const rest = slice.slice(2);
     * console.log([...rest]); // [3, 4, 5]
     * ```
     */
    slice(start: number, end?: number): ReadOnlySlice<T>;
    /**
     * Determines whether the slice includes a specified value.
     *
     * @param value - The value to search for.
     * @returns `true` if the slice contains the specified value; otherwise, `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlySlice } from '@neotales/slices';
     *
     * const slice = new ReadOnlySlice([1, 2, 3, 4], 1); // [2, 3, 4]
     * console.log(slice.includes(2)); // true
     * console.log(slice.includes(1)); // false
     * ```
     */
    includes(value: T): boolean;
}
export declare function slice<T>(array: Array<T>, offset?: number, length?: number): Slice<T>;
export declare function readOnlySlice<T>(array: Array<T>, offset?: number, length?: number): ReadOnlySlice<T>;
