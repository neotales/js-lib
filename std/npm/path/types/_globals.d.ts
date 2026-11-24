type RuntimeGlobals = typeof globalThis & {
    Deno?: {
        build?: {
            os?: string;
        };
        cwd?: () => string;
    };
    navigator?: {
        platform?: string;
    };
    process?: {
        cwd?: () => string;
        platform?: string;
    };
};
export declare const globals: RuntimeGlobals;
export declare const isWindows: boolean;
export declare function cwd(errorMessage: string): string;
export {};
