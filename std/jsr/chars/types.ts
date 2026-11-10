/**
 * Represents a Unicode code point as a number.
 *
 * A `Char` is a numeric value representing a Unicode code point,
 * ranging from 0 to 0x10FFFF (1,114,111). This type is used throughout
 * the chars module to represent individual characters.
 *
 * @example
 * ```ts
 * import type { Char } from "@neotales/chars";
 *
 * const letterA: Char = 65;       // 'A'
 * const letterAlpha: Char = 0x03B1; // 'α' (Greek lowercase alpha)
 * const emoji: Char = 0x1F600;    // '😀'
 *
 * // Get a Char from a string
 * const char: Char = "Hello".codePointAt(0)!; // 72 ('H')
 * ```
 */
export type Char = number;
