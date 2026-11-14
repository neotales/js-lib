export const globals = globalThis;
export const WINDOWS =
  (globalThis as { process?: { platform?: string } }).process?.platform === "win32" ||
  (globalThis as { Deno?: { build?: { os?: string } } }).Deno?.build?.os === "windows";
