import { type CharBuffer } from "./utils.js";
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
export declare class CharArrayBuilder {
    #private;
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
    constructor(capacity?: number);
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
    get length(): number;
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
    append(value: CharBuffer | number | Date | boolean | bigint): this;
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
    appendChar(value: number): this;
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
    appendSlice(value: CharBuffer): this;
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
    appendString(value: string): void;
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
    appendCharArray(value: Uint32Array): void;
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
    appendLine(value?: CharBuffer): this;
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
    shrinkTo(capacity: number): this;
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
    clear(): this;
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
    trimExcess(): this;
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
    toArray(): Uint32Array;
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
    toString(): string;
    /**
     * Increases the capacity of the string builder, if necessary, to accommodate the specified capacity.
     * @param capacity The minimum capacity to ensure.
     * @private
     */
    private grow;
}
