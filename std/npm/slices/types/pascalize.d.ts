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
import { type CharBuffer } from "./utils.js";
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
export declare function pascalize(str: CharBuffer): Uint32Array;
