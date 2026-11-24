/**
 * txiki.js `tjs:ffi` bindings for Windows Credential Manager.
 *
 * The native symbol table and backend implementation are separate from the
 * `tjs:ffi` loader so the bindings can be tested on a host without the
 * txiki.js binary. Credential structures stay in the 64-bit Windows ABI used
 * by the published txiki.js Windows build; pointer fields are rebuilt with
 * `createPointer`, and wide strings use the `buffer` argument type.
 *
 * @module
 * @internal
 */
import type { WinCredentials } from "./types.js";
/** An opened `tjs:ffi` library. */
export interface TxikiLibrary {
    /** The resolved FFI entry points, keyed by symbol name. */
    symbols: Record<string, (...args: unknown[]) => unknown>;
    /** Unloads the library. */
    close(): void;
}
/** A native pointer as exposed by `tjs:ffi` 26.11.0. */
export interface TxikiPointer {
    /** The raw address. */
    readonly value: bigint;
    /** A zero-copy view of native memory. */
    toUint8Array(byteLength: number, byteOffset?: number): Uint8Array;
}
/** The subset of the `tjs:ffi` module surface used by this backend. */
export interface TxikiFfiModule {
    /** Rebuilds a native pointer from a BigInt address. */
    createPointer(value: bigint): TxikiPointer | null;
    /** Returns a pointer to a JavaScript buffer's backing memory. */
    bufferToPointer(buffer: Uint8Array): TxikiPointer | null;
    /** Opens a shared library and binds its symbols. */
    dlopen(name: string, symbols: Record<string, {
        args?: string[];
        returns?: string;
    }>): TxikiLibrary;
    /** Direct native memory reads. */
    read: {
        u8(pointer: TxikiPointer, offset?: number): number;
        u32(pointer: TxikiPointer, offset?: number): number;
        ptr(pointer: TxikiPointer, offset?: number): TxikiPointer | null;
    };
}
/**
 * The `advapi32.dll` symbol table requested from `tjs:ffi`.
 *
 * `buffer` passes a pointer to a `Uint8Array`; `ptr` accepts a `NativePointer`
 * or `null`. All strings are null-terminated UTF-16LE buffers.
 */
export declare const TXIKI_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/** The `kernel32.dll` symbol table requested from `tjs:ffi`. */
export declare const TXIKI_KERNEL32_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/**
 * Creates the txiki.js Credential Manager backend and lifecycle helpers around
 * an already loaded `tjs:ffi` module.
 *
 * The returned functions share lazily opened `advapi32.dll` and `kernel32.dll`
 * handles. {@link close} unloads both, and a later call reopens them.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export declare function createTxikiBackend(ffi: TxikiFfiModule): {
    backend: WinCredentials;
    open(): void;
    isOpened(): boolean;
    close(): void;
};
