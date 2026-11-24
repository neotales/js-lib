export const EOL = globalThis.process?.platform === "win32" ||
    globalThis.Deno?.build?.os === "windows"
    ? "\r\n"
    : "\n";
export const globals = globalThis;
export const WINDOWS = globalThis.process?.platform === "win32" ||
    globalThis.Deno?.build?.os === "windows";
