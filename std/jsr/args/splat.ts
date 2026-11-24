/**
 * The `splat` module provides a function to convert an object
 * to an array of command line arguments. Useful for building CLI
 * commands programmatically with type safety.
 *
 * @example Basic usage
 * ```ts
 * import { splat } from "@neotales/args/splat";
 *
 * splat({ version: true });  // ["--version"]
 * splat({ output: "file.txt" });  // ["--output", "file.txt"]
 * splat({ f: true });  // ["-f"] (short flag)
 * ```
 *
 * @example With commands and options
 * ```ts
 * import { splat, SplatSymbols } from "@neotales/args/splat";
 *
 * splat({
 *   [SplatSymbols.command]: "git clone",
 *   depth: 1,
 *   branch: "main"
 * });  // ["git", "clone", "--depth", "1", "--branch", "main"]
 * ```
 *
 * @example With positional and extra arguments
 * ```ts
 * import { splat } from "@neotales/args/splat";
 *
 * splat({
 *   "*": ["src", "dest"],  // positional args
 *   recursive: true,
 *   "--": ["--verbose"]  // extra args after --
 * });  // ["src", "dest", "--recursive", "--", "--verbose"]
 * ```
 *
 * @module
 */

import { dasherize } from "@neotales/strings/dasherize";
import { split } from "./split.ts";

/**
 * Options for the {@linkcode splat} function.
 */
export interface SplatOptions extends Record<string, unknown> {
  /**
   * The subcommand command to execute.
   */
  command?: string[] | string;
  /**
   * The prefix to use for commandline options. Defaults to `"--"`.
   */
  prefix?: string;

  /**
   * Treats the args as options that emit values.
   */
  noargs?: string[] | boolean;

  /**
   * The values for true and false for args.
   */
  noFlagValues?: { t?: string; f?: string };

  /**
   * A lookup of aliases to remap the keys of the object
   * to the actual commandline option.  e.g. `{ "yes": "-y" }`
   * will map `{ yes: true }` to `["-y"]`.
   */
  aliases?: Record<string, string>;
  /**
   * The assigment token to use with options that have a value. The default
   * is to use a space. The common overrides are `":"` and `"="`.
   * This will turn `{ foo: "bar" }` into `["--foo", "bar"]` by default. If
   * assigned to `"="` it will become `["--foo=bar"]`.
   */
  assign?: string;
  /**
   * Whether to preserve the case of the keys. Defaults to `false`.
   */
  preserveCase?: boolean;

  /**
   * Whether to use short args. Defaults to `true`.
   */
  shortFlag?: boolean;
  /**
   * Only include the keys that are in the `includes` array. Includes
   * take precedence over excludes.
   */
  includes?: Array<string | RegExp>;
  /**
   * Exclude the keys that are in the `excludes` array.
   */
  excludes?: Array<string | RegExp>;
  /**
   * Whether to ignore args with `true` values. Defaults to `false`.
   */
  ignoreTrue?: boolean;
  /**
   * Whether to ignore args with `false` values. Defaults to `false`.
   */
  ignoreFalse?: boolean;
  /**
   * The names of positional arguments. This will gather any keys as arguments
   * in the order of the given array.
   *
   * @example
   * ```ts
   * const args = splat({ foo: "bar", baz: "qux" }, { arguments: ["foo", "baz"] });
   * console.log(args); // ["bar", "qux"]
   * ```
   */
  argumentNames?: string[];
  /**
   * Whether to append the arguments to the end of the command. Defaults to `false`.
   *
   * @example
   * ```ts
   * const args = splat({ first: 1, foo: "bar", baz: "qux" }, { arguments: ["foo", "baz"], appendArguments: true });
   * console.log(args); // ["--first", "1", "bar", "qux"]
   * ```
   */
  appendArguments?: boolean;
}

/**
 * An object that contains the options for the {@linkcode splat} function.
 *
 * @example
 * ```ts
 * const args = splat({ f: "bar", splat: { shortFlag: true } });
 * console.log(args); // ["-f", "bar"]
 * ```
 */
export interface SplatObject extends Record<string | symbol | number, unknown> {
  splat?: SplatOptions;
}

/**
 * Special keys in a splat object that use
 * symbols to avoid conflicts with other keys
 * and to provide a way to access the values.
 *
 * @example
 * ```ts
 *
 * const args = {
 *   [SplatSymbols.command]: "run",
 *   [SplatSymbols.arguments]: ["task"],
 *   yes: true,
 * }
 *
 * splat(args); // ["run", "task", "--yes"]
 */
