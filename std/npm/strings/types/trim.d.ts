/**
 * The trim module provides functions to trim characters from strings and
 * includes functions to trim leading, trailing, and both leading and
 * trailing characters.  JavaScript trim functions can only trim whitespace
 * and these functions are designed to trim any character.
 *
 * @module
 */
import { type CharBuffer } from "@neotales/slices/utils";
/**
 * Trims the trailing character from the string.
 * @param value The string to trim.
 * @param suffix The character suffix to trim.
 * @returns The trimmed string.
 */
export declare function trimEndChar(value: string, suffix: number): string;
/**
 * Trims the trailing characters from the string.
 * @param value The string to trim.
 * @param suffix The characters suffix to trim.
 * @returns The trimmed string.
 */
export declare function trimEndSlice(value: string, suffix: CharBuffer): string;
/**
 * Trims the trailing characters from the string.
 * @param value The string to trim.
 * @param suffix The characters suffix to trim. If not provided, all trailing
 * whitespace characters are removed.
 * @returns The trimmed string.
 */
export declare function trimEnd(value: string, suffix?: CharBuffer): string;
/**
 * Trims the leading character from the string.
 * @param value The string to trim.
 * @param prefix The character prefix to trim.
 * @returns The trimmed string.
 */
export declare function trimStartChar(value: string, prefix: number): string;
/**
 * Trims the leading characters from the string.
 * @param value The string to trim.
 * @param prefix The characters prefix to trim.
 * @returns The trimmed string.
 */
export declare function trimStartSlice(value: string, prefix: CharBuffer): string;
/**
 * Trims the leading character from the string.
 * @param value The string to trim.
 * @param prefix The character prefix to trim. If not provided, all leading
 * whitespace characters are removed.
 * @returns The trimmed string.
 */
export declare function trimStart(value: string, prefix?: CharBuffer): string;
/**
 * Trims the leading and trailing character from the string.
 * @param value The string to trim.
 * @param char The character to trim.
 * @returns The trimmed string.
 */
export declare function trimChar(value: string, char: number): string;
/**
 * Trims the leading and trailing characters from the string.
 * @param value The string to trim.
 * @param chars The characters to trim.
 * @returns The trimmed string.
 */
export declare function trimSlice(value: string, chars: CharBuffer): string;
/**
 * Trims the leading and trailing characters from the string.
 * @param value The string to trim.
 * @param chars The characters to trim. If not provided, all leading
 * whitespace characters are removed.
 * @returns The trimmed string.
 */
export declare function trim(value: string, chars?: CharBuffer): string;
