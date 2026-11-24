/**
 * The underscore module provides a function to convert a string to underscore case.
 *
 * @module
 */
import { underscore as og } from "@neotales/slices/underscore";
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
export function underscore(value, options) {
    const r = og(value, options);
    return String.fromCodePoint(...r);
}
