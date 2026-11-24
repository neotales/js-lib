type DenoCommandOutput = {
    code: number;
    stdout: Uint8Array;
    stderr: Uint8Array;
};
type DenoRuntime = {
    args: string[];
    build: {
        os: string;
    };
    Command: new (command: string, options?: {
        args?: string[];
        stdout?: "piped";
        stderr?: "piped";
    }) => {
        outputSync(): DenoCommandOutput;
    };
    env: {
        get(name: string): string | undefined;
        set(name: string, value: string): void;
        delete(name: string): void;
        toObject(): Record<string, string>;
    };
};
type RuntimeProcess = NodeJS.Process & {
    getBuiltinModule?(module: string): unknown;
};
type QuickJsStd = {
    getenv(name: string): string | undefined;
    getenviron(): Record<string, string>;
    setenv(name: string, value: string): void;
    unsetenv(name: string): void;
};
type BunRuntime = {
    spawnSync(command: string[], options: {
        stderr: "pipe";
        stdout: "pipe";
    }): {
        error?: Error;
        exitCode?: number;
        signalCode?: string | number | null;
        stderr?: Uint8Array | string;
        stdout?: Uint8Array | string;
    };
};
type RuntimeGlobals = {
    Bun?: BunRuntime;
    Deno?: DenoRuntime;
    navigator?: {
        platform?: string;
    };
    process?: RuntimeProcess;
    std?: QuickJsStd;
};
export declare const globals: typeof globalThis & RuntimeGlobals;
export declare const QUICKJS: boolean;
export declare const BROWSER: boolean;
export declare const WINDOWS: boolean;
export declare function getRuntimeArgs(): string[];
export declare function loadChildProcess(): typeof import("node:child_process") | undefined;
export {};