export const SplatSymbols: Record<string, symbol> = {
  command: Symbol("@@command"),
  /**
   * The key for positional arguments values
   * in a splat object.
   */
  args: Symbol("@@args"),

  /**
   * The key for argument names in a splat object.
   */
  argNames: Symbol("@@arg-names"),
  /**
   * The extra arguments key in a splat object.
   * Extra arguments use the '--' value on the
   * command line to separate the extra arguments
   * e.g. `command -- --option value`
   */
  extraArgs: Symbol("--"),
  /**
   * The remaining arguments key in a splat object.
   * These are the arguments appended to the end of
   * the command line arguments, after the arguments
   * and options, but before the extra arguments.
   */
  remainingArgs: Symbol("_"),
};

const match = (array: unknown[], value: string) =>
  array.some((element) => (element instanceof RegExp ? element.test(value) : element === value));

/**
 * Converts an object to an `string[]` of command line arguments.
 *
 * @description
 * This is a modified version of the dargs npm package.  Its useful for converting an object to an array of command line arguments
 * especially when using typescript interfaces to provide intellisense and type checking for command line arguments
 * for an executable or commands in an executable.
 *
 * The code https://github.com/sindresorhus/dargs which is under under MIT License.
 * The original code is Copyrighted under (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
 * @param object The object to convert.
 * @param options The {@linkcode SplatOptions} to use for the conversion.
 * @returns An array of command line arguments.
 * @example
 * ```ts
 * let args = splat({ foo: "bar" });
 * console.log(args); // ["--foo", "bar"]
 *
 * args = splat({
 *     '*': ['foo', 'bar'], // positional arguments
 *     foo: "bar", // option
 *     yes: true, // flag
 *     '_': ["baz"], // remaining arguments
 *     '--': ["--baz"], // extra arguments
 * })
 *
 * console.log(args); // ["foo", "bar", "--foo", "bar", "--yes", "baz", "--", "--baz"]
 *
 * args = splat({
 *     [SplatSymbols.command]: "run",
 *     [SplatSymbols.arguments]: ["task1", "task2"],
 *     yes: true
 * });
 *
 * console.log(args); // ["run", "task", "task2" "--yes"]
 *
 * args = splat({
 *     "foo": "bar",
 *      "test": "baz",
 *      splat: {
 *          argumentNames: ["foo"],
 *          assign: "=",
 *      }
 * })
 *
 * console.log(args); // ["bar", "--foo=baz"]
 *
 * ```
 */
