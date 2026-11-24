export const EOL =
  (globalThis as { process?: { platform?: string } }).process?.platform === "win32" ||
    (globalThis as { Deno?: { build?: { os?: string } } }).Deno?.build?.os === "windows"
    ? "\r\n"
    : "\n";
export const globals = globalThis;
export const WINDOWS =
  (globalThis as { process?: { platform?: string } }).process?.platform === "win32" ||
  (globalThis as { Deno?: { build?: { os?: string } } }).Deno?.build?.os === "windows";
