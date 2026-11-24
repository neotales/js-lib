/**
 * Converts the two non-fatal Node stdin conditions to EOF and preserves every
 * other host error unchanged.
 *
 * @param error Error reported by the host stdin read.
 * @returns `null` for a temporarily unavailable or ended input stream.
 * @throws The original error for every other failure.
 */
export function readError(error: unknown): null {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "EAGAIN" || code === "EOF") return null;
  throw error;
}
