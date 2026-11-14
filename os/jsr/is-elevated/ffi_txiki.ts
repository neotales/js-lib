/**
 * Windows elevation through txiki.js `tjs:ffi`.
 *
 * @module @neotales/is-elevated/ffi_txiki
 * @internal
 */

interface TxikiLibrary {
  symbols: Record<string, (...args: unknown[]) => unknown>;
  close(): void;
}

interface TxikiFfi {
  dlopen(
    name: string,
    symbols: Record<string, { args?: string[]; returns?: string }>,
  ): TxikiLibrary;
}

const specifier = "tjs:ffi";
let ffi: TxikiFfi;

try {
  ffi = await import(/* @vite-ignore */ specifier) as TxikiFfi;
} catch (cause) {
  throw new Error(
    "Unable to load tjs:ffi. See https://github.com/neotales/js-lib/blob/dev/os/jsr/is-elevated/README.md#runtime-support",
    { cause },
  );
}

let elevated: boolean | undefined;

/**
 * Reports whether the current process is running with elevated privileges.
 *
 * @param cache - Whether to reuse the result from the first evaluation.
 * @returns Whether the process has elevated privileges.
 */
export function evalIsProcessElevated(cache = true): boolean {
  if (cache && elevated !== undefined) return elevated;

  const advapi32 = ffi.dlopen("Advapi32.dll", {
    OpenProcessToken: { args: ["ptr", "u32", "buffer"], returns: "bool_u32" },
    GetTokenInformation: { args: ["ptr", "u32", "buffer", "u32", "buffer"], returns: "bool_u32" },
  });
  const kernel32 = ffi.dlopen("Kernel32.dll", {
    GetCurrentProcess: { args: [], returns: "ptr" },
    CloseHandle: { args: ["ptr"], returns: "bool_u32" },
    GetLastError: { args: [], returns: "u32" },
  });

  try {
    const TOKEN_QUERY = 0x0008;
    const TOKEN_ELEVATION = 20;
    const tokenHandle = new Uint8Array(8);
    const opened = advapi32.symbols.OpenProcessToken(
      kernel32.symbols.GetCurrentProcess(),
      TOKEN_QUERY,
      tokenHandle,
    );
    if (!opened) throw new Error(`Failed to open process token (${kernel32.symbols.GetLastError()})`);

    try {
      const tokenInfo = new Uint8Array(4);
      const returnLength = new Uint8Array(4);
      const result = advapi32.symbols.GetTokenInformation(
        tokenHandle,
        TOKEN_ELEVATION,
        tokenInfo,
        4,
        returnLength,
      );
      if (!result) throw new Error(`Failed to get token information (${kernel32.symbols.GetLastError()})`);
      elevated = tokenInfo[0] !== 0;
      return elevated;
    } finally {
      kernel32.symbols.CloseHandle(tokenHandle);
    }
  } finally {
    advapi32.close();
    kernel32.close();
  }
}
