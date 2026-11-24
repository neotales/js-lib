/**
 * A primaritve value that the parser handles.
 */
export type PrimitiveValue = boolean | number | string;
/** A scalar or repeated value produced by {@linkcode parse}. */
export type ParsedArgValue = PrimitiveValue | PrimitiveValue[];
/** Parsed command-line arguments returned by {@linkcode parse}. */
export interface ParsedArgs extends Record<string, ParsedArgValue | string[] | undefined> {
    /** Positional arguments. */
    _: string[];
    /** Arguments after `--`, when enabled with `{ "--": true }`. */
    "--"?: string[];
}
/** Options for {@linkcode parse}. */
export interface ParseOptions {
    /** Arguments to parse. Defaults to current runtime args. */
    args?: string[];
    /** Names to parse as booleans, or `true` to treat valueless options as booleans. */
    boolean?: string[] | boolean;
    /** Names whose values should remain strings even if they look like booleans or numbers. */
    string?: string[];
    /** Names whose values should be coerced to numbers when possible. */
    number?: string[];
    /** Aliases for option names. Values are mirrored across aliases. */
    alias?: Record<string, string | string[]>;
    /** Default values applied when an option was not present. */
    default?: Record<string, ParsedArgValue>;
    /** Store values after `--` in `result["--"]` instead of `result._`. */
    "--"?: boolean;
    /** Stop option parsing after the first positional argument. */
    stopEarly?: boolean;
}
/**
 * Parses command-line arguments into a JSON-like object.
 *
 * Positional arguments are in `_`, repeated options become arrays, `--no-name` becomes
 * `{ name: false }`, and `--` can be preserved separately.
 *
 * @param argsOrOptions Arguments to parse, or options containing an `args` array. If omitted,
 * current runtime args are used.
 * @param maybeOptions Options used when the first argument is an args array.
 * @returns Parsed arguments with positional values in `_`.
 */
export declare function parse(argsOrOptions?: string[] | ParseOptions, maybeOptions?: ParseOptions): ParsedArgs;
