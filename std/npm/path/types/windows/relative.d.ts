/**
 * Return the relative path from `from` to `to` based on current working directory.
 *
 * An example in windws, for instance:
 *  from = 'C:\\orandea\\test\\aaa'
 *  to = 'C:\\orandea\\impl\\bbb'
 * The output of the function should be: '..\\..\\impl\\bbb'
 *
 * @example Usage
 * ```ts
 * import { relative } from "@neotales/path/windows/relative";
 * import { equal } from "node:assert/strict";
 *
 * const relativePath = relative("C:\\foobar\\test\\aaa", "C:\\foobar\\impl\\bbb");
 * equal(relativePath, "..\\..\\impl\\bbb");
 * ```
 *
 * @param from The path from which to calculate the relative path
 * @param to The path to which to calculate the relative path
 * @returns The relative path from `from` to `to`
 */
export declare function relative(from: string, to: string): string;
