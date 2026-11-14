/**
 * Converts strings to PascalCase format.
 *
 * This module provides the `pascalize` function which converts strings from
 * various formats (snake_case, kebab-case, space-separated, camelCase) to
 * PascalCase where each word starts with an uppercase letter.
 *
 * Word boundaries are detected at:
 * - Underscores (`_`)
 * - Hyphens (`-`)
 * - Spaces
 *
 * Note: This function does NOT detect camelCase boundaries. Input like
 * "helloWorld" becomes "Helloworld", not "HelloWorld". Use this function
 * primarily for snake_case or kebab-case to PascalCase conversion.
 *
 * @example
 * ```typescript
 * import { pascalize } from '@neotales/slices/pascalize';
 *
 * // snake_case to PascalCase
 * String.fromCodePoint(...pascalize("hello_world"));     // "HelloWorld"
 *
 * // kebab-case to PascalCase
 * String.fromCodePoint(...pascalize("hello-world"));     // "HelloWorld"
 *
 * // space-separated to PascalCase
 * String.fromCodePoint(...pascalize("hello world"));     // "HelloWorld"
 *
 * // Existing PascalCase is lowercased except first letters
 * String.fromCodePoint(...pascalize("HelloWorld"));      // "Helloworld"
 * ```
 *
 * @module
 */
import { CharArrayBuilder } from "./char_array_builder.js";
import { CHAR_HYPHEN_MINUS, CHAR_UNDERSCORE } from "@neotales/chars/constants";
import { isDigit } from "@neotales/chars/is-digit";
import { isLetter } from "@neotales/chars/is-letter";
import { isSpace } from "@neotales/chars/is-space";
import { toLower } from "@neotales/chars/to-lower";
import { toUpper } from "@neotales/chars/to-upper";
import { toCharSliceLike } from "./utils.js";
/**
 * Converts a string or character buffer to PascalCase.
 *
 * PascalCase capitalizes the first letter of each word and removes separators.
 * Word boundaries are detected at underscores, hyphens, and spaces.
 *
 * **Important**: This function does NOT detect camelCase word boundaries.
 * Uppercase letters in the middle of a word are converted to lowercase.
 * For example, "helloWorld" becomes "Helloworld", not "HelloWorld".
 *
 * Non-letter, non-digit characters (except separators) are preserved.
 * Digits are preserved but don't trigger capitalization of following letters.
 *
 * @param str - The string or character buffer to convert.
 * @returns A `Uint32Array` containing the PascalCase result.
 *
 * @example
 * ```typescript
 * import { pascalize } from '@neotales/slices/pascalize';
 *
 * // snake_case to PascalCase
 * String.fromCodePoint(...pascalize("get_user_name")); // "GetUserName"
 *
 * // kebab-case to PascalCase
 * String.fromCodePoint(...pascalize("get-user-name")); // "GetUserName"
 *
 * // Space-separated to PascalCase
 * String.fromCodePoint(...pascalize("get user name")); // "GetUserName"
 *
 * // Mixed separators
 * String.fromCodePoint(...pascalize("get_user-name here")); // "GetUserNameHere"
 *
 * // Existing camelCase (note: doesn't preserve word boundaries)
 * String.fromCodePoint(...pascalize("getUserName")); // "Getusername"
 *
 * // Unicode support
 * String.fromCodePoint(...pascalize("hello_wörld")); // "HelloWörld"
 * String.fromCodePoint(...pascalize("größe_öffnung")); // "GrößeÖffnung"
 * ```
 */
export function pascalize(str) {
    const v = toCharSliceLike(str);
    const sb = new CharArrayBuilder();
    let last = 0;
    for (let i = 0; i < v.length; i++) {
        const c = v.at(i) ?? -1;
        if (c === -1) {
            continue;
        }
        if (i === 0 && isLetter(c)) {
            sb.appendChar(toUpper(c));
            last = c;
            continue;
        }
        if (isLetter(c)) {
            if (last === CHAR_UNDERSCORE) {
                sb.appendChar(toUpper(c));
                last = c;
                continue;
            }
            sb.appendChar(toLower(c));
            last = c;
            continue;
        }
        if (c === CHAR_HYPHEN_MINUS || c === CHAR_UNDERSCORE || isSpace(c)) {
            last = CHAR_UNDERSCORE;
            continue;
        }
        if (isDigit(c)) {
            last = c;
            sb.appendChar(c);
            continue;
        }
        sb.appendChar(c);
        last = c;
    }
    const r = sb.toArray();
    sb.clear();
    return r;
}
