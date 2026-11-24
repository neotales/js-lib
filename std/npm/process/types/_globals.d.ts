type DenoReader = {
    read(data: Uint8Array): Promise<number | null>;
    readSync(data: Uint8Array): number | null;
    isTerminal(): boolean;
    close(): void;
};
type DenoWriter = {
    write(data: Uint8Array): Promise<number>;
    writeSync(data: Uint8Array): number;
    isTerminal(): boolean;
    close(): void;
};
type DenoRuntime = {
    args: string[];
    pid: number;
    ppid: number;
    cwd(): string;
    chdir(directory: string): void;
    exit(code?: number): never;
    execPath(): string;
    build: {
        os: string;
    };
    stdin: DenoReader;
    stdout: DenoWriter;
    stderr: DenoWriter;
};
type BrowserWindow = {
    close?(): void;
    location: {
        pathname: string;
    };
};
type RuntimeGlobals = typeof globalThis & {
    Bun?: unknown;
    Deno?: DenoRuntime;
    /** QuickJS-ng exposes the script filename followed by user arguments here. */
    scriptArgs?: string[];
    /** QuickJS-ng and JerryScript expose host output as `print`. */
    print?: (...values: unknown[]) => void;
    /** QuickJS-ng's argv0 is the runtime executable path. */
    argv0?: string;
    navigator?: unknown;
    process?: NodeJS.Process;
    /** QuickJS-ng's optional `--std` standard library globals. */
    std?: QuickJSStd;
    os?: QuickJSOs;
    /** txiki.js runtime namespace. */
    tjs?: TxikiRuntime;
    window?: BrowserWindow;
};
type QuickJSFile = {
    read(buffer: ArrayBuffer, offset?: number, length?: number): number;
    write(buffer: ArrayBuffer, offset?: number, length?: number): number;
    fileno(): number;
    close(): void;
};
type QuickJSStd = {
    in: QuickJSFile;
    out: QuickJSFile;
    err: QuickJSFile;
    exit(code?: number): never;
};
type QuickJSOs = {
    getpid(): number;
    getcwd(): [string, number];
    chdir(path: string): number;
    exePath(): string;
    isatty(fd: number): boolean;
};
type TxikiStream = {
    getReader(): {
        read(): Promise<{
            value?: Uint8Array;
            done: boolean;
        }>;
    };
    getWriter(): {
        write(data: Uint8Array): Promise<void>;
    };
};
type TxikiRuntime = {
    args: string[];
    pid: number;
    ppid: number;
    cwd: string;
    chdir(path: string): void;
    exePath: string;
    exit(code?: number): never;
    stdin: TxikiStream;
    stdout: TxikiStream;
    stderr: TxikiStream;
};
export declare const globals: RuntimeGlobals;
export declare const isBrowser: boolean;
/**
 * Resolves a Node builtin module synchronously.
 *
 * Node exposes builtins through `process.getBuiltinModule`, which lets this module avoid
 * top-level `await import()` and stay loadable in engines that only support classic
 * scripts. Hosts that do not implement the accessor return `undefined`; callers handle that
 * as an unsupported capability.
 *
 * @template T The builtin module type.
 * @param name The builtin module specifier, for example `node:fs`.
 * @returns The builtin module, or `undefined` when the host cannot provide it.
 */
export declare function getBuiltinModule<T>(name: string): T | undefined;
export {};
