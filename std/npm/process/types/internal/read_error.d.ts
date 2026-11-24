/**
 * Converts the two non-fatal Node stdin conditions to EOF and preserves every
 * other host error unchanged.
 *
 * @param error Error reported by the host stdin read.
 * @returns `null` for a temporarily unavailable or ended input stream.
 * @throws The original error for every other failure.
 */
export declare function readError(error: unknown): null;
