import type { Char } from "./types.js";
/**
 * Determines whether the given character is a symbol.
 * @param char The character to check.
 * @returns `true` if the character is a symbol; otherwise, `false`.
 *
 * @example
 * ```ts
 * import { isSymbol } from "@neotales/chars/is-symbol";
 *
 * console.log(isSymbol(0x1F600)); //  false
 * console.log(isSymbol(0x110000)); //  false
 * console.log(isSymbol(0x10FFFF)); //  false
 * console.log(isSymbol(0.32)); //  false
 * console.log(isSymbol(0x2B)); //  true
 * ```
 */
export declare function isSymbol(char: Char): boolean;
/**
 * Determines whether the given character is a symbol.
 *
 * @description
 * The function skips the type check and the range check for a small performance boost.
 *
 * @param char The character to check.
 * @returns `true` if the character is a symbol; otherwise, `false`.
 *
 * @example
 * ```ts
 * import { isSymbolUnsafe } from "@neotales/chars/is-symbol";
 *
 * console.log(isSymbolUnsafe(0x1F600)); //  false
 * console.log(isSymbolUnsafe(0x110000)); //  false
 * console.log(isSymbolUnsafe(0x10FFFF)); //  false
 * console.log(isSymbolUnsafe(0.32)); //  false
 * console.log(isSymbolUnsafe(0x2B)); //  true
 * ```
 */
export declare function isSymbolUnsafe(char: Char): boolean;
/**
 * Determines whether the given value is a valid Unicode symbol.
 * @param str The value to check.
 * @param index The index of the value to check.
 * @returns `true` if the value is a valid Unicode symbol; otherwise, `false`.
 * @example
 * ```ts
 * import { isSymbolAt } from "@neotales/chars/is-symbol";
 *
 * console.log(isSymbolAt("$2.40", 1)); //  true
 * console.log(isSymbolAt("€2.40", 0)); //  true
 * console.log(isSymbolAt("2.40€", 0)); //  false
 * ```
 */
export declare function isSymbolAt(str: string, index: number): boolean;
