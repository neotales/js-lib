var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ReadonlyCharSlice_buffer, _ReadonlyCharSlice_start, _ReadonlyCharSlice_end, _CharSlice_buffer, _CharSlice_start, _CharSlice_end;
import { isSpace, toLower, toUpper } from "@neotales/chars";
import { equal, equalFold } from "./equal.js";
import { toCharArray, toCharSliceLike, } from "./utils.js";
import { endsWith, endsWithFold } from "./ends_with.js";
import { startsWith, startsWithFold } from "./starts_with.js";
import { indexOf, indexOfFold } from "./index_of.js";
import { lastIndexOf, lastIndexOfFold } from "./last_index_of.js";
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
export class ReadonlyCharSlice {
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
    constructor(buffer, start = 0, end) {
        _ReadonlyCharSlice_buffer.set(this, void 0);
        _ReadonlyCharSlice_start.set(this, void 0);
        _ReadonlyCharSlice_end.set(this, void 0);
        __classPrivateFieldSet(this, _ReadonlyCharSlice_buffer, buffer, "f");
        __classPrivateFieldSet(this, _ReadonlyCharSlice_start, start, "f");
        __classPrivateFieldSet(this, _ReadonlyCharSlice_end, end ?? buffer.length - start, "f");
    }
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
    get length() {
        return __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
    }
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
    get isEmpty() {
        return this.length === 0;
    }
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
    static fromString(s) {
        const buffer = toCharArray(s);
        return new ReadonlyCharSlice(buffer);
    }
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
    [(_ReadonlyCharSlice_buffer = new WeakMap(), _ReadonlyCharSlice_start = new WeakMap(), _ReadonlyCharSlice_end = new WeakMap(), Symbol.iterator)]() {
        let index = 0;
        const set = __classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f");
        const offset = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        const length = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        return {
            next() {
                if (index < length) {
                    return { done: false, value: set[offset + index++] };
                }
                return { done: true, value: undefined };
            },
        };
    }
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
    at(index) {
        if (index < 0 || index >= __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f")) {
            throw new RangeError("Argument 'index' must be greater than or equal to 0.");
        }
        return __classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[__classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f") + index];
    }
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
    forEach(callback) {
        for (let i = 0; i < this.length; i++) {
            callback(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[__classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f") + i], i);
        }
        return this;
    }
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
    map(callback) {
        const buffer = new Uint32Array(this.length);
        for (let i = 0; i < this.length; i++) {
            buffer[i] = callback(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[__classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f") + i], i);
        }
        return new ReadonlyCharSlice(buffer);
    }
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
    captialize() {
        const buffer = new Uint32Array(this.length);
        buffer.set(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f"));
        buffer[0] = toUpper(buffer[0]);
        return new ReadonlyCharSlice(buffer);
    }
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
    includes(value, index = 0) {
        return this.indexOf(value, index) !== -1;
    }
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
    includesFold(value, index = 0) {
        return this.indexOfFold(value, index) !== -1;
    }
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
    indexOf(value, index = 0) {
        if (typeof value === "number") {
            value = new Uint32Array([value]);
        }
        return indexOf(this, value, index);
    }
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
    indexOfFold(value, index = 0) {
        if (typeof value === "number") {
            value = new Uint32Array([value]);
        }
        return indexOfFold(this, value, index);
    }
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
    equals(other) {
        if (this.length !== other.length) {
            return false;
        }
        return equal(this, other);
    }
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
    equalsFold(other) {
        if (this.length !== other.length) {
            return false;
        }
        return equalFold(this, other);
    }
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
    endsWith(suffix) {
        return endsWith(this, suffix);
    }
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
    endsWithFold(suffix) {
        return endsWithFold(this, suffix);
    }
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
    slice(start = 0, end = this.length) {
        if (start < 0 || start >= this.length) {
            throw new RangeError("Argument 'start' must be greater than or equal to 0.");
        }
        if (end < 0 || end > this.length) {
            throw new RangeError("Argument 'end' must be greater than or equal to 0.");
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f") + start, __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f") + end);
    }
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
    startsWith(prefix) {
        return startsWith(this, prefix);
    }
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
    startsWithFold(prefix) {
        return startsWithFold(this, prefix);
    }
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
    get toLower() {
        const buffer = new Uint32Array(this.length);
        let i = 0;
        for (let j = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f"); j < __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f"); j++) {
            buffer[i++] = toLower(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[j]);
        }
        return new ReadonlyCharSlice(buffer);
    }
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
    get toUpper() {
        const buffer = new Uint32Array(this.length);
        let i = 0;
        for (let j = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f"); j < __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f"); j++) {
            buffer[i++] = toUpper(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[j]);
        }
        return new ReadonlyCharSlice(buffer);
    }
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
    trimStartSpace() {
        let start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        const end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end && isSpace(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[start])) {
            start++;
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trimStartChar(c) {
        let start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        const end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end && __classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[start] === c) {
            start++;
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trimStartSlice(t) {
        let start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        const end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end) {
            let match = false;
            for (let i = 0; i < t.length; i++) {
                if (__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[start] === t.at(i)) {
                    start++;
                    match = true;
                    break;
                }
            }
            if (!match) {
                break;
            }
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trimStart(t) {
        if (t === undefined) {
            return this.trimStartSpace();
        }
        if (typeof t === "string") {
            t = toCharSliceLike(t);
        }
        if (t.length === 1) {
            return this.trimStartChar(t.at(0) ?? -1);
        }
        return this.trimStartSlice(t);
    }
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
    trimEndSpace() {
        const start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end && isSpace(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[end - 1])) {
            end--;
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trimEndChar(char) {
        const start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end && __classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[end - 1] === char) {
            end--;
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trimEndSlice(slice) {
        const start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end) {
            let match = false;
            for (let i = 0; i < slice.length; i++) {
                if (__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[end - 1] === slice.at(i)) {
                    end--;
                    match = true;
                    break;
                }
            }
            if (!match) {
                break;
            }
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trimEnd(slice) {
        if (slice === undefined) {
            return this.trimEndSpace();
        }
        if (typeof slice === "string") {
            slice = toCharSliceLike(slice);
        }
        if (slice.length === 1) {
            return this.trimEndChar(slice.at(0) ?? -1);
        }
        return this.trimEndSlice(slice);
    }
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
    trimSpace() {
        let start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end && isSpace(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[start])) {
            start++;
        }
        while (start < end && isSpace(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[end - 1])) {
            end--;
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trimChar(char) {
        let start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end && __classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[start] === char) {
            start++;
        }
        while (start < end && __classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[end - 1] === char) {
            end--;
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trimSlice(slice) {
        let start = __classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f");
        while (start < end) {
            let match = false;
            for (let i = 0; i < slice.length; i++) {
                if (__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[start] === slice.at(i)) {
                    start++;
                    match = true;
                    break;
                }
            }
            if (!match) {
                break;
            }
        }
        while (start < end) {
            let match = false;
            for (let i = 0; i < slice.length; i++) {
                if (__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f")[end - 1] === slice.at(i)) {
                    end--;
                    match = true;
                    break;
                }
            }
            if (!match) {
                break;
            }
        }
        return new ReadonlyCharSlice(__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f"), start, end);
    }
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
    trim(slice) {
        if (slice === undefined) {
            return this.trimSpace();
        }
        if (typeof slice === "string") {
            slice = toCharSliceLike(slice);
        }
        if (slice.length === 1) {
            return this.trimChar(slice.at(0) ?? -1);
        }
        return this.trimSlice(slice);
    }
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
    toString() {
        return String.fromCodePoint(...__classPrivateFieldGet(this, _ReadonlyCharSlice_buffer, "f").slice(__classPrivateFieldGet(this, _ReadonlyCharSlice_start, "f"), __classPrivateFieldGet(this, _ReadonlyCharSlice_end, "f")));
    }
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
export class CharSlice {
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
    constructor(buffer, start = 0, end) {
        _CharSlice_buffer.set(this, void 0);
        _CharSlice_start.set(this, void 0);
        _CharSlice_end.set(this, void 0);
        __classPrivateFieldSet(this, _CharSlice_buffer, buffer, "f");
        __classPrivateFieldSet(this, _CharSlice_start, start, "f");
        __classPrivateFieldSet(this, _CharSlice_end, end ?? buffer.length - start, "f");
    }
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
    get length() {
        return __classPrivateFieldGet(this, _CharSlice_end, "f");
    }
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
    get isEmpty() {
        return this.length === 0;
    }
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
    [(_CharSlice_buffer = new WeakMap(), _CharSlice_start = new WeakMap(), _CharSlice_end = new WeakMap(), Symbol.iterator)]() {
        let index = 0;
        const set = __classPrivateFieldGet(this, _CharSlice_buffer, "f");
        const offset = __classPrivateFieldGet(this, _CharSlice_start, "f");
        const length = __classPrivateFieldGet(this, _CharSlice_end, "f");
        return {
            next() {
                if (index < length) {
                    return { done: false, value: set[offset + index++] };
                }
                return { done: true, value: undefined };
            },
        };
    }
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
    static fromString(s) {
        const buffer = toCharArray(s);
        return new CharSlice(buffer);
    }
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
    at(index) {
        if (index < 0 || index >= __classPrivateFieldGet(this, _CharSlice_end, "f")) {
            throw new RangeError("Argument 'index' must be greater than or equal to 0.");
        }
        return __classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f") + index];
    }
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
    set(index, value) {
        if (index < 0 || index >= __classPrivateFieldGet(this, _CharSlice_end, "f")) {
            throw new RangeError("Argument 'index' must be greater than or equal to 0.");
        }
        __classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f") + index] = value;
        return this;
    }
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
    update(index, values) {
        if (index < 0 || index >= __classPrivateFieldGet(this, _CharSlice_end, "f")) {
            throw new RangeError("Argument 'index' must be greater than or equal to 0.");
        }
        if (index + values.length > __classPrivateFieldGet(this, _CharSlice_end, "f")) {
            throw new RangeError("Values array extends beyond the end of the slice.");
        }
        for (let i = 0; i < values.length; i++) {
            __classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f") + index + i] = values[i];
        }
        return this;
    }
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
    forEach(callback) {
        for (let i = 0; i < this.length; i++) {
            callback(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f") + i], i);
        }
        return this;
    }
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
    map(callback) {
        for (let i = 0; i < this.length; i++) {
            __classPrivateFieldGet(this, _CharSlice_buffer, "f")[i] = callback(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f") + i], i);
        }
        return this;
    }
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
    replace(index, value) {
        if (index < 0 || index >= __classPrivateFieldGet(this, _CharSlice_end, "f")) {
            throw new RangeError("Argument 'index' must be greater than or equal to 0.");
        }
        if (typeof value === "string") {
            value = toCharSliceLike(value);
        }
        if (index + value.length > __classPrivateFieldGet(this, _CharSlice_end, "f")) {
            throw new RangeError("Argument 'value' must be greater than or equal to 0.");
        }
        for (let i = 0; i < value.length; i++) {
            __classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f") + index + i] = value.at(i) ?? 0;
        }
        return this;
    }
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
    captialize() {
        __classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f")] = toUpper(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f")]);
        for (let i = __classPrivateFieldGet(this, _CharSlice_start, "f") + 1; i < __classPrivateFieldGet(this, _CharSlice_end, "f"); i++) {
            __classPrivateFieldGet(this, _CharSlice_buffer, "f")[i] = toLower(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[i]);
        }
        return this;
    }
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
    findIndex(predicate) {
        for (let i = 0; i < this.length; i++) {
            if (predicate(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[__classPrivateFieldGet(this, _CharSlice_start, "f") + i], i, __classPrivateFieldGet(this, _CharSlice_buffer, "f"))) {
                return i;
            }
        }
        return -1;
    }
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
    includes(value, index = 0) {
        return this.indexOf(value, index) !== -1;
    }
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
    includesFold(value, index = 0) {
        return this.indexOfFold(value, index) !== -1;
    }
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
    indexOf(value, index = 0) {
        return indexOf(this, value, index);
    }
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
    indexOfFold(value, index = 0) {
        return indexOfFold(this, value, index);
    }
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
    lastIndexOf(value, index = Infinity) {
        return lastIndexOf(this, value, index);
    }
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
    lastIndexOfFold(value, index = Infinity) {
        return lastIndexOfFold(this, value, index);
    }
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
    equals(other) {
        return equal(this, other);
    }
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
    equalsFold(other) {
        return equalFold(this, other);
    }
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
    endsWith(suffix) {
        return endsWith(this, suffix);
    }
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
    endsWithFold(suffix) {
        return endsWithFold(this, suffix);
    }
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
    slice(start = 0, end = this.length) {
        if (start < 0 || start >= this.length) {
            throw new RangeError("Argument 'start' must be greater than or equal to 0.");
        }
        if (end < 0 || end > this.length) {
            throw new RangeError("Argument 'end' must be greater than or equal to 0.");
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), __classPrivateFieldGet(this, _CharSlice_start, "f") + start, __classPrivateFieldGet(this, _CharSlice_start, "f") + end);
    }
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
    sliceSequence(start, end) {
        return this.slice(start, end);
    }
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
    startsWith(prefix) {
        return startsWith(this, prefix);
    }
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
    startsWithFold(prefix) {
        return startsWithFold(this, prefix);
    }
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
    toArray() {
        return __classPrivateFieldGet(this, _CharSlice_buffer, "f").slice(__classPrivateFieldGet(this, _CharSlice_start, "f"), __classPrivateFieldGet(this, _CharSlice_end, "f"));
    }
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
    toLower() {
        for (let j = __classPrivateFieldGet(this, _CharSlice_start, "f"); j < __classPrivateFieldGet(this, _CharSlice_end, "f"); j++) {
            __classPrivateFieldGet(this, _CharSlice_buffer, "f")[j] = toLower(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[j]);
        }
        return this;
    }
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
    toUpper() {
        for (let j = __classPrivateFieldGet(this, _CharSlice_start, "f"); j < __classPrivateFieldGet(this, _CharSlice_end, "f"); j++) {
            __classPrivateFieldGet(this, _CharSlice_buffer, "f")[j] = toUpper(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[j]);
        }
        return this;
    }
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
    reverse() {
        const buffer = __classPrivateFieldGet(this, _CharSlice_buffer, "f");
        const start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        const end = start + __classPrivateFieldGet(this, _CharSlice_end, "f") - 1;
        const mid = Math.floor((end - start + 1) / 2);
        for (let i = 0; i < mid; i++) {
            const left = start + i;
            const right = end - i;
            const temp = buffer[left];
            buffer[left] = buffer[right];
            buffer[right] = temp;
        }
        return this;
    }
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
    trimStartSpace() {
        let start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        const end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end && isSpace(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[start])) {
            start++;
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trimStartChar(c) {
        let start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        const end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end && __classPrivateFieldGet(this, _CharSlice_buffer, "f")[start] === c) {
            start++;
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trimStartSlice(t) {
        if (typeof t === "string") {
            t = toCharSliceLike(t);
        }
        let start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        const end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end) {
            let match = false;
            for (let i = 0; i < t.length; i++) {
                if (__classPrivateFieldGet(this, _CharSlice_buffer, "f")[start] === t.at(i)) {
                    start++;
                    match = true;
                    break;
                }
            }
            if (!match) {
                break;
            }
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trimStart(t) {
        if (t === undefined) {
            return this.trimStartSpace();
        }
        if (t.length === 1) {
            if (typeof t === "string") {
                t = toCharSliceLike(t);
            }
            return this.trimStartChar(t.at(0) ?? -1);
        }
        return this.trimStartSlice(t);
    }
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
    trimEndSpace() {
        const start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end && isSpace(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[end - 1])) {
            end--;
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trimEndChar(c) {
        const start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end && __classPrivateFieldGet(this, _CharSlice_buffer, "f")[end - 1] === c) {
            end--;
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trimEndSlice(t) {
        if (typeof t === "string") {
            t = toCharSliceLike(t);
        }
        const start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end) {
            let match = false;
            for (let i = 0; i < t.length; i++) {
                if (__classPrivateFieldGet(this, _CharSlice_buffer, "f")[end - 1] === t.at(i)) {
                    end--;
                    match = true;
                    break;
                }
            }
            if (!match) {
                break;
            }
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trimEnd(t) {
        if (t === undefined) {
            return this.trimEndSpace();
        }
        if (t.length === 1) {
            if (typeof t === "string") {
                t = toCharSliceLike(t);
            }
            return this.trimEndChar(t.at(0) ?? -1);
        }
        return this.trimEndSlice(t);
    }
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
    trimSpace() {
        let start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end && isSpace(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[start])) {
            start++;
        }
        while (start < end && isSpace(__classPrivateFieldGet(this, _CharSlice_buffer, "f")[end - 1])) {
            end--;
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trimChar(c) {
        let start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end && __classPrivateFieldGet(this, _CharSlice_buffer, "f")[start] === c) {
            start++;
        }
        while (start < end && __classPrivateFieldGet(this, _CharSlice_buffer, "f")[end - 1] === c) {
            end--;
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trimSlice(t) {
        if (typeof t === "string") {
            t = toCharSliceLike(t);
        }
        let start = __classPrivateFieldGet(this, _CharSlice_start, "f");
        let end = __classPrivateFieldGet(this, _CharSlice_end, "f");
        while (start < end) {
            let match = false;
            for (let i = 0; i < t.length; i++) {
                if (__classPrivateFieldGet(this, _CharSlice_buffer, "f")[start] === t.at(i)) {
                    start++;
                    match = true;
                    break;
                }
            }
            if (!match) {
                break;
            }
        }
        while (start < end) {
            let match = false;
            for (let i = 0; i < t.length; i++) {
                if (__classPrivateFieldGet(this, _CharSlice_buffer, "f")[end - 1] === t.at(i)) {
                    end--;
                    match = true;
                    break;
                }
            }
            if (!match) {
                break;
            }
        }
        return new CharSlice(__classPrivateFieldGet(this, _CharSlice_buffer, "f"), start, end);
    }
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
    trim(t) {
        if (t === undefined) {
            return this.trimSpace();
        }
        if (t.length === 1) {
            if (typeof t === "string") {
                t = toCharSliceLike(t);
            }
            return this.trimChar(t.at(0) ?? -1);
        }
        return this.trimSlice(t);
    }
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
    toString() {
        return String.fromCodePoint(...__classPrivateFieldGet(this, _CharSlice_buffer, "f").slice(__classPrivateFieldGet(this, _CharSlice_start, "f"), __classPrivateFieldGet(this, _CharSlice_end, "f")));
    }
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
export function charSlice(buffer, start, end) {
    if (typeof buffer === "string") {
        return CharSlice.fromString(buffer).slice(start ?? 0, end ?? undefined);
    }
    const uint32Buffer = buffer instanceof Uint32Array ? buffer : new Uint32Array(buffer);
    const s = start ?? 0;
    const e = end ?? uint32Buffer.length;
    return new CharSlice(uint32Buffer, s, e);
}
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
export function readonlyCharSlice(buffer, start, end) {
    if (typeof buffer === "string") {
        return ReadonlyCharSlice.fromString(buffer).slice(start ?? 0, end ?? undefined);
    }
    const uint32Buffer = buffer instanceof Uint32Array ? buffer : new Uint32Array(buffer);
    const s = start ?? 0;
    const e = end ?? uint32Buffer.length;
    return new ReadonlyCharSlice(uint32Buffer, s, e);
}
