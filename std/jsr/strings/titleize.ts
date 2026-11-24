/**
 * The titleize module provides a function to convert a string to title case.
 *
 * @module
 */

import { titleize as og } from "@neotales/slices/titleize";

/**
 * Converts the string to title case.
 * @param s The string to titleize.
 * @returns The titleized string.
 *
 * @example
 * ```typescript
 * import { titleize } from "@neotales/strings";
 *
 * titleize("hello world");     // "Hello World"
 * titleize("the quick fox");   // "the Quick Fox"
 * titleize("HELLO WORLD");     // "Hello World"
 * ```
 */
export function titleize(s: string): string {
  const r = og(s);

  return String.fromCodePoint(...r);
}
