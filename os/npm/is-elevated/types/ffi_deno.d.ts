/**
 * Implements native Windows elevation detection for Deno.
 *
 * @module @neotales/is-elevated/ffi_deno
 */
/**
 * Reports whether the current process is running with elevated privileges.
 *
 * @param cache - Whether to reuse the result from the first evaluation.
 * @returns Whether the process has elevated privileges.
 * @example
 * ```ts
 * import { evalIsProcessElevated } from "./ffi_deno.ts";
 *
 * const elevated = evalIsProcessElevated();
 * ```
 */
export declare function evalIsProcessElevated(cache?: boolean): boolean;
