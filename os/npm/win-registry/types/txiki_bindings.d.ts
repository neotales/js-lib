/**
 * txiki.js `tjs:ffi` bindings for Windows Registry operations.
 *
 * The module separates the native symbol table and backend implementation from
 * the `tjs:ffi` loader so the bindings can be tested on a host without the
 * txiki.js binary. Numeric registry handles are converted to native pointers
 * with `createPointer`, and wide strings stay in the `buffer` argument type.
 *
 * @module
 * @internal
 */
import type { RegistryBackend } from "./types.js";
import { type PointerWidth } from "./hkey.js";
/** An opened `tjs:ffi` library. */
export interface TxikiLibrary {
    /** The resolved FFI entry points, keyed by symbol name. */
    symbols: Record<string, (...args: unknown[]) => unknown>;
    /** Unloads the library. */
    close(): void;
}
/** The subset of the `tjs:ffi` module surface used by this backend. */
export interface TxikiFfiModule {
    /** Rebuilds a native pointer from a BigInt address. */
    createPointer(value: bigint): unknown;
    /** Opens a shared library and binds its symbols. */
    dlopen(name: string, symbols: Record<string, {
        args?: string[];
        returns?: string;
    }>): TxikiLibrary;
}
/**
 * The `advapi32.dll` symbol table requested from `tjs:ffi`.
 *
 * `ptr` accepts a `NativePointer`, `null`, or a `Uint8Array`; `buffer` is a
 * `Uint8Array` argument. Registry handles are passed as pointers created with
 * `createPointer`.
 */
export declare const TXIKI_SYMBOLS: Record<string, {
    args?: string[];
    returns?: string;
}>;
/**
 * Creates the txiki.js registry backend and lifecycle helpers around an
 * already loaded `tjs:ffi` module.
 *
 * The returned functions share one lazily opened `advapi32.dll` handle. Keys
 * opened through the backend keep their native handles; callers must close
 * them before {@linkcode close}.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @param width The host pointer width used for predefined registry roots.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export declare function createTxikiBackend(ffi: TxikiFfiModule, width?: PointerWidth): {
    backend: RegistryBackend;
    open(): void;
    isOpened(): boolean;
    close(): void;
};
