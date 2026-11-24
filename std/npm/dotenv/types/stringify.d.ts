/**
 * The `stringify` module provides functionality to convert an object of environment variables
 * into a dotenv-formatted string representation.
 *
 * @module
 */
/**
 * Options for stringifying environment variables.
 */
export interface StringifyOptions {
    /**
     * If `true`, uses only line feed (`\n`) as the newline character.
     * If `false`, uses the platform-specific end-of-line sequence (CRLF on Windows, LF elsewhere).
     * @default false
     */
    onlyLineFeed?: boolean;
}
/**
 * Converts an environment variables object into a dotenv-formatted string.
 *
 * Values are automatically quoted. Single quotes are preferred unless the value
 * contains single quotes or newlines, in which case double quotes are used
 * and internal double quotes are escaped.
 *
 * @param env - An object containing environment variables as key-value pairs.
 * @param options - Optional settings for stringifying.
 * @returns A dotenv-formatted string representation of the environment variables.
 *
 * @example Stringify environment variables
 * ```ts
 * import { stringify } from "@neotales/dotenv";
 *
 * const output = stringify({
 *   API_KEY: "secret",
 *   MESSAGE: "Hello\nWorld"
 * });
 * console.log(output);
 * // API_KEY='secret'
 * // MESSAGE="Hello
 * // World"
 * ```
 */
export declare function stringify(env: Record<string, string>, options?: StringifyOptions): string;
