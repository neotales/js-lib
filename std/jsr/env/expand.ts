/**
 * The `expand` module provides functionality for expanding variables in strings
 *
 * @module
 */
import { getRuntimeArgs, globals, loadChildProcess, WINDOWS } from "./globals.ts";
import { StringBuilder } from "@neotales/strings/string-builder";
import { CHAR_BACKWARD_SLASH, CHAR_PERCENT, CHAR_UNDERSCORE } from "@neotales/chars/constants";
import { split } from "@neotales/args/split";

/**
 * Options for variable substitution.
 */
export interface SubstitutionOptions {
  /**
   * Enables or disables Windows-style variable expansion.
   * @default true
   */
  windowsExpansion?: boolean;

  /**
   * Enables or disables bash-style variable expansion.
   * @default true
   */
  variableExpansion?: boolean;

  /**
   * Enables or disables Unix-style variable assignment.
   * @default true
   */
  variableAssignment?: boolean;

  /**
   * Enables or disables Unix-style custom error messages.
   * @default true
   */
  customErrorMessage?: boolean;

  /**
   * Enables or disables bash-style argument expansion.
   * @default true
   */
  argsExpansion?: boolean;

  /** Command substitution configuration. It executes local commands, so enable it only for trusted templates. */
  commands?: boolean | Array<string | string[]> | CommandsOptions;

  /**
   * A function that retrieves the value of an environment variable.
   * Setting this option overrides the default behavior
   * @param key - The name of the environment variable.
   * @returns The value of the environment variable, or `undefined` if it is not set.
   */
  get?: (key: string) => string | undefined;

  /**
   * A function that sets the value of an environment variable.
   * Setting this option overrides the default behavior.
   * @param key - The name of the environment variable.
   * @param value - The value to set.
   */
  set?: (key: string, value: string) => void;
}

/** Configuration for command substitution. */
export interface CommandsOptions {
  /** Enables command substitution. */
  enabled?: boolean;
  /** Runs substitutions through the platform shell. */
  shell?: boolean;
  /** Permitted executables or command-token prefixes. */
  allowed?: Array<string | string[]>;
  /** Maximum execution time in milliseconds, where supported by the runtime. */
  timeout?: number;
  /** Maximum command output size in bytes. */
  maxSize?: number;
}

/** Resolves URL-like values during async expansion. */
export type ProtocolHandler = (url: string) => string | Promise<string>;

/** Options for async variable substitution. */
export interface AsyncSubstitutionOptions extends SubstitutionOptions {
  /** Resolves URL-like expanded values before they are returned. */
  protocolHandler?: ProtocolHandler;
}

/** Thrown when a command substitution does not match `allowedCommands`. */
export class UnpermittedCommandError extends Error {
  /** The command that was rejected. */
  readonly command: string;

  constructor(command: string) {
    // The command text can contain a secret, so it is not repeated in the
    // message. Callers that catch this class must not log `command`.
    super("Unpermitted command");
    this.name = "UnpermittedCommandError";
    this.command = command;
  }
}

enum TokenKind {
  None,
  Windows,
  BashVariable,
  BashInterpolation,
  CommandSubstitution,
}

const dollar = 36;
const openBrace = 123;
const closeBrace = 125;
const openParen = 40;
const closeParen = 41;
const percent = CHAR_PERCENT;
const min = 0;
const backslash = CHAR_BACKWARD_SLASH;

function isLetterOrDigit(c: number): boolean {
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57);
}

function isValidBashVariable(value: string) {
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);

    if (i == 0 && !((c >= 65 && c <= 90) || (c >= 97 && c <= 122))) {
      return false;
    }

    if (!isLetterOrDigit(c) && c != 95) {
      return false;
    }
  }

  return true;
}

function commandOptions(
  value: SubstitutionOptions["commands"],
): Required<Pick<CommandsOptions, "enabled" | "shell">> & CommandsOptions {
  if (typeof value === "boolean") return { enabled: value, shell: false };
  if (Array.isArray(value)) return { allowed: value, enabled: true, shell: false };
  return { enabled: value?.enabled ?? false, shell: value?.shell ?? false, ...value };
}

function assertPermittedCommand(command: string, options: CommandsOptions): void {
  if (options.allowed === undefined) return;

  const tokens = split(command);
  const permitted = options.allowed.some((allowed) => {
    if (typeof allowed === "string") return tokens[0] === allowed;
    return allowed.length > 0 && allowed.every((token, index) => tokens[index] === token);
  });
  if (!permitted) throw new UnpermittedCommandError(command);
}

function commandFailure(code?: number | null, signal?: string | null): Error {
  if (signal) return new Error(`Command substitution terminated by signal ${signal}.`);
  return new Error(`Command substitution failed with exit code ${code ?? "unknown"}.`);
}

