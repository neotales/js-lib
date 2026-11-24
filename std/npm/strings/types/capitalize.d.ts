/**
 * This module provides a function to capitalize the first letter of a string.
 * It is primarily used for converting code to capitalized case.
 * @module
 */
import { type CapitalizeOptions } from "@neotales/slices/capitalize";
/**
 * Capitalizes the first letter of the string.
 * @param value The string to capitalize.
 * @param options The options for capitalizing the string.
 * @returns The capitalized string.
 *
 * @example
 * ```typescript
 * import { capitalize } from "@neotales/strings";
 *
 * capitalize("hello");         // "Hello"
 * capitalize("hello world");   // "Hello world"
 * capitalize("HELLO");         // "Hello"
 * ```
 */
export declare function capitalize(value: string, options?: CapitalizeOptions): string;
