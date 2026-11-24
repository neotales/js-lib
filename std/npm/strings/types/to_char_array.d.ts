import { type CharBuffer } from "@neotales/slices/utils";
/**
 * Converts a string to a `Uint32Array` of Unicode code points.
 * @param value The string to convert.
 * @returns A code-point array.
 *
 * @example
 * ```typescript
 * import { toCharArray } from "@neotales/strings";
 *
 * [...toCharArray("a😀")]; // [97, 128512]
 * ```
 */
export declare function toCharArray(value: string): Uint32Array;
/**
 * Converts a character buffer to a string.
 * @param value The character buffer to convert.
 * @returns The string value.
 *
 * @example
 * ```typescript
 * import { toString } from "@neotales/strings";
 *
 * toString([97, 98, 99]); // "abc"
 * ```
 */
export declare function toString(value: CharBuffer): string;
