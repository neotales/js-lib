/**
 * The pascalize module provides a function to convert a string to pascal case.
 *
 * @module
 */
/**
 * Converts the string to pascal case. This is primarily for converting
 * code to pascal case.
 * @param value The string to pascalize.
 * @returns A string in pascal case.
 *
 * @example
 * ```typescript
 * import { pascalize } from "@neotales/strings";
 *
 * pascalize("hello world");    // "HelloWorld"
 * pascalize("hello_world");    // "HelloWorld"
 * pascalize("hello-world");    // "HelloWorld"
 * pascalize("helloWorld");     // "HelloWorld"
 * ```
 */
export declare function pascalize(value: string): string;
