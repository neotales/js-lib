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
export declare class UnpermittedCommandError extends Error {
    /** The command that was rejected. */
    readonly command: string;
    constructor(command: string);
}
/**
 * Expands variables in a string using bash or windows style expansion.
 * @param template The template to expand.
 * @param get The function to get the value of a variable.
 * @param set The function to set the value of a variable.
 * @param options The substitution options for the expansion.
 * @returns The string with the expanded variables.
 */
export declare function expand(template: string, options?: SubstitutionOptions): string;
export declare function expand(template: string, get: (key: string) => string | undefined, set: (key: string, value: string) => void, options?: SubstitutionOptions): string;
/**
 * Expands variables asynchronously and resolves URL-like output with an optional protocol handler.
 */
export declare function expandAsync(template: string, options?: AsyncSubstitutionOptions): Promise<string>;
