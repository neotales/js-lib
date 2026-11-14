/**
 * Windows elevation through txiki.js `tjs:ffi`.
 *
 * @module @neotales/is-elevated/ffi_txiki
 * @internal
 */
/**
 * Reports whether the current process is running with elevated privileges.
 *
 * @param cache - Whether to reuse the result from the first evaluation.
 * @returns Whether the process has elevated privileges.
 */
export declare function evalIsProcessElevated(cache?: boolean): boolean;
