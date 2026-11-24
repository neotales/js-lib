/**
 * The `stringify` module provides functionality to convert an object of environment variables
 * into a dotenv-formatted string representation.
 *
 * @module
 */
import { StringBuilder } from "@neotales/strings";
import { EOL } from "./globals.js";
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
export function stringify(env, options) {
    const sb = new StringBuilder();
    let i = 0;
    const o = options ?? {};
    const nl = o.onlyLineFeed ? "\n" : EOL;
    for (const key in env) {
        if (i > 0) {
            sb.append(nl);
        }
        let value = env[key];
        sb.append(key).append("=");
        let quote = "'";
        if (value.includes(quote) || value.includes("\n")) {
            quote = '"';
            value = value.replace(/"/g, '\\"');
        }
        sb.append(quote).append(value).append(quote);
        i++;
    }
    return sb.toString();
}
