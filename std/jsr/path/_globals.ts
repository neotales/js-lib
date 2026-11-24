type RuntimeGlobals = typeof globalThis & {
  Deno?: { build?: { os?: string }; cwd?: () => string };
  navigator?: { platform?: string };
  process?: { cwd?: () => string; platform?: string };
};

export const globals: RuntimeGlobals = globalThis;

// Prefer process when present so Node and Bun take precedence over Deno shims.
export const isWindows: boolean = globals.process?.platform?.startsWith("win") ||
  globals.Deno?.build?.os === "windows" ||
  globals.navigator?.platform?.startsWith("Win") ||
  false;

export function cwd(errorMessage: string): string {
  const getCwd = globals.process?.cwd ?? globals.Deno?.cwd;
  if (typeof getCwd !== "function") {
    throw new TypeError(errorMessage);
  }
  return getCwd();
}