function runCommand(command: string, options: CommandsOptions) {
  if (command.length === 0) {
    return "";
  }

  if (options.allowed !== undefined && options.shell) {
    throw new TypeError(
      "commands.allowed cannot be combined with commands.shell: a shell string is not an argument vector.",
    );
  }

  assertPermittedCommand(command, options);

  const commandArgs = options.shell
    ? [...(WINDOWS ? ["powershell.exe", "-Command"] : ["bash", "-c"]), command]
    : split(command);
  const exe = commandArgs.shift() ?? "";
  if (!exe) return "";

  if (globals.Deno) {
    const cmd = new globals.Deno.Command(exe, {
      args: commandArgs,
      stdout: "piped",
      stderr: "piped",
    });

    const o1 = cmd.outputSync();
    if (o1.code !== 0) throw commandFailure(o1.code);
    if (o1.stdout.length === 0) {
      return "";
    }
    return limitOutput(new TextDecoder().decode(o1.stdout), options);
  }

  if (globals.Bun?.spawnSync) {
    const child = globals.Bun.spawnSync([exe, ...commandArgs], { stderr: "pipe", stdout: "pipe" });
    if (child.error) throw child.error;
    if (child.signalCode) throw commandFailure(null, String(child.signalCode));
    if (child.exitCode !== undefined && child.exitCode !== 0) throw commandFailure(child.exitCode);
    return limitOutput(
      typeof child.stdout === "string" ? child.stdout : new TextDecoder().decode(child.stdout),
      options,
    );
  }

  const spawnSync = loadChildProcess()?.spawnSync;
  if (!spawnSync) {
    return "";
  }

  const child = spawnSync(exe, commandArgs, {
    maxBuffer: options.maxSize,
    stdio: "pipe",
    timeout: options.timeout,
  });

  if (child.error) {
    throw child.error;
  }
  if (child.signal) throw commandFailure(null, child.signal);
  if (child.status !== null && child.status !== 0) throw commandFailure(child.status);

  return limitOutput(child.stdout.toString(), options);
}

function limitOutput(output: string, options: CommandsOptions): string {
  if (options.maxSize !== undefined && new TextEncoder().encode(output).length > options.maxSize) {
    throw new Error(`Command output exceeds the maximum size of ${options.maxSize} bytes.`);
  }
  return output;
}

/**
 * Expands variables in a string using bash or windows style expansion.
 * @param template The template to expand.
 * @param get The function to get the value of a variable.
 * @param set The function to set the value of a variable.
 * @param options The substitution options for the expansion.
 * @returns The string with the expanded variables.
 */
