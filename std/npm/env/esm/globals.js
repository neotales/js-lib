export const globals = globalThis;
export const QUICKJS = typeof globals.std?.getenv === "function" &&
    typeof globals.std?.setenv === "function" && typeof globals.std?.unsetenv === "function" &&
    typeof globals.std?.getenviron === "function";
export const BROWSER = globals.process === undefined && globals.Deno === undefined && !QUICKJS;
export const WINDOWS = globals.Deno?.build.os === "windows" ||
    globals.process?.platform === "win32" ||
    globals.navigator?.platform?.toLowerCase().includes("win") === true;
export function getRuntimeArgs() {
    if (globals.Deno)
        return globals.Deno.args;
    return globals.process?.argv.slice(2) ?? [];
}
export function loadChildProcess() {
    return globals.process?.getBuiltinModule?.("node:child_process");
}
