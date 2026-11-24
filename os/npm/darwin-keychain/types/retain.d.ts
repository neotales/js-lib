/**
 * Keeps JavaScript buffer owners alive across a synchronous native call.
 *
 * FFI backends pass pointers into `Uint8Array` storage. The array itself must
 * remain strongly reachable until the native function returns, even when the
 * pointer was stored in another buffer. Passing the owners through this
 * function makes that lifetime explicit.
 *
 * @module
 * @internal
 */
/**
 * Runs a native call while retaining every owner.
 *
 * @param owners Buffers whose storage the native call reads.
 * @param fn Native call.
 * @returns The native call result.
 */
export declare function retaining<T>(owners: readonly unknown[], fn: () => T): T;
