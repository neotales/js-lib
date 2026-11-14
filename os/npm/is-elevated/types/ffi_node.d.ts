/**
 * Implements native Windows elevation detection through Node.js FFI.
 *
 * @module @neotales/is-elevated/ffi_node
 * @internal
 */
/**
 * Reports whether the current process is running with elevated privileges.
 *
 * @param cache - Whether to reuse the result from the first evaluation.
 * @returns Whether the process has elevated privileges.
 */
export declare function evalIsProcessElevated(cache?: boolean): boolean;
