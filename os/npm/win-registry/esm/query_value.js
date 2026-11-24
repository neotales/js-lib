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
import { readU32, writeU32 } from "./binary.js";
import { RegistryError } from "./registry_error.js";
import { ERROR_FILE_NOT_FOUND, ERROR_MORE_DATA, ERROR_SUCCESS, } from "./types.js";
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
export function readRegistryValue(call, initialSize = 4096, maxRetries = 24, maxCapacity = 64 * 1024 * 1024) {
    let capacity = Math.max(1, Math.min(initialSize, maxCapacity));
    let data = new Uint8Array(capacity);
    const type = new Uint8Array(4);
    const size = new Uint8Array(4);
    let retries = 0;
    for (;;) {
        writeU32(size, capacity);
        const status = call(data, type, size);
        const written = readU32(size);
        if (status === ERROR_SUCCESS) {
            return {
                type: readU32(type),
                data: data.subarray(0, Math.min(written, data.length)),
            };
        }
        if (status === ERROR_FILE_NOT_FOUND) {
            return null;
        }
        if (status !== ERROR_MORE_DATA) {
            throw new RegistryError(`RegQueryValueExW failed with error code ${status}`);
        }
        // The reported size is not trustworthy for every handle (notably
        // performance data). Grow geometrically from tracked capacity instead;
        // a bogus huge value cannot force an allocation beyond the cap.
        const next = capacity * 2;
        if (next > maxCapacity) {
            throw new RegistryError(`RegQueryValueExW needs ${next} bytes, which exceeds the ${maxCapacity}-byte cap`);
        }
        if (retries >= maxRetries) {
            throw new RegistryError(`RegQueryValueExW kept returning ERROR_MORE_DATA after ${maxRetries} retries`);
        }
        retries++;
        capacity = next;
        data = new Uint8Array(capacity);
    }
}
