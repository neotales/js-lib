/**
 * Implements native Windows elevation detection through Bun FFI.
 *
 * @module @neotales/is-elevated/ffi_bun
 * @internal
 */
const specifier = "bun:ffi";
let ffi;
try {
    ffi = await import(/* @vite-ignore */ specifier);
}
catch (cause) {
    throw new Error("Unable to load bun:ffi. See https://github.com/neotales/js-lib/blob/dev/os/jsr/is-elevated/README.md#runtime-support", { cause });
}
let elevated;
/**
 * Reports whether the current process is running with elevated privileges.
 *
 * @param cache - Whether to reuse the result from the first evaluation.
 * @returns Whether the process has elevated privileges.
 */
export function evalIsProcessElevated(cache = true) {
    if (cache && elevated !== undefined)
        return elevated;
    const { FFIType, dlopen, ptr } = ffi;
    const advapi32 = dlopen("Advapi32.dll", {
        OpenProcessToken: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.bool },
        GetTokenInformation: {
            args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr],
            returns: FFIType.bool,
        },
    });
    const kernel32 = dlopen("Kernel32.dll", {
        GetCurrentProcess: { args: [], returns: FFIType.ptr },
        CloseHandle: { args: [FFIType.ptr], returns: FFIType.bool },
        GetLastError: { args: [], returns: FFIType.i32 },
    });
    try {
        const TOKEN_QUERY = 0x0008;
        const TOKEN_ELEVATION = 20;
        const tokenHandle = new BigUint64Array(1);
        const opened = advapi32.symbols.OpenProcessToken(kernel32.symbols.GetCurrentProcess(), TOKEN_QUERY, ptr(tokenHandle));
        if (!opened)
            throw new Error("Failed to open process token");
        try {
            const tokenInfo = new Uint8Array(4);
            const returnLength = new Uint32Array(1);
            const result = advapi32.symbols.GetTokenInformation(tokenHandle[0], TOKEN_ELEVATION, ptr(tokenInfo), 4, ptr(returnLength));
            if (!result)
                throw new Error(`Failed to get token information (${kernel32.symbols.GetLastError()})`);
            elevated = tokenInfo[0] !== 0;
            return elevated;
        }
        finally {
            kernel32.symbols.CloseHandle(tokenHandle[0]);
        }
    }
    finally {
        advapi32.close();
        kernel32.close();
    }
}
