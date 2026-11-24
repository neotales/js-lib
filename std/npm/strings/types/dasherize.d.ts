/**
 * The dasherize function converts a string to kebab case by replacing
 * spaces, dashes, and underscores with dashes. It also converts
 * pascal case to kebab case. This is primarily used for converting
 * code to kebab case.
 * @module
 */
import { type DasherizeOptions } from "@neotales/slices/dasherize";
/**
 * Dasherizes the string by replacing ' ', '-' and '_' with '-' and converting
 * pascal case to kebab case. This is primarily for converting code to
 * kebab case.
 * @param value The string to dasherize.
 * @param options The options for dasherizing the string
 * @returns The dasherized string.
 *
 * @example
 * ```typescript
 * import { dasherize } from "@neotales/strings";
 *
 * dasherize("helloWorld");     // "hello-world"
 * dasherize("HelloWorld");     // "hello-world"
 * dasherize("hello_world");    // "hello-world"
 * dasherize("hello world");    // "hello-world"
 * ```
 */
export declare function dasherize(value: string, options?: DasherizeOptions): string;