export function expand(template: string, options?: SubstitutionOptions): string;
export function expand(
  template: string,
  get: (key: string) => string | undefined,
  set: (key: string, value: string) => void,
  options?: SubstitutionOptions,
): string;
export function expand(
  template: string,
  getOrOptions?: ((key: string) => string | undefined) | SubstitutionOptions,
  set?: (key: string, value: string) => void,
  options?: SubstitutionOptions,
): string {
  if (typeof template !== "string" || template.length === 0) {
    return "";
  }

  const o = typeof getOrOptions === "function"
    ? { ...options, get: options?.get ?? getOrOptions, set: options?.set ?? set }
    : (getOrOptions ?? {});
  o.variableExpansion ??= true;
  o.customErrorMessage ??= true;
  o.variableAssignment ??= true;
  const commands = commandOptions(o.commands);
  const getValue = o.get ?? (() => undefined);
  const setValue = o.set ?? (() => undefined);
  const tokenBuilder = new StringBuilder();
  const output = new StringBuilder();
  let kind = TokenKind.None;
  let remaining = template.length;
  for (let i = 0; i < template.length; i++) {
    remaining--;
    const c = template.charCodeAt(i);
    if (kind === TokenKind.None) {
      if (o.windowsExpansion && c === percent) {
        kind = TokenKind.Windows;
        continue;
      }

      if (o.variableExpansion) {
        const z = i + 1;
        let next = min;
        if (z < template.length) {
          next = template.charCodeAt(z);
        }

        // escape the $ character.
        if (c === backslash && next === dollar) {
          output.appendChar(dollar);
          i++;
          continue;
        }

        if (c === dollar) {
          // can't be a variable if there is no next character.

          if (commands.enabled && next === openParen && remaining > 2) {
            kind = TokenKind.CommandSubstitution;
            i++;
            remaining--;
            continue;
          }

          if (next === openBrace && remaining > 3) {
            kind = TokenKind.BashInterpolation;
            i++;
            remaining--;
            continue;
          }

          // only a variable if the next character is a letter.
          if (remaining > 0 && isLetterOrDigit(next)) {
            kind = TokenKind.BashVariable;
            continue;
          }
        }
      }

      output.appendChar(c);
      continue;
    }

    if (kind === TokenKind.Windows && c === percent) {
      if (tokenBuilder.length === 0) {
        // consecutive %, so just append both characters to match windows.
        output.appendChar(percent).appendChar(percent);
        continue;
      }

      const key = tokenBuilder.toString();
      const value = getValue(key);
      if (value !== undefined && value.length > 0) {
        output.appendString(value);
      }
      tokenBuilder.clear();
      kind = TokenKind.None;
      continue;
    }

    if (kind === TokenKind.CommandSubstitution && c === closeParen) {
      if (tokenBuilder.length === 0) {
        throw new Error("Bad substitution, missing command.");
      }

      const command = tokenBuilder.toString();
      tokenBuilder.clear();

      const outputString = runCommand(command, commands);
      if (outputString.length > 0) {
        output.appendString(outputString.trim());
      }
      kind = TokenKind.None;
      continue;
    }

    if (kind === TokenKind.BashInterpolation && c === closeBrace) {
      if (tokenBuilder.length === 0) {
        // with bash '${}' is a bad substitution.
        throw new Error("${} is a bad substitution. Variable name not provided.");
      }

      const substitution = tokenBuilder.toString();
      tokenBuilder.clear();
      let key = substitution;
      let defaultValue = "";
      let message: string | undefined = undefined;
      if (substitution.includes(":-")) {
        const parts = substitution.split(":-");
        key = parts[0];
        defaultValue = parts[1];
      } else if (substitution.includes(":=")) {
        const parts = substitution.split(":=");
        key = parts[0];
        defaultValue = parts[1];

        if (o.variableAssignment) {
          const v = getValue(key);
          if (v === undefined) {
            setValue(key, defaultValue);
          }
        }
      } else if (substitution.includes(":?")) {
        const parts = substitution.split(":?");
        key = parts[0];
        if (o.customErrorMessage) {
          message = parts[1];
        }
      } else if (substitution.includes(":")) {
        const parts = substitution.split(":");
        key = parts[0];
        defaultValue = parts[1];
      }

      if (key.length === 0) {
        throw new Error("Bad substitution, empty variable name.");
      }

      if (!isValidBashVariable(key)) {
        throw new Error(`Bad substitution, invalid variable name ${key}.`);
      }

      const value = getValue(key);
      if (value !== undefined) {
        output.appendString(value);
      } else if (message !== undefined) {
        throw new Error(message);
      } else if (defaultValue.length > 0) {
        output.appendString(defaultValue);
      } else {
        throw new Error(`Bad substitution, variable ${key} is not set.`);
      }

      kind = TokenKind.None;
      continue;
    }

    if (
      kind === TokenKind.BashVariable &&
      (!(isLetterOrDigit(c) || c === CHAR_UNDERSCORE) || remaining === 0)
    ) {
      // '\' is used to escape the next character, so don't append it.
      // its used to escape a name like $HOME\\_TEST where _TEST is not
      // part of the variable name.
      let append = c !== backslash;

      if (remaining === 0 && isLetterOrDigit(c)) {
        append = false;
        tokenBuilder.appendChar(c);
      }

      // rewind one character. Let the previous block handle $ for the next variable
      if (c === dollar) {
        append = false;
        i--;
      }

      const key = tokenBuilder.toString();
      tokenBuilder.clear();
      if (key.length === 0) {
        throw new Error("Bad substitution, empty variable name.");
      }

      const index = parseInt(key);
      if (o.argsExpansion && !isNaN(index)) {
        const args = getRuntimeArgs();
        if (index >= 0 && index < args.length) {
          output.appendString(args[index] ?? "");
        }

        if (append) {
          output.appendChar(c);
        }

        kind = TokenKind.None;
        continue;
      }

      if (!isValidBashVariable(key)) {
        throw new Error(`Bad substitution, invalid variable name ${key}.`);
      }

      const value = getValue(key);
      if (value !== undefined && value.length > 0) {
        output.appendString(value);
      }

      if (value === undefined) {
        throw new Error(`Bad substitution, variable ${key} is not set.`);
      }

      if (append) {
        output.appendChar(c);
      }

      kind = TokenKind.None;
      continue;
    }

    tokenBuilder.appendChar(c);
    if (remaining === 0) {
      if (kind === TokenKind.Windows) {
        throw new Error("Bad substitution, missing closing token '%'.");
      }

      if (kind === TokenKind.BashInterpolation) {
        throw new Error("Bad substitution, missing closing token '}'.");
      }
    }
  }

  const r = output.toString();
  output.clear().trimExcess();
  return r;
}

/**
 * Expands variables asynchronously and resolves URL-like output with an optional protocol handler.
 */
export async function expandAsync(
  template: string,
  options?: AsyncSubstitutionOptions,
): Promise<string> {
  const output = expand(template, options);
  if (!options?.protocolHandler) return output;

  const values = output.match(/[A-Za-z][A-Za-z\d+.-]*:\/\/[^\s]+/g) ?? [];
  let resolved = output;
  for (const value of values) {
    resolved = resolved.replace(value, await options.protocolHandler(value));
  }
  return resolved;
}
