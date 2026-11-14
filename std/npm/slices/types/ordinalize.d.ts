/**
 * Converts numbers in strings to their ordinal form.
 *
 * This module provides the `ordinalize` function which converts numeric values
 * within a string to their ordinal representation (1st, 2nd, 3rd, 4th, etc.).
 *
 * The function correctly handles:
 * - Special cases: 11th, 12th, 13th (not 11st, 12nd, 13rd)
 * - Standard endings: 1st, 2nd, 3rd, and Nth for all others
 * - Numbers embedded in text (when followed by whitespace)
 * - Standalone numbers at the end of the string
 *
 * @example
 * ```typescript
 * import { ordinalize } from '@neotales/slices/ordinalize';
 *
 * // Basic ordinals
 * String.fromCodePoint(...ordinalize("1"));    // "1st"
 * String.fromCodePoint(...ordinalize("2"));    // "2nd"
 * String.fromCodePoint(...ordinalize("3"));    // "3rd"
 * String.fromCodePoint(...ordinalize("4"));    // "4th"
 *
 * // Special cases (11, 12, 13)
 * String.fromCodePoint(...ordinalize("11"));   // "11th"
 * String.fromCodePoint(...ordinalize("12"));   // "12th"
 * String.fromCodePoint(...ordinalize("13"));   // "13th"
 *
 * // In sentences
 * String.fromCodePoint(...ordinalize("On the 1 day")); // "On the 1st day"
 * ```
 *
 * @module
 */
import { type CharBuffer } from "./utils.js";
/**
 * Converts numbers in a string to their ordinal form.
 *
 * Adds the appropriate ordinal suffix (st, nd, rd, th) to numbers in the input.
 * Numbers are detected as sequences of digits (0-9). The suffix is added:
 * - When a number is followed by whitespace
 * - When a number is at the end of the string
 *
 * Numbers not followed by whitespace or at the end are preserved as-is.
 *
 * **Ordinal rules:**
 * - 1, 21, 31, etc. → "st" (except 11)
 * - 2, 22, 32, etc. → "nd" (except 12)
 * - 3, 23, 33, etc. → "rd" (except 13)
 * - All others → "th" (including 11, 12, 13)
 *
 * @param value - The string or character buffer to convert.
 * @returns A `Uint32Array` containing the ordinalized result.
 *
 * @example
 * ```typescript
 * import { ordinalize } from '@neotales/slices/ordinalize';
 *
 * // Single numbers
 * String.fromCodePoint(...ordinalize("1"));     // "1st"
 * String.fromCodePoint(...ordinalize("2"));     // "2nd"
 * String.fromCodePoint(...ordinalize("3"));     // "3rd"
 * String.fromCodePoint(...ordinalize("4"));     // "4th"
 *
 * // Teens are special (always "th")
 * String.fromCodePoint(...ordinalize("11"));    // "11th"
 * String.fromCodePoint(...ordinalize("12"));    // "12th"
 * String.fromCodePoint(...ordinalize("13"));    // "13th"
 *
 * // Larger numbers follow last digit rule
 * String.fromCodePoint(...ordinalize("21"));    // "21st"
 * String.fromCodePoint(...ordinalize("22"));    // "22nd"
 * String.fromCodePoint(...ordinalize("23"));    // "23rd"
 * String.fromCodePoint(...ordinalize("111"));   // "111th" (ends in 11)
 *
 * // Numbers in text
 * String.fromCodePoint(...ordinalize("On the 1 day")); // "On the 1st day"
 * String.fromCodePoint(...ordinalize("Chapter 3"));    // "Chapter 3rd"
 *
 * // Numbers not followed by space are unchanged
 * String.fromCodePoint(...ordinalize("test123abc")); // "test123abc"
 * ```
 */
export declare function ordinalize(value: CharBuffer): Uint32Array;
