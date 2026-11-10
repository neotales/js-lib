import type { Char } from "./types.ts";

/**
 * Validates the number is a valid unicode character.
 *
 * @param value The value to check.
 * @returns `true` if the value is a valid unicode character; otherwise, `false`.
 */
export function isChar(value: number): value is Char {
  return Number.isInteger(value) && value >= 0 && value <= 0x10ffff;
}
