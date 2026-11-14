/**
 * Utiltity functions for working with character buffers.
 *
 * @module
 */
/**
 * A contract for a type that can be used as a slice of characters.
 */
export interface CharSliceLike {
    at(index: number): number | undefined;
    length: number;
}
/**
 * A contract for a type that can be used as a sequence of characters.
 */
export interface CharSequence extends CharSliceLike {
    slice(start: number, end?: number): CharSequence;
}
/**
 * A contract for a type that can be used as a buffer of characters
 * such as a string, Uint32Array, Uint16Array, Uint8Array, or CharSequence.
 */
export type CharBuffer = string | Uint32Array | Uint16Array | Uint8Array | CharSequence;
/**
 * Converts a string to a Uint32Array of characters.
 * Each element represents a Unicode code point, properly handling
 * characters outside the BMP (like emoji) that use surrogate pairs.
 * @param s The string to convert.
 * @returns The Uint32Array of characters (code points)
 */
export declare function toCharArray(s: string): Uint32Array;
/**
 * Converts a CharBuffer to a string.
 * @param buffer The character buffer to convert.
 * @returns The string.
 */
export declare function toString(buffer: CharBuffer): string;
/**
 * Converts a CharBuffer to a CharSliceLike interface.
 * @param buffer The character buffer to convert.
 * @returns The slice.
 */
export declare function toCharSliceLike(buffer: CharBuffer): CharSliceLike;
