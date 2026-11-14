/**
 * Converts strings to underscore (snake_case) format.
 *
 * This module provides the `underscore` function which converts strings from
 * various formats (camelCase, PascalCase, space-separated, hyphen-separated)
 * to underscore_case. Word boundaries are detected at:
 * - Uppercase letters following lowercase letters (camelCase transitions)
 * - Spaces, hyphens, and existing underscores
 *
 * The function supports options for case handling:
 * - Default: Convert all letters to lowercase
 * - `screaming: true`: Convert all letters to UPPERCASE (SCREAMING_SNAKE_CASE)
 * - `preserveCase: true`: Keep original letter casing
 *
 * @example
 * ```typescript
 * import { underscore } from '@neotales/slices/underscore';
 *
 * // Basic usage
 * String.fromCodePoint(...underscore("helloWorld"));     // "hello_world"
 * String.fromCodePoint(...underscore("HelloWorld"));     // "hello_world"
 * String.fromCodePoint(...underscore("hello world"));    // "hello_world"
 * String.fromCodePoint(...underscore("hello-world"));    // "hello_world"
 *
 * // Screaming snake case
 * String.fromCodePoint(...underscore("helloWorld", { screaming: true })); // "HELLO_WORLD"
 *
 * // Preserve original case
 * String.fromCodePoint(...underscore("HelloWorld", { preserveCase: true })); // "Hello_World"
 * ```
 *
 * @module
 */
import { CharArrayBuilder } from "./char_array_builder.js";
import { CHAR_HYPHEN_MINUS, CHAR_UNDERSCORE } from "@neotales/chars/constants";
import { isDigit, isLetter, isLower, isSpace, isUpper, toLower, toUpper } from "@neotales/chars";
import { toCharSliceLike } from "./utils.js";
/**
 * Converts a string or character buffer to underscore_case (snake_case).
 *
 * Word boundaries are detected at:
 * - Transitions from lowercase to uppercase letters (camelCase/PascalCase)
 * - Space characters, hyphens (`-`), and underscores (`_`)
 *
 * Non-letter, non-digit characters are stripped from the output.
 * Consecutive separators are collapsed into a single underscore.
 * Leading and trailing separators are removed.
 *
 * @param slice - The string or character buffer to convert.
 * @param options - Optional settings for case handling.
 * @returns A `Uint32Array` containing the underscore_case result.
 * @throws {Error} If both `preserveCase` and `screaming` options are true.
 *
 * @example
 * ```typescript
 * import { underscore } from '@neotales/slices/underscore';
 *
 * // camelCase to snake_case
 * String.fromCodePoint(...underscore("getUserName")); // "get_user_name"
 *
 * // PascalCase to snake_case
 * String.fromCodePoint(...underscore("GetUserName")); // "get_user_name"
 *
 * // Space-separated to snake_case
 * String.fromCodePoint(...underscore("get user name")); // "get_user_name"
 *
 * // Hyphen-separated to snake_case
 * String.fromCodePoint(...underscore("get-user-name")); // "get_user_name"
 *
 * // SCREAMING_SNAKE_CASE
 * String.fromCodePoint(...underscore("getUserName", { screaming: true })); // "GET_USER_NAME"
 *
 * // Preserve original case
 * String.fromCodePoint(...underscore("getUserName", { preserveCase: true })); // "get_User_Name"
 *
 * // Unicode support
 * String.fromCodePoint(...underscore("helloWörld")); // "hello_wörld"
 * String.fromCodePoint(...underscore("helloWörld", { screaming: true })); // "HELLO_WÖRLD"
 * ```
 */
export function underscore(slice, options) {
    options ??= {};
    if (options.preserveCase && options.screaming) {
        throw new Error("preserveCase and screaming cannot be used together");
    }
    const v = toCharSliceLike(slice);
    const sb = new CharArrayBuilder();
    let last = 0;
    for (let i = 0; i < v.length; i++) {
        const c = v.at(i) ?? -1;
        if (c === -1) {
            continue;
        }
        if (isLetter(c)) {
            if (isUpper(c)) {
                if (isLetter(last) && isLower(last)) {
                    sb.appendChar(CHAR_UNDERSCORE);
                    if (options.preserveCase || options.screaming) {
                        sb.appendChar(c);
                        last = c;
                        continue;
                    }
                    sb.appendChar(toLower(c));
                    last = c;
                    continue;
                }
                if (options.preserveCase || options.screaming) {
                    sb.appendChar(c);
                    last = c;
                    continue;
                }
                sb.appendChar(toLower(c));
                last = c;
                continue;
            }
            if (options.screaming) {
                sb.appendChar(toUpper(c));
            }
            else if (options.preserveCase) {
                sb.appendChar(c);
            }
            else {
                sb.appendChar(toLower(c));
            }
            last = c;
            continue;
        }
        if (isDigit(c)) {
            last = c;
            sb.appendChar(c);
        }
        if (c === CHAR_UNDERSCORE || c === CHAR_HYPHEN_MINUS || isSpace(c)) {
            if (sb.length === 0) {
                continue;
            }
            if (last === CHAR_UNDERSCORE) {
                continue;
            }
            sb.appendChar(CHAR_UNDERSCORE);
            last = CHAR_UNDERSCORE;
            continue;
        }
    }
    const r = sb.toArray();
    sb.clear();
    return r;
}
