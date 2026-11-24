/**
 * Parses a dotenv-formatted string and returns a record of key-value pairs.
 *
 * This is a convenience wrapper around {@linkcode parseDocument} that returns
 * only the key-value pairs, discarding comments and formatting.
 *
 * @param source - The dotenv-formatted string to parse.
 * @returns A record where keys are variable names and values are their string values.
 *
 * @example Parse a dotenv string
 * ```ts
 * import { parse } from "@neotales/dotenv";
 *
 * const env = parse(`
 * # Configuration
 * API_KEY="secret123"
 * DEBUG=true
 * `);
 * console.log(env.API_KEY); // "secret123"
 * console.log(env.DEBUG); // "true"
 * ```
 */
export declare function parse(source: string): Record<string, string>;
