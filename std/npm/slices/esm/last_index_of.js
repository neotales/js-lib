/**
 * The `lastIndexOf` module provides functions to find the last index of a
 * substring in a character buffer, searching backwards from the end or a
 * specified position. Supports both case-sensitive and case-insensitive
 * (fold) searching with full Unicode support.
 *
 * @example Find last occurrence of a substring
 * ```ts
 * import { lastIndexOf } from "@neotales/slices/last-index-of";
 *
 * lastIndexOf("foo bar foo", "foo");  // Returns 8 (last "foo")
 * lastIndexOf("foo bar foo", "foo", 5);  // Returns 0 (searching up to index 5)
 * lastIndexOf("hello", "x");  // Returns -1 (not found)
 * ```
 *
 * @example Case-insensitive search
 * ```ts
 * import { lastIndexOfFold } from "@neotales/slices/last-index-of";
 *
 * lastIndexOfFold("FOO bar Foo", "foo");  // Returns 8
 * lastIndexOfFold("ÜBER über", "über");  // Returns 5
 * ```
 *
 * @module
 */
import { simpleFold } from "@neotales/chars/simple-fold";
import { toCharSliceLike } from "./utils.js";
/**
 * Finds the last occurrence of a substring in a character buffer using
 * case-insensitive (fold) comparison. Searches backwards from the end or
 * the specified index position.
 *
 * Uses Unicode case folding for proper comparison of international characters
 * including accented letters, Greek, Cyrillic, and other scripts.
 *
 * @param value - The character buffer to search in.
 * @param test - The substring to search for.
 * @param index - The index to start searching backwards from (default: 0).
 * @returns The index of the last occurrence, or -1 if not found.
 *
 * @example Basic case-insensitive search
 * ```ts
 * lastIndexOfFold("Hello HELLO hello", "hello");  // Returns 12
 * lastIndexOfFold("ABC abc ABC", "abc");  // Returns 8
 * ```
 *
 * @example With accented characters
 * ```ts
 * lastIndexOfFold("café CAFÉ café", "café");  // Returns 10
 * lastIndexOfFold("über ÜBER", "über");  // Returns 5
 * ```
 *
 * @example With index limit
 * ```ts
 * lastIndexOfFold("foo FOO foo", "foo", 5);  // Returns 4
 * ```
 */
export function lastIndexOfFold(value, test, index = 0) {
    const s = toCharSliceLike(value);
    const t = toCharSliceLike(test);
    if (t.length === 0 || s.length === 0 || t.length > s.length) {
        return -1;
    }
    let f = 0;
    const l = Math.min(s.length, index === Infinity ? s.length : index + 1);
    if (l - 1 < 0) {
        return -1;
    }
    for (let i = l - 1; i > -1; i--) {
        for (let j = t.length - 1; j > -1; j--) {
            let sr = s.at(i - f) ?? -1;
            let tr = t.at(j) ?? -1;
            if (sr === -1 || tr === -1) {
                break;
            }
            if (tr === sr) {
                f++;
                if (f === t.length) {
                    return i - t.length + 1;
                }
                continue;
            }
            if (tr < sr) {
                const tmp = tr;
                tr = sr;
                sr = tmp;
            }
            // short circuit if tr is ASCII
            if (tr < 0x80) {
                if (65 <= sr && sr <= 90 && tr === sr + 32) {
                    f++;
                    if (f === t.length) {
                        return i - t.length + 1;
                    }
                    continue;
                }
                f = 0;
                break;
            }
            let r = simpleFold(sr);
            while (r !== sr && r < tr) {
                r = simpleFold(r);
            }
            if (r === tr) {
                f++;
                if (f === t.length) {
                    return i - t.length + 1;
                }
                continue;
            }
            f = 0;
            break;
        }
        if (f === t.length) {
            return i - t.length + 1;
        }
    }
    return -1;
}
/**
 * Finds the last occurrence of a substring in a character buffer using
 * case-sensitive comparison. Searches backwards from the end or the
 * specified index position.
 *
 * @param value - The character buffer to search in.
 * @param test - The substring to search for.
 * @param index - The index to start searching backwards from (default: Infinity,
 *                meaning search from the end).
 * @returns The index of the last occurrence, or -1 if not found.
 *
 * @example Basic search
 * ```ts
 * lastIndexOf("foo bar foo", "foo");  // Returns 8
 * lastIndexOf("abcabc", "abc");  // Returns 3
 * ```
 *
 * @example Case-sensitive
 * ```ts
 * lastIndexOf("Hello HELLO", "HELLO");  // Returns 6
 * lastIndexOf("Hello HELLO", "hello");  // Returns -1 (case mismatch)
 * ```
 *
 * @example With index limit
 * ```ts
 * lastIndexOf("foo bar foo", "foo", 5);  // Returns 0 (only searches up to index 5)
 * ```
 *
 * @example Not found
 * ```ts
 * lastIndexOf("hello world", "xyz");  // Returns -1
 * lastIndexOf("abc", "abcd");  // Returns -1 (test longer than value)
 * ```
 */
export function lastIndexOf(value, test, index = Infinity) {
    const s = toCharSliceLike(value);
    const t = toCharSliceLike(test);
    if (t.length === 0 || s.length === 0 || t.length > s.length) {
        return -1;
    }
    const l = Math.min(s.length, index === Infinity ? s.length : index + 1);
    if (l - 1 < 0) {
        return -1;
    }
    let f = 0;
    for (let i = l - 1; i > -1; i--) {
        for (let j = t.length - 1; j > -1; j--) {
            const sr = s.at(i - f) ?? -1;
            const tr = t.at(j) ?? -1;
            if (sr === -1 || tr === -1) {
                break;
            }
            if (tr === sr) {
                f++;
                if (f === t.length) {
                    return i - t.length + 1;
                }
                continue;
            }
            f = 0;
        }
        if (f === t.length) {
            return i - t.length + 1;
        }
    }
    return -1;
}
