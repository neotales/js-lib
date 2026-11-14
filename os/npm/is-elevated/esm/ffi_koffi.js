/**
 * Windows elevation through koffi, used when node:ffi is not available.
 *
 * @module @neotales/is-elevated/ffi_koffi
 * @internal
 */
import { createRequire } from "node:module";
const require = createRequire(globalThis[Symbol.for("import-meta-ponyfill-esmodule")](import.meta).url);
const specifier = "koffi";
const koffi = require(specifier);
const advapi32 = koffi.load("Advapi32.dll");
const kernel32 = koffi.load("Kernel32.dll");
const OpenProcessToken = advapi32.func("int __stdcall OpenProcessToken(void *ProcessHandle, uint32 DesiredAccess, _Out_ void **TokenHandle)");
const GetTokenInformation = advapi32.func("int __stdcall GetTokenInformation(void *TokenHandle, uint32 TokenInformationClass, void *TokenInformation, uint32 TokenInformationLength, _Out_ uint32 *ReturnLength)");
const GetCurrentProcess = kernel32.func("void * __stdcall GetCurrentProcess()");
const CloseHandle = kernel32.func("int __stdcall CloseHandle(void *hObject)");
const GetLastError = kernel32.func("uint32 __stdcall GetLastError()");
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
    const TOKEN_QUERY = 0x0008;
    const TOKEN_ELEVATION = 20;
    const processHandle = GetCurrentProcess();
    const tokenOut = [null];
    const opened = OpenProcessToken(processHandle, TOKEN_QUERY, tokenOut);
    if (!opened)
        throw new Error(`Failed to open process token (${GetLastError()})`);
    try {
        const tokenInfo = new Uint8Array(4);
        const returnLength = [0];
        const result = GetTokenInformation(tokenOut[0], TOKEN_ELEVATION, tokenInfo, 4, returnLength);
        if (!result)
            throw new Error(`Failed to get token information (${GetLastError()})`);
        elevated = tokenInfo[0] !== 0;
        return elevated;
    }
    finally {
        if (tokenOut[0])
            CloseHandle(tokenOut[0]);
    }
}
