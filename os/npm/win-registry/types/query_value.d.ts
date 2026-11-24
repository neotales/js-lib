/**
 * Retry and error handling for `RegQueryValueExW`.
 *
 * Windows can report `ERROR_MORE_DATA` more than once when a value grows
 * between calls. It can also report fewer bytes than the buffer on the retry.
 * This helper grows the buffer only when Windows reports a strictly larger
 * required size, returns exactly the bytes Windows reports, distinguishes a
 * missing value from a real failure, and bounds the retry loop.
 *
 * @module
 * @internal
 */
/** The raw `RegQueryValueExW` call shape used by this helper. */
export type QueryValueCall = (data: Uint8Array, type: Uint8Array, size: Uint8Array) => number;
/**
 * Reads a registry value through `RegQueryValueExW`.
 *
 * `ERROR_MORE_DATA` can carry an unreliable or absent required size, notably
 * for `HKEY_PERFORMANCE_DATA`. The buffer therefore doubles from tracked
 * capacity on every retry regardless of the reported size. The retry count and
 * total capacity are bounded.
 *
 * @param initialSize The first data-buffer size in bytes.
 * @param maxRetries The maximum number of `ERROR_MORE_DATA` retries.
 * @param maxCapacity The maximum data-buffer size in bytes.
 * @returns The value type and exact bytes, or `null` when the value is missing.
 * @throws {RegistryError} On any error other than a missing value, or when the
 * retry or capacity bound is reached.
 */
export declare function readRegistryValue(call: QueryValueCall, initialSize?: number, maxRetries?: number, maxCapacity?: number): {
    type: number;
    data: Uint8Array;
} | null;
