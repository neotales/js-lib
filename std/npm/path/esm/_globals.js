export const globals = globalThis;
// Prefer process when present so Node and Bun take precedence over Deno shims.
export const isWindows = globals.process?.platform?.startsWith("win") ||
    globals.Deno?.build?.os === "windows" ||
    globals.navigator?.platform?.startsWith("Win") ||
    false;
export function cwd(errorMessage) {
    const getCwd = globals.process?.cwd ?? globals.Deno?.cwd;
    if (typeof getCwd !== "function") {
        throw new TypeError(errorMessage);
    }
    return getCwd();
}
