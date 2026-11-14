/**
 * The `camelize` module provides a function to convert strings to camelCase.
 * Handles snake_case, kebab-case, and space-separated words.
 *
 * @example Basic usage
 * ```ts
 * import { camelize } from "@neotales/slices/camelize";
 *
 * String.fromCodePoint(...camelize("hello_world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello-world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello world"));  // "helloWorld"
 * ```
 *
 * @module
 */
import { type CharBuffer } from "./utils.js";
/**
 * Options for the `camelize` function.
 */
export interface CamelizeOptions {
    /**
     * If true, preserves the case of characters that are not the first character
     * or immediately after a separator. By default, those characters are lowercased.
     */
    preserveCase?: boolean;
}
/**
 * Converts a string to camelCase. Handles snake_case, kebab-case, and
 * space-separated words by removing separators and capitalizing the
 * following character.
 *
 * The first character is always lowercased. Characters after separators
 * (`_`, `-`, or space) are uppercased.
 *
 * @param value - The string to convert to camelCase.
 * @param options - Options to control case handling.
 * @returns The camelCase string as a Uint32Array.
 *
 * @example Basic conversions
 * ```ts
 * String.fromCodePoint(...camelize("hello_world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello-world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("HelloWorld"));   // "helloWorld"
 * ```
 *
 * @example Multiple separators
 * ```ts
 * String.fromCodePoint(...camelize("hello__world"));  // "helloWorld"
 * String.fromCodePoint(...camelize("hello--world"));  // "helloWorld"
 * ```
 *
 * @example With numbers
 * ```ts
 * String.fromCodePoint(...camelize("hello_world_123"));  // "helloWorld123"
 * String.fromCodePoint(...camelize("version_2_0"));  // "version20"
 * ```
 *
 * @example With Unicode
 * ```ts
 * String.fromCodePoint(...camelize("café_latte"));  // "caféLatte"
 * String.fromCodePoint(...camelize("über_mensch"));  // "überMensch"
 * ```
 */
export declare function camelize(value: CharBuffer | string, options?: CamelizeOptions): Uint32Array;
