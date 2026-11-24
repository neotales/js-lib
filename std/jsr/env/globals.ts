type DenoCommandOutput = { code: number; stdout: Uint8Array; stderr: Uint8Array };
type DenoRuntime = {
  args: string[];
  build: { os: string };
  Command: new (
    command: string,
    options?: { args?: string[]; stdout?: "piped"; stderr?: "piped" },
  ) => { outputSync(): DenoCommandOutput };
  env: {
    get(name: string): string | undefined;
    set(name: string, value: string): void;
    delete(name: string): void;
    toObject(): Record<string, string>;
  };
};

type RuntimeProcess = NodeJS.Process & { getBuiltinModule?(module: string): unknown };
type QuickJsStd = {
  getenv(name: string): string | undefined;
  getenviron(): Record<string, string>;
  setenv(name: string, value: string): void;
  unsetenv(name: string): void;
};
type BunRuntime = {
  spawnSync(
    command: string[],
    options: { stderr: "pipe"; stdout: "pipe" },
  ): {
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
  navigator?: { platform?: string };
  process?: RuntimeProcess;
  std?: QuickJsStd;
};

export const globals = globalThis as typeof globalThis & RuntimeGlobals;
export const QUICKJS = typeof globals.std?.getenv === "function" &&
  typeof globals.std?.setenv === "function" && typeof globals.std?.unsetenv === "function" &&
  typeof globals.std?.getenviron === "function";
export const BROWSER = globals.process === undefined && globals.Deno === undefined && !QUICKJS;
export const WINDOWS = globals.Deno?.build.os === "windows" ||
  globals.process?.platform === "win32" ||
  globals.navigator?.platform?.toLowerCase().includes("win") === true;

export function getRuntimeArgs(): string[] {
  if (globals.Deno) return globals.Deno.args;
  return globals.process?.argv.slice(2) ?? [];
}

export function loadChildProcess(): typeof import("node:child_process") | undefined {
  return globals.process?.getBuiltinModule?.("node:child_process") as
    | typeof import("node:child_process")
    | undefined;
}
