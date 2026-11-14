import { type CharBuffer, type CharSequence, type CharSliceLike } from "./utils.js";
/**
 * A read-only slice of a character buffer.
 * The slice is a view of the buffer and the buffer is not copied.
 *
 * This is a specialized slice type for working with string characters in their
 * uint32 codepoint format and provide string like methods such as trim, indexof, toUpper,
 * toLower, includes, and more without the need to convert them back into strings to perform
 * those operations.
 *
 * @experimental
 * API is experimental and subject to change.
 */
export declare class ReadonlyCharSlice implements CharSequence, Iterable<number> {
    #private;
    /**
     * Creates a new instance of the ReadOnlyCharSlice class.
     * @param buffer The buffer to slice.
     * @param start The start index of the slice.
     * @param end The end index of the slice.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const buffer = new Uint32Array([72, 101, 108, 108, 111]); // "Hello"
     * const slice = new ReadOnlyCharSlice(buffer, 0, buffer.length);
     * console.log(slice.toString()); // Output: "Hello"
     * ```
     */
    constructor(buffer: Uint32Array, start?: number, end?: number);
    /**
     * Gets the length of the slice.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.length); // Output: 13
     * ```
     */
    get length(): number;
    /**
     * Gets a value indicating whether the slice is empty.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const emptySlice = ReadOnlyCharSlice.fromString("");
     * console.log(emptySlice.isEmpty); // Output: true
     */
    get isEmpty(): boolean;
    /**
     * Creates a `ReadOnlyCharSlice` from a string.
     * @param s The string to convert to a `ReadOnlyCharSlice`.
     * @returns The `ReadOnlyCharSlice` representation of the string.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.toString()); // Output: "Hello, World!"
     * ```
     */
    static fromString(s: string): ReadonlyCharSlice;
    /**
     * Returns an iterator that iterates over the elements of the slice.
     *
     * @returns An iterator for the code points in the slice.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello");
     * for (const char of slice) {
     *    console.log(String.fromCodePoint(char));
     * }
     * // Output:
     * // H
     * // e
     * // l
     * // l
     * // o
     * ```
     */
    [Symbol.iterator](): Iterator<number>;
    /**
     * Gets the element at the specified index.
     * @param index The index of the element to get.
     * @returns The element at the specified index.
     * @throws RangeError if the index is less than 0 or
     * greater than or equal to the length of the slice.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello");
     * console.log(String.fromCodePoint(slice.at(1))); // Output: "e"
     * ```
     */
    at(index: number): number;
    /**
     * Iterates over the elements of the slice and calls the callback function
     * for each element.
     *
     * @param callback - The callback function to call for each element.
     *   - `value`: The code point value at the current index.
     *   - `index`: The current index in the slice.
     * @returns The current `ReadOnlyCharSlice` instance for chaining.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello");
     * slice.forEach((value, index) => {
     *   console.log(`Index: ${index}, Char: ${String.fromCodePoint(value)}`);
     * });
     * // Output:
     * // Index: 0, Char: H
     * // Index: 1, Char: e
     * // Index: 2, Char: l
     * // Index: 3, Char: l
     * // Index: 4, Char: o
     * ```
     */
    forEach(callback: (value: number, index: number) => void): this;
    /**
     * Creates a new `ReadOnlyCharSlice` with the results of calling a provided
     * function on every element in this slice.
     *
     * @param callback - The callback function to call for each element.
     *   - `value`: The code point value at the current index.
     *   - `index`: The current index in the slice.
     * @returns A new `ReadOnlyCharSlice` with each element being the result of the callback function.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("hello");
     * // Convert each character to uppercase by subtracting 32 from lowercase ASCII
     * const upper = slice.map((value) => value >= 97 && value <= 122 ? value - 32 : value);
     * console.log(upper.toString()); // Output: "HELLO"
     * ```
     */
    map(callback: (value: number, index: number) => number): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with the first character converted to uppercase.
     *
     * @returns A new `ReadOnlyCharSlice` with the first character capitalized.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("hello world");
     * const capitalized = slice.captialize();
     * console.log(capitalized.toString()); // Output: "Hello world"
     * ```
     */
    captialize(): ReadonlyCharSlice;
    /**
     * Determines if the `ReadOnlyCharSlice` includes the given value.
     *
     * @param value - The character buffer to search for.
     * @param index - The index to start the search at. Defaults to `0`.
     * @returns `true` if the `ReadOnlyCharSlice` includes the given value; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.includes(ReadOnlyCharSlice.fromString("World"))); // Output: true
     * console.log(slice.includes(ReadOnlyCharSlice.fromString("world"))); // Output: false (case-sensitive)
     * console.log(slice.includes(ReadOnlyCharSlice.fromString("Hello"), 1)); // Output: false (starts after 'H')
     * ```
     */
    includes(value: CharBuffer, index?: number): boolean;
    /**
     * Determines if the `ReadOnlyCharSlice` includes the given value using
     * a case-insensitive comparison.
     *
     * @param value - The character buffer to search for.
     * @param index - The index to start the search at. Defaults to `0`.
     * @returns `true` if the `ReadOnlyCharSlice` includes the given value; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.includesFold(ReadOnlyCharSlice.fromString("WORLD"))); // Output: true
     * console.log(slice.includesFold(ReadOnlyCharSlice.fromString("hello"))); // Output: true
     * ```
     */
    includesFold(value: CharBuffer, index?: number): boolean;
    /**
     * Determines the index of the first occurrence of the given value
     * in the `ReadOnlyCharSlice`.
     *
     * @param value - The value to search for. Can be a `CharBuffer` or a single code point number.
     * @param index - The index to start the search at. Defaults to `0`.
     * @returns The index of the first occurrence of the given value, or `-1` if not found.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.indexOf(ReadOnlyCharSlice.fromString("World"))); // Output: 7
     * console.log(slice.indexOf(111)); // Output: 4 (code point for 'o')
     * console.log(slice.indexOf(ReadOnlyCharSlice.fromString("xyz"))); // Output: -1
     * ```
     */
    indexOf(value: CharBuffer | number, index?: number): number;
    /**
     * Determines the index of the first occurrence of the given value
     * in the `ReadOnlyCharSlice` using a case-insensitive comparison.
     *
     * @param value - The value to search for. Can be a `CharBuffer` or a single code point number.
     * @param index - The index to start the search at. Defaults to `0`.
     * @returns The index of the first occurrence of the given value, or `-1` if not found.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.indexOfFold(ReadOnlyCharSlice.fromString("WORLD"))); // Output: 7
     * console.log(slice.indexOfFold(ReadOnlyCharSlice.fromString("HELLO"))); // Output: 0
     * ```
     */
    indexOfFold(value: CharBuffer | number, index?: number): number;
    /**
     * Determines if the `ReadOnlyCharSlice` is equal to the given `CharBuffer`.
     *
     * @param other - The other `CharBuffer` to compare.
     * @returns `true` if the two `CharBuffer`s are equal; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice1 = ReadOnlyCharSlice.fromString("Hello");
     * const slice2 = ReadOnlyCharSlice.fromString("Hello");
     * const slice3 = ReadOnlyCharSlice.fromString("hello");
     *
     * console.log(slice1.equals(slice2)); // Output: true
     * console.log(slice1.equals(slice3)); // Output: false (case-sensitive)
     * ```
     */
    equals(other: CharBuffer): boolean;
    /**
     * Determines if the `ReadOnlyCharSlice` is equal to the given `CharBuffer`
     * using a case-insensitive comparison.
     *
     * @param other - The other `CharBuffer` to compare.
     * @returns `true` if the two `CharBuffer`s are equal (ignoring case); otherwise `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice1 = ReadOnlyCharSlice.fromString("Hello");
     * const slice2 = ReadOnlyCharSlice.fromString("HELLO");
     * const slice3 = ReadOnlyCharSlice.fromString("World");
     *
     * console.log(slice1.equalsFold(slice2)); // Output: true
     * console.log(slice1.equalsFold(slice3)); // Output: false
     * ```
     */
    equalsFold(other: CharBuffer): boolean;
    /**
     * Determines if the `ReadOnlyCharSlice` ends with the given suffix.
     *
     * @param suffix - The suffix to check for.
     * @returns `true` if the `ReadOnlyCharSlice` ends with the given suffix; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.endsWith(ReadOnlyCharSlice.fromString("World!"))); // Output: true
     * console.log(slice.endsWith(ReadOnlyCharSlice.fromString("Hello"))); // Output: false
     * ```
     */
    endsWith(suffix: CharBuffer): boolean;
    /**
     * Determines if the `ReadOnlyCharSlice` ends with the given suffix
     * using a case-insensitive comparison.
     *
     * @param suffix - The suffix to check for.
     * @returns `true` if the `ReadOnlyCharSlice` ends with the given suffix (ignoring case); otherwise `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.endsWithFold(ReadOnlyCharSlice.fromString("WORLD!"))); // Output: true
     * console.log(slice.endsWithFold(ReadOnlyCharSlice.fromString("world!"))); // Output: true
     * ```
     */
    endsWithFold(suffix: CharBuffer): boolean;
    /**
     * Creates a new `ReadOnlyCharSlice` that is a slice of the current `ReadOnlyCharSlice`,
     * which is still a view of the same underlying buffer.
     *
     * @param start - The start index of the slice. Defaults to `0`.
     * @param end - The end index of the slice (exclusive). Defaults to the length of the slice.
     * @returns A new `ReadOnlyCharSlice` that is a slice of the current `ReadOnlyCharSlice`.
     * @throws {RangeError} If start is less than 0 or greater than or equal to the length of the slice.
     * @throws {RangeError} If end is less than 0 or greater than the length of the slice.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * const hello = slice.slice(0, 5);
     * const world = slice.slice(7, 12);
     *
     * console.log(hello.toString()); // Output: "Hello"
     * console.log(world.toString()); // Output: "World"
     * ```
     */
    slice(start?: number, end?: number): ReadonlyCharSlice;
    /**
     * Determines if the `ReadOnlyCharSlice` starts with the given prefix.
     *
     * @param prefix - The prefix to check for.
     * @returns `true` if the `ReadOnlyCharSlice` starts with the given prefix; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.startsWith(ReadOnlyCharSlice.fromString("Hello"))); // Output: true
     * console.log(slice.startsWith(ReadOnlyCharSlice.fromString("World"))); // Output: false
     * ```
     */
    startsWith(prefix: CharBuffer): boolean;
    /**
     * Determines if the `ReadOnlyCharSlice` starts with the given prefix
     * using a case-insensitive comparison.
     *
     * @param prefix - The prefix to check for.
     * @returns `true` if the `ReadOnlyCharSlice` starts with the given prefix (ignoring case); otherwise `false`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * console.log(slice.startsWithFold(ReadOnlyCharSlice.fromString("HELLO"))); // Output: true
     * console.log(slice.startsWithFold(ReadOnlyCharSlice.fromString("hello"))); // Output: true
     * ```
     */
    startsWithFold(prefix: CharBuffer): boolean;
    /**
     * Returns a new `ReadOnlyCharSlice` with all characters converted to lowercase.
     *
     * A new `Uint32Array` is allocated because this operation transforms values
     * and needs a new container to store the results.
     *
     * @returns A new `ReadOnlyCharSlice` with all characters in lowercase.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, WORLD!");
     * const lower = slice.toLower;
     * console.log(lower.toString()); // Output: "hello, world!"
     * ```
     */
    get toLower(): ReadonlyCharSlice;
    /**
     * Returns a new `ReadOnlyCharSlice` with all characters converted to uppercase.
     *
     * A new `Uint32Array` is allocated because this operation transforms values
     * and needs a new container to store the results.
     *
     * @returns A new `ReadOnlyCharSlice` with all characters in uppercase.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * const upper = slice.toUpper;
     * console.log(upper.toString()); // Output: "HELLO, WORLD!"
     * ```
     */
    get toUpper(): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with leading whitespace removed.
     *
     * @returns A new `ReadOnlyCharSlice` with the leading whitespace removed.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("   Hello, World!");
     * const trimmed = slice.trimStartSpace();
     * console.log(trimmed.toString()); // Output: "Hello, World!"
     * ```
     */
    trimStartSpace(): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with the leading occurrences of a specific
     * character removed.
     *
     * @param c - The code point of the character to remove from the start.
     * @returns A new `ReadOnlyCharSlice` with the leading character(s) removed.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("###Hello");
     * const trimmed = slice.trimStartChar(35); // 35 is the code point for '#'
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimStartChar(c: number): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with leading characters that match any
     * character in the provided slice removed.
     *
     * @param t - The character slice containing characters to remove from the start.
     * @returns A new `ReadOnlyCharSlice` with the leading characters removed.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("#@!Hello");
     * const chars = ReadOnlyCharSlice.fromString("#@!");
     * const trimmed = slice.trimStartSlice(chars);
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimStartSlice(t: CharSliceLike): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with leading characters removed.
     * If no argument is provided, removes leading whitespace.
     *
     * @param t - Optional. The characters to remove from the start. Can be a string
     *   or a `CharSliceLike`. If not provided, whitespace is removed.
     * @returns A new `ReadOnlyCharSlice` with the leading characters removed.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * // Trim whitespace (default)
     * const slice1 = ReadOnlyCharSlice.fromString("   Hello");
     * console.log(slice1.trimStart().toString()); // Output: "Hello"
     *
     * // Trim specific characters
     * const slice2 = ReadOnlyCharSlice.fromString("###Hello");
     * console.log(slice2.trimStart("#").toString()); // Output: "Hello"
     *
     * // Trim multiple different characters
     * const slice3 = ReadOnlyCharSlice.fromString("#@!Hello");
     * console.log(slice3.trimStart("#@!").toString()); // Output: "Hello"
     * ```
     */
    trimStart(t?: CharSliceLike | string): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with trailing whitespace removed.
     *
     * @returns A new `ReadOnlyCharSlice` with the trailing whitespace removed.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!   ");
     * const trimmed = slice.trimEndSpace();
     * console.log(trimmed.toString()); // Output: "Hello, World!"
     * ```
     */
    trimEndSpace(): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with trailing occurrences of a specific
     * character removed.
     *
     * @param char - The code point of the character to remove from the end.
     * @returns A new `ReadOnlyCharSlice` with the trailing character(s) removed.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello###");
     * const trimmed = slice.trimEndChar(35); // 35 is the code point for '#'
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimEndChar(char: number): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with trailing characters that match any
     * character in the provided slice removed.
     *
     * @param slice - The character slice containing characters to remove from the end.
     * @returns A new `ReadOnlyCharSlice` with the trailing characters removed.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello#@!");
     * const chars = ReadOnlyCharSlice.fromString("#@!");
     * const trimmed = slice.trimEndSlice(chars);
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimEndSlice(slice: CharSliceLike): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with trailing characters removed.
     * If no argument is provided, removes trailing whitespace.
     *
     * @param slice - Optional. The characters to remove from the end. Can be a string
     *   or a `CharSliceLike`. If not provided, whitespace is removed.
     * @returns A new `ReadOnlyCharSlice` with the trailing characters removed.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * // Trim whitespace (default)
     * const slice1 = ReadOnlyCharSlice.fromString("Hello   ");
     * console.log(slice1.trimEnd().toString()); // Output: "Hello"
     *
     * // Trim specific characters
     * const slice2 = ReadOnlyCharSlice.fromString("Hello###");
     * console.log(slice2.trimEnd("#").toString()); // Output: "Hello"
     *
     * // Trim multiple different characters
     * const slice3 = ReadOnlyCharSlice.fromString("Hello#@!");
     * console.log(slice3.trimEnd("#@!").toString()); // Output: "Hello"
     * ```
     */
    trimEnd(slice?: CharSliceLike | string): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with both leading and trailing
     * whitespace removed.
     *
     * @returns A new `ReadOnlyCharSlice` with whitespace trimmed from both ends.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("   Hello, World!   ");
     * const trimmed = slice.trimSpace();
     * console.log(trimmed.toString()); // Output: "Hello, World!"
     * ```
     */
    trimSpace(): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with both leading and trailing occurrences
     * of a specific character removed.
     *
     * @param char - The code point of the character to remove from both ends.
     * @returns A new `ReadOnlyCharSlice` with the character trimmed from both ends.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("###Hello###");
     * const trimmed = slice.trimChar(35); // 35 is the code point for '#'
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimChar(char: number): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with both leading and trailing characters
     * that match any character in the provided slice removed.
     *
     * @param slice - The character slice containing characters to remove from both ends.
     * @returns A new `ReadOnlyCharSlice` with the characters trimmed from both ends.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("#@!Hello#@!");
     * const chars = ReadOnlyCharSlice.fromString("#@!");
     * const trimmed = slice.trimSlice(chars);
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimSlice(slice: CharSliceLike): ReadonlyCharSlice;
    /**
     * Creates a new `ReadOnlyCharSlice` with both leading and trailing characters removed.
     * If no argument is provided, removes whitespace from both ends.
     *
     * @param slice - Optional. The characters to remove from both ends. Can be a string
     *   or a `CharSliceLike`. If not provided, whitespace is removed.
     * @returns A new `ReadOnlyCharSlice` with the characters trimmed from both ends.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * // Trim whitespace (default)
     * const slice1 = ReadOnlyCharSlice.fromString("   Hello   ");
     * console.log(slice1.trim().toString()); // Output: "Hello"
     *
     * // Trim specific characters
     * const slice2 = ReadOnlyCharSlice.fromString("###Hello###");
     * console.log(slice2.trim("#").toString()); // Output: "Hello"
     *
     * // Trim multiple different characters
     * const slice3 = ReadOnlyCharSlice.fromString("#@!Hello!@#");
     * console.log(slice3.trim("#@!").toString()); // Output: "Hello"
     * ```
     */
    trim(slice?: CharSliceLike | string): ReadonlyCharSlice;
    /**
     * Converts the `ReadOnlyCharSlice` to a string.
     *
     * Note: This will create a new string every time it is called.
     *
     * @returns A string representation of the `ReadOnlyCharSlice`.
     *
     * @example
     * ```typescript
     * import { ReadOnlyCharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = ReadOnlyCharSlice.fromString("Hello, World!");
     * const str = slice.toString();
     * console.log(str); // Output: "Hello, World!"
     * console.log(typeof str); // Output: "string"
     * ```
     */
    toString(): string;
}
/**
 * A mutable slice of a character buffer.
 * The slice is a view of the buffer and the buffer is not copied.
 *
 * This is a specialized slice type for working with string characters in their
 * uint32 codepoint format and provides string-like methods such as trim, indexOf, toUpper,
 * toLower, includes, and more without the need to convert them back into strings to perform
 * those operations.
 *
 * Unlike `ReadOnlyCharSlice`, this class allows in-place modifications of the buffer.
 *
 * @example
 * ```typescript
 * import { CharSlice } from '@neotales/slices/char-slice';
 *
 * const slice = CharSlice.fromString("hello");
 * slice.toUpper();
 * console.log(slice.toString()); // Output: "HELLO"
 * ```
 */
