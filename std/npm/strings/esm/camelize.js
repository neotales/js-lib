/**
 * The camelize module includes the camelize function for strings
 * which converts a string to camel case. It is primarily used for
 * converting code to camel case.
 *
 * @module
 */
import { camelize as og } from "@neotales/slices/camelize";
/**
 * Converts the string to camel case. This is primarily for converting
 * code to camel case.
 * @param value The string to camelize.
 * @param options The options for the function.
 * @returns A string in camel case.
 *
 * @example
 * ```typescript
 * import { camelize } from "@neotales/strings";
 *
 * camelize("hello world");     // "helloWorld"
 * camelize("HelloWorld");      // "helloworld"
 * camelize("hello_world");     // "helloWorld"
 * camelize("hello-world");     // "helloWorld"
 *
 * // Preserve original case after first character
 * camelize("hello WOrLD", { preserveCase: true }); // "helloWOrLD"
 * ```
 */
export function camelize(value, options) {
    const r = og(value, options);
    return String.fromCodePoint(...r);
}
