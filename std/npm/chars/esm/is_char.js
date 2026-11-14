/**
 * Determines whether the given value is a valid Unicode character.
 * @param char The value to check.
 * @returns `true` if the value is a valid Unicode character; otherwise, `false`.
 * @example
 * ```ts
 * import { isChar } from "@neotales/chars/is-char";
 *
 * console.log(isChar(0x1F600)); //  true
 * console.log(isChar(0x110000)); //  false
 * console.log(isChar(0x10FFFF)); //  true
 * console.log(isChar(0.32)); //  false
 * ```
 */
export function isChar(char) {
    return Number.isInteger(char) &&
        char >= 0 &&
        char <= 0x10ffff;
}