export declare class CharSlice implements CharSequence, Iterable<number> {
    #private;
    /**
     * Creates a new instance of the `CharSlice` class.
     *
     * @param buffer - The `Uint32Array` buffer to slice.
     * @param start - The start index of the slice. Defaults to `0`.
     * @param end - The end index of the slice. Defaults to the remaining length from start.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const buffer = new Uint32Array([72, 101, 108, 108, 111]); // "Hello"
     * const slice = new CharSlice(buffer, 0, buffer.length);
     * console.log(slice.toString()); // Output: "Hello"
     * ```
     */
    constructor(buffer: Uint32Array, start?: number, end?: number);
    /**
     * Gets the length of the slice (number of code points).
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.length); // Output: 13
     * ```
     */
    get length(): number;
    /**
     * Gets a value indicating whether the slice is empty.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const emptySlice = CharSlice.fromString("");
     * const slice = CharSlice.fromString("Hello");
     *
     * console.log(emptySlice.isEmpty); // Output: true
     * console.log(slice.isEmpty); // Output: false
     * ```
     */
    get isEmpty(): boolean;
    /**
     * Returns an iterator that iterates over the elements of the slice.
     *
     * @returns An iterator for the code points in the slice.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hi");
     * for (const char of slice) {
     *    console.log(String.fromCodePoint(char));
     * }
     * // Output:
     * // H
     * // i
     * ```
     */
    [Symbol.iterator](): Iterator<number>;
    /**
     * Creates a `CharSlice` from a string, allocating a new buffer
     * using a new `Uint32Array`.
     *
     * @param s - The string to convert to a `CharSlice`.
     * @returns A new `CharSlice` representation of the string.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.toString()); // Output: "Hello, World!"
     * console.log(slice.length); // Output: 13
     * ```
     */
    static fromString(s: string): CharSlice;
    /**
     * Gets the element at the specified index.
     *
     * @param index - The index of the element to get.
     * @returns The code point value at the specified index.
     * @throws {RangeError} If the index is less than 0 or greater than or equal to the length of the slice.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello");
     * console.log(String.fromCodePoint(slice.at(0))); // Output: "H"
     * console.log(String.fromCodePoint(slice.at(4))); // Output: "o"
     * ```
     */
    at(index: number): number;
    /**
     * Sets the element at the specified index.
     *
     * @param index - The index of the element to set.
     * @param value - The code point value to set.
     * @throws {RangeError} If the index is less than 0 or greater than or equal to the length of the slice.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello");
     * slice.set(0, 74); // 74 is the code point for 'J'
     * console.log(slice.toString()); // Output: "Jello"
     * ```
     */
    set(index: number, value: number): this;
    /**
     * Updates multiple elements starting at the specified index.
     * This modifies the slice in-place.
     *
     * @param index - The index to start updating from.
     * @param values - The code point values to set.
     * @returns The current `CharSlice` instance for chaining.
     * @throws {RangeError} If the index is less than 0 or greater than or equal to the length of the slice.
     * @throws {RangeError} If the values array extends beyond the end of the slice.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello");
     * slice.update(0, new Uint32Array([74, 69])); // "JE"
     * console.log(slice.toString()); // Output: "JEllo"
     * ```
     */
    update(index: number, values: ArrayLike<number>): this;
    /**
     * Iterates over the elements of the slice and calls the callback function
     * for each element.
     *
     * @param callback - The callback function to call for each element.
     *   - `value`: The code point value at the current index.
     *   - `index`: The current index in the slice.
     * @returns The current `CharSlice` instance for chaining.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hi");
     * slice.forEach((value, index) => {
     *   console.log(`Index: ${index}, Char: ${String.fromCodePoint(value)}`);
     * });
     * // Output:
     * // Index: 0, Char: H
     * // Index: 1, Char: i
     * ```
     */
    forEach(callback: (value: number, index: number) => void): this;
    /**
     * Iterates over the elements of the slice and calls the callback function
     * for each element, replacing the element with the callback's return value.
     * This modifies the slice in-place.
     *
     * @param callback - The callback function to call for each element.
     *   - `value`: The code point value at the current index.
     *   - `index`: The current index in the slice.
     * @returns The current `CharSlice` instance for chaining.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("abc");
     * // Convert to uppercase by subtracting 32 from lowercase ASCII
     * slice.map((value) => value >= 97 && value <= 122 ? value - 32 : value);
     * console.log(slice.toString()); // Output: "ABC"
     * ```
     */
    map(callback: (value: number, index: number) => number): this;
    /**
     * Replaces the characters at the specified index with the given value.
     * This modifies the slice in-place.
     *
     * @param index - The starting index where replacement should begin.
     * @param value - The replacement value. Can be a string or a `CharSliceLike`.
     * @returns The current `CharSlice` instance for chaining.
     * @throws {RangeError} If the index is less than 0 or greater than or equal to the length of the slice.
     * @throws {RangeError} If the replacement value would extend beyond the end of the slice.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * slice.replace(7, "Deno");
     * console.log(slice.toString()); // Output: "Hello, Deno!!"
     * ```
     */
    replace(index: number, value: string | CharSliceLike): this;
    /**
     * Capitalizes the first character of the slice and converts all other
     * characters to lowercase. This modifies the slice in-place.
     *
     * @returns The current `CharSlice` instance for chaining.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("hELLO WORLD");
     * slice.captialize();
     * console.log(slice.toString()); // Output: "Hello world"
     * ```
     */
    captialize(): this;
    /**
     * Returns the index of the first element in the slice that satisfies the
     * provided predicate function.
     *
     * @param predicate - The predicate function to call for each element.
     *   - `value`: The code point value at the current index.
     *   - `index`: The current index in the slice.
     *   - `set`: The underlying `Uint32Array` buffer.
     * @returns The index of the first element for which the predicate returns `true`,
     *   or `-1` if no element is found.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * // Find the index of the first space character
     * const spaceIndex = slice.findIndex((value) => value === 32); // 32 is code point for ' '
     * console.log(spaceIndex); // Output: 6
     * ```
     */
    findIndex(predicate: (value: number, index: number, set: Uint32Array) => boolean): number;
    /**
     * Determines if the `CharSlice` includes the given value.
     *
     * @param value - The character buffer to search for.
     * @param index - The index to start the search at. Defaults to `0`.
     * @returns `true` if the `CharSlice` includes the given value; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.includes(CharSlice.fromString("World"))); // Output: true
     * console.log(slice.includes(CharSlice.fromString("world"))); // Output: false
     * ```
     */
    includes(value: CharBuffer, index?: number): boolean;
    /**
     * Determines if the `CharSlice` includes the given value using
     * a case-insensitive comparison.
     *
     * @param value - The character buffer to search for.
     * @param index - The index to start the search at. Defaults to `0`.
     * @returns `true` if the `CharSlice` includes the given value; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.includesFold(CharSlice.fromString("WORLD"))); // Output: true
     * console.log(slice.includesFold(CharSlice.fromString("hello"))); // Output: true
     * ```
     */
    includesFold(value: CharBuffer, index?: number): boolean;
    /**
     * Determines the index of the first occurrence of the given value
     * in the `CharSlice`.
     *
     * @param value - The character buffer to search for.
     * @param index - The index to start the search at. Defaults to `0`.
     * @returns The index of the first occurrence of the given value, or `-1` if not found.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.indexOf(CharSlice.fromString("World"))); // Output: 7
     * console.log(slice.indexOf(CharSlice.fromString("xyz"))); // Output: -1
     * ```
     */
    indexOf(value: CharBuffer, index?: number): number;
    /**
     * Determines the index of the first occurrence of the given value
     * in the `CharSlice` using a case-insensitive comparison.
     *
     * @param value - The character buffer to search for.
     * @param index - The index to start the search at. Defaults to `0`.
     * @returns The index of the first occurrence of the given value, or `-1` if not found.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.indexOfFold(CharSlice.fromString("WORLD"))); // Output: 7
     * console.log(slice.indexOfFold(CharSlice.fromString("HELLO"))); // Output: 0
     * ```
     */
    indexOfFold(value: CharBuffer, index?: number): number;
    /**
     * Determines the index of the last occurrence of the given value
     * in the `CharSlice`.
     *
     * @param value - The character buffer to search for.
     * @param index - The index to start the search backwards from. Defaults to the end of the slice.
     * @returns The index of the last occurrence of the given value, or `-1` if not found.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, Hello!");
     * console.log(slice.lastIndexOf(CharSlice.fromString("Hello"))); // Output: 7
     * console.log(slice.lastIndexOf(CharSlice.fromString("xyz"))); // Output: -1
     * ```
     */
    lastIndexOf(value: CharBuffer, index?: number): number;
    /**
     * Determines the index of the last occurrence of the given value
     * in the `CharSlice` using a case-insensitive comparison.
     *
     * @param value - The character buffer to search for.
     * @param index - The index to start the search backwards from. Defaults to the end of the slice.
     * @returns The index of the last occurrence of the given value, or `-1` if not found.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, HELLO!");
     * console.log(slice.lastIndexOfFold(CharSlice.fromString("hello"))); // Output: 7
     * ```
     */
    lastIndexOfFold(value: CharBuffer, index?: number): number;
    /**
     * Determines if the `CharSlice` is equal to the given `CharBuffer`.
     *
     * @param other - The other `CharBuffer` to compare.
     * @returns `true` if the two `CharBuffer`s are equal; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice1 = CharSlice.fromString("Hello");
     * const slice2 = CharSlice.fromString("Hello");
     * const slice3 = CharSlice.fromString("hello");
     *
     * console.log(slice1.equals(slice2)); // Output: true
     * console.log(slice1.equals(slice3)); // Output: false
     * ```
     */
    equals(other: CharBuffer): boolean;
    /**
     * Determines if the `CharSlice` is equal to the given `CharBuffer`
     * using a case-insensitive comparison.
     *
     * @param other - The other `CharBuffer` to compare.
     * @returns `true` if the two `CharBuffer`s are equal (ignoring case); otherwise `false`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice1 = CharSlice.fromString("Hello");
     * const slice2 = CharSlice.fromString("HELLO");
     *
     * console.log(slice1.equalsFold(slice2)); // Output: true
     * ```
     */
    equalsFold(other: CharBuffer): boolean;
    /**
     * Determines if the `CharSlice` ends with the given suffix.
     *
     * @param suffix - The suffix to check for.
     * @returns `true` if the `CharSlice` ends with the given suffix; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.endsWith(CharSlice.fromString("World!"))); // Output: true
     * console.log(slice.endsWith(CharSlice.fromString("Hello"))); // Output: false
     * ```
     */
    endsWith(suffix: CharBuffer): boolean;
    /**
     * Determines if the `CharSlice` ends with the given suffix
     * using a case-insensitive comparison.
     *
     * @param suffix - The suffix to check for.
     * @returns `true` if the `CharSlice` ends with the given suffix (ignoring case); otherwise `false`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.endsWithFold(CharSlice.fromString("WORLD!"))); // Output: true
     * ```
     */
    endsWithFold(suffix: CharBuffer): boolean;
    /**
     * Creates a new `CharSlice` that is a slice of the current `CharSlice`,
     * which is still a view of the same underlying buffer.
     *
     * @param start - The start index of the slice. Defaults to `0`.
     * @param end - The end index of the slice (exclusive). Defaults to the length of the slice.
     * @returns A new `CharSlice` that is a slice of the current `CharSlice`.
     * @throws {RangeError} If start is less than 0 or greater than or equal to the length.
     * @throws {RangeError} If end is less than 0 or greater than the length.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * const hello = slice.slice(0, 5);
     * const world = slice.slice(7, 12);
     *
     * console.log(hello.toString()); // Output: "Hello"
     * console.log(world.toString()); // Output: "World"
     * ```
     */
    slice(start?: number, end?: number): CharSlice;
    /**
     * Creates a new `CharSlice` that is a slice of the current `CharSlice`.
     * This is an alias for the `slice` method.
     *
     * @param start - The start index of the slice.
     * @param end - The end index of the slice (exclusive).
     * @returns A new `CharSlice` that is a slice of the current `CharSlice`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * const sub = slice.sliceSequence(0, 5);
     * console.log(sub.toString()); // Output: "Hello"
     * ```
     */
    sliceSequence(start: number, end?: number): CharSlice;
    /**
     * Determines if the `CharSlice` starts with the given prefix.
     *
     * @param prefix - The prefix to check for.
     * @returns `true` if the `CharSlice` starts with the given prefix; otherwise `false`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.startsWith(CharSlice.fromString("Hello"))); // Output: true
     * console.log(slice.startsWith(CharSlice.fromString("World"))); // Output: false
     * ```
     */
    startsWith(prefix: CharBuffer): boolean;
    /**
     * Determines if the `CharSlice` starts with the given prefix
     * using a case-insensitive comparison.
     *
     * @param prefix - The prefix to check for.
     * @returns `true` if the `CharSlice` starts with the given prefix (ignoring case); otherwise `false`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * console.log(slice.startsWithFold(CharSlice.fromString("HELLO"))); // Output: true
     * console.log(slice.startsWithFold(CharSlice.fromString("hello"))); // Output: true
     * ```
     */
    startsWithFold(prefix: CharBuffer): boolean;
    /**
     * Converts the slice to a new `Uint32Array` containing a copy of the slice's elements.
     *
     * @returns A new `Uint32Array` containing the code points in the slice.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello");
     * const array = slice.toArray();
     * console.log(array); // Output: Uint32Array(5) [72, 101, 108, 108, 111]
     * ```
     */
    toArray(): Uint32Array;
    /**
     * Converts all characters in the slice to lowercase. This modifies
     * the slice in-place.
     *
     * @returns The current `CharSlice` instance for chaining.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, WORLD!");
     * slice.toLower();
     * console.log(slice.toString()); // Output: "hello, world!"
     * ```
     */
    toLower(): this;
    /**
     * Converts all characters in the slice to uppercase. This modifies
     * the slice in-place.
     *
     * @returns The current `CharSlice` instance for chaining.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * slice.toUpper();
     * console.log(slice.toString()); // Output: "HELLO, WORLD!"
     * ```
     */
    toUpper(): this;
    /**
     * Reverses the elements in the slice in-place.
     *
     * @returns The current `CharSlice` instance for chaining.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello");
     * slice.reverse();
     * console.log(slice.toString()); // Output: "olleH"
     *
     * // Reverse a substring
     * const slice2 = CharSlice.fromString("abcdef");
     * slice2.slice(1, 4).reverse(); // Reverse "bcd"
     * console.log(slice2.toString()); // Output: "adcbef"
     * ```
     */
    reverse(): this;
    /**
     * Creates a new `CharSlice` with leading whitespace removed.
     *
     * @returns A new `CharSlice` with the leading whitespace removed.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("   Hello, World!");
     * const trimmed = slice.trimStartSpace();
     * console.log(trimmed.toString()); // Output: "Hello, World!"
     * ```
     */
    trimStartSpace(): CharSlice;
    /**
     * Creates a new `CharSlice` with leading occurrences of a specific
     * character removed.
     *
     * @param c - The code point of the character to remove from the start.
     * @returns A new `CharSlice` with the leading character(s) removed.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("###Hello");
     * const trimmed = slice.trimStartChar(35); // 35 is the code point for '#'
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimStartChar(c: number): CharSlice;
    /**
     * Creates a new `CharSlice` with leading characters that match any
     * character in the provided slice removed.
     *
     * @param t - The characters to remove from the start. Can be a string or `CharSliceLike`.
     * @returns A new `CharSlice` with the leading characters removed.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("#@!Hello");
     * const trimmed = slice.trimStartSlice("#@!");
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimStartSlice(t: CharSliceLike | string): CharSlice;
    /**
     * Creates a new `CharSlice` with leading characters removed.
     * If no argument is provided, removes leading whitespace.
     *
     * @param t - Optional. The characters to remove from the start. Can be a string
     *   or a `CharSliceLike`. If not provided, whitespace is removed.
     * @returns A new `CharSlice` with the leading characters removed.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * // Trim whitespace (default)
     * const slice1 = CharSlice.fromString("   Hello");
     * console.log(slice1.trimStart().toString()); // Output: "Hello"
     *
     * // Trim specific characters
     * const slice2 = CharSlice.fromString("###Hello");
     * console.log(slice2.trimStart("#").toString()); // Output: "Hello"
     * ```
     */
    trimStart(t?: CharSliceLike | string): CharSlice;
    /**
     * Creates a new `CharSlice` with trailing whitespace removed.
     *
     * @returns A new `CharSlice` with the trailing whitespace removed.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!   ");
     * const trimmed = slice.trimEndSpace();
     * console.log(trimmed.toString()); // Output: "Hello, World!"
     * ```
     */
    trimEndSpace(): CharSlice;
    /**
     * Creates a new `CharSlice` with trailing occurrences of a specific
     * character removed.
     *
     * @param c - The code point of the character to remove from the end.
     * @returns A new `CharSlice` with the trailing character(s) removed.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello###");
     * const trimmed = slice.trimEndChar(35); // 35 is the code point for '#'
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimEndChar(c: number): CharSlice;
    /**
     * Creates a new `CharSlice` with trailing characters that match any
     * character in the provided slice removed.
     *
     * @param t - The characters to remove from the end. Can be a string or `CharSliceLike`.
     * @returns A new `CharSlice` with the trailing characters removed.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello#@!");
     * const trimmed = slice.trimEndSlice("#@!");
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimEndSlice(t: CharSliceLike | string): CharSlice;
    /**
     * Creates a new `CharSlice` with trailing characters removed.
     * If no argument is provided, removes trailing whitespace.
     *
     * @param t - Optional. The characters to remove from the end. Can be a string
     *   or a `CharSliceLike`. If not provided, whitespace is removed.
     * @returns A new `CharSlice` with the trailing characters removed.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * // Trim whitespace (default)
     * const slice1 = CharSlice.fromString("Hello   ");
     * console.log(slice1.trimEnd().toString()); // Output: "Hello"
     *
     * // Trim specific characters
     * const slice2 = CharSlice.fromString("Hello###");
     * console.log(slice2.trimEnd("#").toString()); // Output: "Hello"
     * ```
     */
    trimEnd(t?: CharSliceLike | string): CharSlice;
    /**
     * Creates a new `CharSlice` with both leading and trailing whitespace removed.
     *
     * @returns A new `CharSlice` with whitespace trimmed from both ends.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("   Hello, World!   ");
     * const trimmed = slice.trimSpace();
     * console.log(trimmed.toString()); // Output: "Hello, World!"
     * ```
     */
    trimSpace(): CharSlice;
    /**
     * Creates a new `CharSlice` with both leading and trailing occurrences
     * of a specific character removed.
     *
     * @param c - The code point of the character to remove from both ends.
     * @returns A new `CharSlice` with the character trimmed from both ends.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("###Hello###");
     * const trimmed = slice.trimChar(35); // 35 is the code point for '#'
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimChar(c: number): CharSlice;
    /**
     * Creates a new `CharSlice` with both leading and trailing characters
     * that match any character in the provided slice removed.
     *
     * @param t - The characters to remove from both ends. Can be a string or `CharSliceLike`.
     * @returns A new `CharSlice` with the characters trimmed from both ends.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("#@!Hello#@!");
     * const trimmed = slice.trimSlice("#@!");
     * console.log(trimmed.toString()); // Output: "Hello"
     * ```
     */
    trimSlice(t: CharSliceLike | string): CharSlice;
    /**
     * Creates a new `CharSlice` with both leading and trailing characters removed.
     * If no argument is provided, removes whitespace from both ends.
     *
     * @param t - Optional. The characters to remove from both ends. Can be a string
     *   or a `CharSliceLike`. If not provided, whitespace is removed.
     * @returns A new `CharSlice` with the characters trimmed from both ends.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * // Trim whitespace (default)
     * const slice1 = CharSlice.fromString("   Hello   ");
     * console.log(slice1.trim().toString()); // Output: "Hello"
     *
     * // Trim specific characters
     * const slice2 = CharSlice.fromString("###Hello###");
     * console.log(slice2.trim("#").toString()); // Output: "Hello"
     *
     * // Trim multiple different characters
     * const slice3 = CharSlice.fromString("#@!Hello!@#");
     * console.log(slice3.trim("#@!").toString()); // Output: "Hello"
     * ```
     */
    trim(t?: CharSliceLike | string): CharSlice;
    /**
     * Converts the `CharSlice` to a string.
     *
     * Note: This will create a new string every time it is called.
     *
     * @returns A string representation of the `CharSlice`.
     *
     * @example
     * ```typescript
     * import { CharSlice } from '@neotales/slices/char-slice';
     *
     * const slice = CharSlice.fromString("Hello, World!");
     * const str = slice.toString();
     * console.log(str); // Output: "Hello, World!"
     * console.log(typeof str); // Output: "string"
     * ```
     */
    toString(): string;
}
/**
 * Creates a `CharSlice` from the given buffer.
 * @param buffer The buffer to create the `CharSlice` from. Can be a `Uint32Array`, an array of numbers, or a string.
 * @param start  The start index of the slice. Defaults to `0`.
 * @param end  The end index of the slice (exclusive). Defaults to the length of the buffer.
 * @returns A new `CharSlice` instance.
 *
 * @example
 * ```typescript
 * import { charSlice } from '@neotales/slices/char-slice';
 *
 * const slice1 = charSlice("Hello, World!", 7, 12);
 * console.log(slice1.toString()); // Output: "World"
 * ```
 */
export declare function charSlice(buffer: Uint32Array | number[] | string, start?: number, end?: number): CharSlice;
/**
 * Creates a `ReadonlyCharSlice` from the given buffer.
 * @param buffer The buffer to create the `ReadonlyCharSlice` from. Can be a `Uint32Array`, an array of numbers, or a string.
 * @param start  The start index of the slice. Defaults to `0`.
 * @param end The end index of the slice (exclusive). Defaults to the length of the buffer.
 * @returns A new `ReadonlyCharSlice` instance.
 *
 * @example
 * ```typescript
 * import { readonlyCharSlice } from '@neotales/slices/char-slice';
 *
 * const slice1 = readonlyCharSlice("Hello, World!", 7, 12);
 * console.log(slice1.toString()); // Output: "World"
 * ```
 */
export declare function readonlyCharSlice(buffer: Uint32Array | number[] | string, start?: number, end?: number): ReadonlyCharSlice;