export function splat(object: SplatObject, options?: SplatOptions): string[] {
  const optionValues: string[] = [];
  const splatted: string[] = [];
  let remainingArgs: unknown[] = [];
  let extraArgs: unknown[] = [];

  if (object.splat) {
    options = {
      ...object.splat,
      ...options,
    };

    delete object.splat;
  }

  options = {
    shortFlag: true,
    prefix: "--",
    ...options,
  };

  let commands: string[] = [];
  let argumentNames: string[] = [];
  if (options.command) {
    if (typeof options.command === "string") {
      commands = split(options.command);
    } else {
      commands = options.command;
    }
  }

  if (options.argumentNames) {
    argumentNames = options.argumentNames;
  }

  if (object[SplatSymbols.argNames] && Array.isArray(object[SplatSymbols.argNames])) {
    argumentNames = object[SplatSymbols.argNames] as string[];
  }

  if (object[SplatSymbols.command]) {
    if (typeof object[SplatSymbols.command] === "string") {
      commands = split(object[SplatSymbols.command] as string);
    } else if (Array.isArray(object[SplatSymbols.command])) {
      commands = object[SplatSymbols.command] as string[];
    }
  }

  if (object[SplatSymbols.remainingArgs] && Array.isArray(object[SplatSymbols.remainingArgs])) {
    remainingArgs = object[SplatSymbols.remainingArgs] as string[];
  }

  if (object[SplatSymbols.extraArgs] && Array.isArray(object[SplatSymbols.extraArgs])) {
    extraArgs = object[SplatSymbols.extraArgs] as string[];
  }

  const makeArguments = (key: string, value?: unknown) => {
    const prefix = options?.shortFlag && key.length === 1 ? "-" : options?.prefix;
    const theKey = options?.preserveCase ? key : dasherize(key);

    key = prefix + theKey;

    if (options?.assign) {
      optionValues.push(key + (value ? `${options.assign}${value}` : ""));
    } else {
      optionValues.push(key);
      if (value) {
        optionValues.push(String(value));
      }
    }
  };

  const makeAliasArg = (key: string, value?: unknown) => {
    if (!key.startsWith("-") && !key.startsWith("/")) {
      key = "-" + key;
    }

    if (options?.assign) {
      optionValues.push(`${key}${options.assign}${value}`);
    } else {
      optionValues.push(`${key}`);
      if (value) {
        optionValues.push(String(value));
      }
    }
  };

  let isNoFlag = (_key: string): boolean => {
    return false;
  };

  if (options.noargs !== undefined) {
    if (options.noFlagValues === undefined) {
      options.noFlagValues = { t: "true", f: "false" };
    }

    if (Array.isArray(options.noargs)) {
      isNoFlag = (key) => (options.noargs as string[]).includes(key);
    } else {
      isNoFlag = (_key) => true;
    }
  }

  let positionalArgs: unknown[] = [];
  if (object[SplatSymbols.args] && Array.isArray(object[SplatSymbols.args])) {
    positionalArgs = object[SplatSymbols.args] as unknown[];
  } else if (argumentNames.length > 0) {
    positionalArgs.length = argumentNames.length;
  }

  for (let [key, value] of Object.entries(object)) {
    let pushArguments = makeArguments;

    if (typeof key === "symbol") {
      continue;
    }

    if (key === "*") {
      if (Array.isArray(value)) {
        positionalArgs.push(...value);
      }
      if (typeof value === "string") {
        positionalArgs.push(value);
      }

      continue;
    }

    if (argumentNames.length && argumentNames.includes(key)) {
      // ensure the order of the arguments
      let index = argumentNames.indexOf(key);
      if (value) {
        if (Array.isArray(value)) {
          for (const val of value) {
            positionalArgs[index++] = String(val);
          }
          continue;
        }

        positionalArgs[index] = String(value);
      }

      continue;
    }

    if (Array.isArray(options.excludes) && match(options.excludes, key)) {
      continue;
    }

    if (Array.isArray(options.includes) && !match(options.includes, key)) {
      continue;
    }

    if (typeof options.aliases === "object" && options.aliases[key]) {
      key = options.aliases[key];
      pushArguments = makeAliasArg;
    }

    if (key === "--") {
      if (!Array.isArray(value)) {
        throw new TypeError(`Expected key \`--\` to be Array, got ${typeof value}`);
      }

      extraArgs = value;
      continue;
    }

    if (key === "_") {
      if (typeof value === "string") {
        remainingArgs = [value];
        continue;
      }

      if (!Array.isArray(value)) {
        throw new TypeError(`Expected key \`_\` to be Array, got ${typeof value}`);
      }

      remainingArgs = value;
      continue;
    }

    if (value === true && !options.ignoreTrue) {
      if (isNoFlag(key)) {
        pushArguments(key, options.noFlagValues?.t);
      } else {
        pushArguments(key);
      }
    }

    if (value === false && !options.ignoreFalse) {
      if (isNoFlag(key)) {
        pushArguments(key, options.noFlagValues?.f);
      } else {
        pushArguments(`no-${key}`);
      }
    }

    if (typeof value === "string") {
      pushArguments(key, value);
    }

    if (typeof value === "number" && !Number.isNaN(value)) {
      pushArguments(key, String(value));
    }

    if (typeof value === "bigint" && !Number.isNaN(value)) {
      pushArguments(key, String(value));
    }

    if (Array.isArray(value)) {
      for (const arrayValue of value) {
        pushArguments(key, arrayValue);
      }
    }
  }

  if (commands.length) {
    splatted.push(...commands);
  }

  const normalizedArgs: string[] = [];
  // ensure the order of the arguments
  for (const arg of positionalArgs) {
    if (arg) {
      if (Array.isArray(arg)) {
        normalizedArgs.push(...arg.map((a) => String(a)));
      } else {
        normalizedArgs.push(String(arg));
      }
    }
  }

  if (!options.appendArguments && normalizedArgs.length) {
    splatted.push(...normalizedArgs);
  }

  if (optionValues.length) {
    splatted.push(...optionValues);
  }

  if (options.appendArguments && normalizedArgs.length) {
    splatted.push(...normalizedArgs);
  }

  for (const argument of remainingArgs) {
    splatted.push(String(argument));
  }

  if (extraArgs.length > 0) {
    splatted.push("--");
  }

  for (const argument of extraArgs) {
    splatted.push(String(argument));
  }

  return splatted;
}
