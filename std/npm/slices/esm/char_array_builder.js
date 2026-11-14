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
var _CharArrayBuilder_buffer, _CharArrayBuilder_length;
import { WINDOWS } from "./globals.js";
import { toCharSliceLike } from "./utils.js";
import { toCharArray } from "./utils.js";
/**
 * Represents a mutable string of characters that are stored
 * as code points in a Uint32Array.
 *
 * @example
 * ```typescript
 * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
 *
 * const builder = new CharArrayBuilder();
 * builder.appendString("Hello, ");
 * builder.appendString("World!");
 * console.log(builder.toString()); // Output: "Hello, World!"
 * ```
 */
export class CharArrayBuilder {
    /**
     * Creates a new instance of the StringBuilder class.
     * @param capacity The initial capacity of the char builder. Default is 16.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder(32);
     * ```
     */
    constructor(capacity = 16) {
        _CharArrayBuilder_buffer.set(this, void 0);
        _CharArrayBuilder_length.set(this, void 0);
        __classPrivateFieldSet(this, _CharArrayBuilder_length, 0, "f");
        __classPrivateFieldSet(this, _CharArrayBuilder_buffer, new Uint32Array(capacity), "f");
    }
    /**
     * Gets the length of the char or string builder.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.append("Hello");
     * console.log(builder.length); // Output: 5
     * ```
     */
    get length() {
        return __classPrivateFieldGet(this, _CharArrayBuilder_length, "f");
    }
    /**
     * Appends a value to the string builder.
     * @param value The value to append to the string builder.
     * @returns The updated `StringBuilder` or `CharArrayBuilder` instance.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.append("Hello, ");
     * builder.append("World!");
     * console.log(builder.toString()); // Output: "Hello, World!"
     * ```
     */
    append(value) {
        // deno-lint-ignore no-explicit-any
        const v = value;
        if (v.length !== undefined && v.at !== undefined) {
            this.appendSlice(v);
        }
        else {
            const type = typeof value;
            switch (type) {
                case "string":
                    this.appendString(v);
                    break;
                case "bigint":
                    this.appendString(v.toString());
                    break;
                case "number":
                    this.appendString(v.toString());
                    break;
                case "boolean":
                    this.appendString(v.toString());
                    break;
                case "object":
                    if (v instanceof Date) {
                        this.appendString(v.toString());
                    }
                    else {
                        throw new RangeError("Argument 'value' is not a valid type.");
                    }
                    break;
                default:
                    throw new RangeError("Argument 'value' is not a valid type.");
            }
        }
        return this;
    }
    /**
     * Appends a Unicode character to the string builder.
     * @param value The Unicode character (codepoint) to append.
     * @returns The update `StringBuilder` or `CharArrayBuilder` instance.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.appendChar(65); // Appends 'A'
     * builder.appendChar(66); // Appends 'B'
     * console.log(builder.toString()); // Output: "AB"
     * ```
     */
    appendChar(value) {
        var _a;
        if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) {
            throw new Error("Argument 'value' must be a valid Unicode character.");
        }
        this.grow(__classPrivateFieldGet(this, _CharArrayBuilder_length, "f") + 1);
        __classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f")[__classPrivateFieldGet(this, _CharArrayBuilder_length, "f")] = value;
        __classPrivateFieldSet(this, _CharArrayBuilder_length, (_a = __classPrivateFieldGet(this, _CharArrayBuilder_length, "f"), _a++, _a), "f");
        return this;
    }
    /**
     * Appends a char slice to the string builder.
     * @param value The slice to append.
     * @returns The updated string builder.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * const slice: CharBuffer = new Uint32Array([72, 101, 108, 108, 111]); // "Hello"
     * builder.appendSlice(slice);
     * console.log(builder.toString()); // Output: "Hello"
     * ```
     */
    appendSlice(value) {
        this.grow(__classPrivateFieldGet(this, _CharArrayBuilder_length, "f") + value.length);
        const v = toCharSliceLike(value);
        const l = this.length;
        for (let i = 0; i < value.length; i++) {
            const rune = v.at(i) ?? 0;
            __classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f")[l + i] = rune;
        }
        __classPrivateFieldSet(this, _CharArrayBuilder_length, __classPrivateFieldGet(this, _CharArrayBuilder_length, "f") + value.length, "f");
        return this;
    }
    /**
     * Appends a string to the end of the string builder.
     * @param value The string to append.
     * @returns The updated `CharArrayBuilder` instance.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.appendString("Hello, World!");
     * console.log(builder.toString()); // Output: "Hello, World!"
     * ```
     */
    appendString(value) {
        this.appendCharArray(toCharArray(value));
    }
    /**
     * Appends a character array to the end of the string builder.
     * @param value The character array to append.
     * @returns The updated `CharArrayBuilder` instance.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * const charArray = new Uint32Array([72, 101, 108, 108, 111]); // "Hello"
     * builder.appendCharArray(charArray);
     * console.log(builder.toString()); // Output: "Hello"
     * ```
     */
    appendCharArray(value) {
        this.grow(__classPrivateFieldGet(this, _CharArrayBuilder_length, "f") + value.length);
        __classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f").set(value, __classPrivateFieldGet(this, _CharArrayBuilder_length, "f"));
        __classPrivateFieldSet(this, _CharArrayBuilder_length, __classPrivateFieldGet(this, _CharArrayBuilder_length, "f") + value.length, "f");
    }
    /**
     * Appends a string followed by a line break to the string builder.
     * @param value The string to append.
     * @returns The updated string builder.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.appendLine("Hello, World!");
     * console.log(builder.toString()); // Output on Windows: "Hello, World!\r\n" | Output on Unix: "Hello, World!\n"
     * ```
     */
    appendLine(value) {
        if (value !== undefined && value.length > 0) {
            this.appendSlice(value);
        }
        if (WINDOWS) {
            this.appendChar(13);
        }
        this.appendChar(10);
        return this;
    }
    /**
     * Shrinks the capacity of the string builder to the specified value.
     * @param capacity The new capacity of the string builder.
     * @returns The updated StringBuilder instance.
     * @throws ArgumentRangeError if the capacity is less than 0.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder(50);
     * builder.append("Hello, World!");
     * builder.shrinkTo(20);
     * console.log(builder.toString()); // Output: "Hello, World!"
     * ```
     */
    shrinkTo(capacity) {
        if (capacity < 0) {
            throw new RangeError("Argument 'capacity' must be greater than -1.");
        }
        __classPrivateFieldSet(this, _CharArrayBuilder_buffer, __classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f").slice(0, capacity), "f");
        return this;
    }
    /**
     * Clears the string builder.
     * @returns The updated `CharArrayBuilder` instance.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.appendString("Hello, World!");
     * builder.clear();
     * console.log(builder.toString()); // Output: ""
     * ```
     */
    clear() {
        __classPrivateFieldSet(this, _CharArrayBuilder_length, 0, "f");
        __classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f").fill(0);
        return this;
    }
    /**
     * Trims excess capacity from the string builder.
     * @returns The updated StringBuilder instance.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.appendString("Hello, World!");
     * builder.trimExcess();
     * console.log(builder.toString()); // Output: "Hello, World!"
     * ```
     */
    trimExcess() {
        this.shrinkTo(__classPrivateFieldGet(this, _CharArrayBuilder_length, "f"));
        return this;
    }
    /**
     * Converts the string builder to an array of characters.
     * @returns The array of characters.
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.appendString("Hello");
     * const charArray = builder.toArray();
     * console.log(charArray); // Output: Uint32Array [72, 101, 108, 108, 111]
     * ```
     */
    toArray() {
        const buffer = new Uint32Array(__classPrivateFieldGet(this, _CharArrayBuilder_length, "f"));
        buffer.set(__classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f").slice(0, __classPrivateFieldGet(this, _CharArrayBuilder_length, "f")));
        return buffer;
    }
    /**
     * Converts the string builder to a string.
     * @returns The string representation of the string builder.
     *
     * @example
     * ```typescript
     * import { CharArrayBuilder } from '@neotales/slices/char-array-builder';
     *
     * const builder = new CharArrayBuilder();
     * builder.appendString("Hello, World!");
     * const str = builder.toString();
     * console.log(str); // Output: "Hello, World!"
     * ```
     */
    toString() {
        return String.fromCodePoint(...__classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f").slice(0, __classPrivateFieldGet(this, _CharArrayBuilder_length, "f")));
    }
    /**
     * Increases the capacity of the string builder, if necessary, to accommodate the specified capacity.
     * @param capacity The minimum capacity to ensure.
     * @private
     */
    grow(capacity) {
        if (capacity <= __classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f").length) {
            return this;
        }
        capacity = Math.max(capacity, __classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f").length * 2);
        const newBuffer = new Uint32Array(capacity);
        newBuffer.set(__classPrivateFieldGet(this, _CharArrayBuilder_buffer, "f"));
        __classPrivateFieldSet(this, _CharArrayBuilder_buffer, newBuffer, "f");
        return this;
    }
}
_CharArrayBuilder_buffer = new WeakMap(), _CharArrayBuilder_length = new WeakMap();
