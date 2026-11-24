/**
 * txiki.js `tjs:ffi` bindings for Linux libsecret.
 *
 * The native symbol table and backend implementation are separate from the
 * `tjs:ffi` loader so the bindings can be tested on a host without the
 * txiki.js binary. C strings use the `buffer` argument type, nullable handles
 * use `ptr`, and returned `GError` values are read from the caller's pointer
 * buffer and freed with `g_error_free`.
 *
 * @module
 * @internal
 */
import { type LibsecretBindings } from "./types.js";
import { type Endianness } from "./abi.js";
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
    /** Runtime FFI type descriptors; pointer.size and size.size are process ABI. */
    types?: {
        pointer?: {
            size?: number;
        };
        size?: {
            size?: number;
        };
    };
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
        ptr(pointer: TxikiPointer, offset?: number): TxikiPointer | null;
    };
}
/** The `libsecret-1.so.0` symbol table requested from `tjs:ffi`. */
export declare const TXIKI_LIBSECRET_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/** The `libglib-2.0.so.0` symbol table requested from `tjs:ffi`. */
export declare const TXIKI_GLIB_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/** The optional `libgio-2.0.so.0` symbol table requested from `tjs:ffi`. */
export declare const TXIKI_GIO_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/** The `libgobject-2.0.so.0` symbol table requested from `tjs:ffi`. */
export declare const TXIKI_GOBJECT_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/**
 * Creates the txiki.js libsecret backend and lifecycle helpers around an
 * already loaded `tjs:ffi` module.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export declare function createTxikiBackend(ffi: TxikiFfiModule, options?: {
    endianness?: Endianness | null;
}): {
    backend: LibsecretBindings;
    open(): void;
    isOpened(): boolean;
    close(): void;
};
export declare const LIBRARY_NAMES: readonly string[];
