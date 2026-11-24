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

type RuntimeGlobals = {
  Deno?: { args: string[] };
  process?: { argv: string[] };
};

const globals = globalThis as typeof globalThis & RuntimeGlobals;

function runtimeArgs(): string[] {
  if (globals.Deno) return globals.Deno.args;
  return globals.process?.argv.slice(2) ?? [];
}

function isOption(value: string): boolean {
  return value.length > 1 && value.startsWith("-") && value !== "-";
}

function optionNames(name: string, aliases: Map<string, string[]>): string[] {
  return [name, ...(aliases.get(name) ?? [])];
}

function addAlias(aliases: Map<string, string[]>, key: string, values: string | string[]): void {
  const all = [key, ...(Array.isArray(values) ? values : [values])];
  for (const name of all) {
    aliases.set(
      name,
      all.filter((item) => item !== name),
    );
  }
}

function hasName(name: string, names?: string[] | boolean): boolean {
  return names === true || (Array.isArray(names) && names.includes(name));
}

function coerceValue(name: string, value: string | boolean, options: ParseOptions): PrimitiveValue {
  if (typeof value === "boolean" || hasName(name, options.string)) return value;
  if (hasName(name, options.number)) {
    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? value : numberValue;
  }
  if (value === "true") return true;
  if (value === "false") return false;
  return /^-?(?:\d+|\d*\.\d+)$/.test(value) ? Number(value) : value;
}

function setValue(
  result: ParsedArgs,
  name: string,
  value: PrimitiveValue,
  aliases: Map<string, string[]>,
): void {
  for (const key of optionNames(name, aliases)) {
    const current = result[key] as ParsedArgValue | undefined;
    if (current === undefined) result[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else result[key] = [current, value];
  }
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
export function parse(
  argsOrOptions?: string[] | ParseOptions,
  maybeOptions: ParseOptions = {},
): ParsedArgs {
  const options = Array.isArray(argsOrOptions)
    ? { ...maybeOptions, args: argsOrOptions }
    : (argsOrOptions ?? {});
  const args = options.args ?? runtimeArgs();
  const aliases = new Map<string, string[]>();
  const result: ParsedArgs = { _: [] };

  if (options["--"]) result["--"] = [];
  for (const [key, value] of Object.entries(options.alias ?? {})) addAlias(aliases, key, value);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      const rest = args.slice(i + 1);
      if (options["--"]) result["--"]?.push(...rest);
      else result._.push(...rest);
      break;
    }
    if (!isOption(arg)) {
      result._.push(arg);
      if (options.stopEarly) result._.push(...args.slice(i + 1));
      if (options.stopEarly) break;
      continue;
    }
    if (arg.startsWith("--no-") && !arg.includes("=")) {
      setValue(result, arg.slice(5), false, aliases);
      continue;
    }
    if (arg.startsWith("--")) {
      const option = arg.slice(2);
      const equalsIndex = option.indexOf("=");
      const name = equalsIndex === -1 ? option : option.slice(0, equalsIndex);
      const value = equalsIndex === -1 ? undefined : option.slice(equalsIndex + 1);
      if (value !== undefined) {
        setValue(result, name, coerceValue(name, value, options), aliases);
      } else if (
        hasName(name, options.boolean) ||
        args[i + 1] === undefined ||
        isOption(args[i + 1])
      ) {
        setValue(result, name, true, aliases);
      } else {
        setValue(result, name, coerceValue(name, args[++i]!, options), aliases);
      }
      continue;
    }
    const short = arg.slice(1);
    const equalsIndex = short.indexOf("=");
    if (equalsIndex !== -1) {
      const name = short.slice(0, equalsIndex);
      setValue(result, name, coerceValue(name, short.slice(equalsIndex + 1), options), aliases);
    } else if (short.length > 1) {
      for (const name of short) setValue(result, name, true, aliases);
    } else if (
      hasName(short, options.boolean) ||
      args[i + 1] === undefined ||
      isOption(args[i + 1])
    ) {
      setValue(result, short, true, aliases);
    } else {
      setValue(result, short, coerceValue(short, args[++i]!, options), aliases);
    }
  }

  for (const [key, value] of Object.entries(options.default ?? {})) {
    if (result[key] !== undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) setValue(result, key, item, aliases);
    } else {
      setValue(result, key, value, aliases);
    }
  }
  return result;
}
