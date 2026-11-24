/**
 * The underscore module provides a function to convert a string to underscore case.
 *
 * @module
 */
import { type UnderScoreOptions } from "@neotales/slices/underscore";
/**
 * Converts the string to underscore case, generally from camel or pascal
 * case identifiers.
 * @param value The value to convert.
 * @param options The underscore conversion options.
 * @returns The string in underscore case.
 *
 * @example
 * ```typescript
 * import { underscore } from "@neotales/strings";
 *
 * underscore("helloWorld");     // "hello_world"
 * underscore("HelloWorld");     // "hello_world"
 * underscore("hello-world");    // "hello_world"
 *
 * // Screaming case (uppercase)
 * underscore("helloWorld", { screaming: true }); // "HELLO_WORLD"
 * ```
 */
export declare function underscore(value: string, options?: UnderScoreOptions): string;
