export const globals = globalThis;
export const WINDOWS = globalThis.process?.platform === "win32" ||
    globalThis.Deno?.build?.os === "windows";
