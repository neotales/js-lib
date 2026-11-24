/**
 * txiki.js `tjs:ffi` bindings for macOS Keychain.
 *
 * The native symbol table and backend implementation are separate from the
 * `tjs:ffi` loader so the bindings can be tested without a macOS host. The
 * backend mirrors the Bun backend: `buffer` arguments point at JavaScript
 * bytes, returned CoreFoundation and Keychain references are followed with
 * `read.ptr`, and every owned reference is released.
 *
 * @module
 * @internal
 */
import type { DarwinKeychainBackend } from "./types.js";
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
/** The Security.framework symbols requested from `tjs:ffi`. */
export declare const TXIKI_SECURITY_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/** The CoreFoundation symbols requested from `tjs:ffi`. */
export declare const TXIKI_COREFOUNDATION_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/**
 * Creates the txiki.js macOS Keychain backend and lifecycle helpers around an
 * already loaded `tjs:ffi` module.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export declare function createTxikiKeychainBackend(ffi: TxikiFfiModule): {
    backend: DarwinKeychainBackend;
    open(): void;
    isOpened(): boolean;
    close(): void;
};
