/**
 * Implements native Windows elevation detection through Node.js FFI.
 *
 * @module @neotales/is-elevated/ffi_node
 * @internal
 */
import { createRequire } from "node:module";
const require = createRequire(globalThis[Symbol.for("import-meta-ponyfill-esmodule")](import.meta).url);
const specifier = "node:ffi";
let ffi;
try {
    ffi = require(specifier);
}
catch (cause) {
    throw new Error(`Unable to load ${specifier}. See https://github.com/neotales/js-lib/blob/dev/os/jsr/is-elevated/README.md#nodejs-ffi`, { cause });
}
const advapi32 = ffi.dlopen("Advapi32.dll", {
    OpenProcessToken: { arguments: ["pointer", "u32", "pointer"], return: "u8" },
    GetTokenInformation: {
        arguments: ["pointer", "u32", "pointer", "u32", "pointer"],
        return: "u8",
    },
});
const kernel32 = ffi.dlopen("Kernel32.dll", {
    GetCurrentProcess: { arguments: [], return: "pointer" },
    CloseHandle: { arguments: ["pointer"], return: "u8" },
    GetLastError: { arguments: [], return: "u32" },
});
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
    const processHandle = kernel32.functions.GetCurrentProcess();
    const tokenHandleBuffer = new Uint8Array(8);
    const opened = advapi32.functions.OpenProcessToken(processHandle, TOKEN_QUERY, tokenHandleBuffer);
    if (!opened) {
        throw new Error(`Failed to open process token (${kernel32.functions.GetLastError()})`);
    }
    const tokenHandle = new DataView(tokenHandleBuffer.buffer).getBigUint64(0, true);
    try {
        const tokenInfo = new Uint8Array(4);
        const returnLength = new Uint8Array(4);
        const result = advapi32.functions.GetTokenInformation(tokenHandle, TOKEN_ELEVATION, tokenInfo, 4, returnLength);
        if (!result) {
            throw new Error(`Failed to get token information (${kernel32.functions.GetLastError()})`);
        }
        elevated = tokenInfo[0] !== 0;
        return elevated;
    }
    finally {
        kernel32.functions.CloseHandle(tokenHandle);
    }
}
