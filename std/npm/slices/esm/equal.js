/**
 * The `equal` module provides functions to compare two character buffers
 * for equality. Supports both case-sensitive and case-insensitive (fold)
 * comparison with full Unicode support.
 *
 * @example Case-sensitive equality
 * ```ts
 * import { equal } from "@neotales/slices/equal";
 *
 * equal("hello", "hello");  // Returns true
 * equal("Hello", "hello");  // Returns false
 * ```
 *
 * @example Case-insensitive equality
 * ```ts
 * import { equalFold } from "@neotales/slices/equal";
 *
 * equalFold("HELLO", "hello");  // Returns true
 * equalFold("Café", "CAFÉ");  // Returns true
 * ```
 *
 * @module
 */
import { simpleFold } from "@neotales/chars/simple-fold";
import { toCharSliceLike } from "./utils.js";
/**
 * Determines if two character buffers are equal using case-insensitive
 * (fold) comparison.
 *
 * Uses Unicode case folding for proper comparison of international characters
 * including accented letters, Greek, Cyrillic, and other scripts.
 *
 * @param value - The first character buffer to compare.
 * @param test - The second character buffer to compare.
 * @returns `true` if the buffers are equal (case-insensitive); otherwise `false`.
 *
 * @example Basic case-insensitive comparison
 * ```ts
 * equalFold("Hello", "HELLO");  // Returns true
 * equalFold("ABC", "abc");  // Returns true
 * ```
 *
 * @example With accented characters
 * ```ts
 * equalFold("café", "CAFÉ");  // Returns true
 * equalFold("über", "ÜBER");  // Returns true
 * ```
 *
 * @example Different lengths return false
 * ```ts
 * equalFold("hello", "hello ");  // Returns false
 * ```
 */
export function equalFold(value, test) {
    const s = toCharSliceLike(value);
    const t = toCharSliceLike(test);
    if (s.length !== t.length) {
        return false;
    }
    let i = 0;
    for (; i < s.length; i++) {
        let sr = s.at(i) ?? -1;
        let tr = t.at(i) ?? -1;
        if (sr === -1 || tr === -1) {
            return false;
        }
        if ((sr | tr) >= 0x80) {
            {
                let j = i;
                for (; j < s.length; j++) {
                    let sourceRune = s.at(j) ?? -1;
                    let testRune = t.at(j) ?? -1;
                    if (sourceRune === -1 || testRune === -1) {
                        return false;
                    }
                    if (testRune === sourceRune) {
                        continue;
                    }
                    if (testRune < sourceRune) {
                        const tmp = testRune;
                        testRune = sourceRune;
                        sourceRune = tmp;
                    }
                    // short circuit if testRune is ASCII
                    if (testRune < 0x80) {
                        if (65 <= sourceRune && sourceRune <= 90 && testRune === sourceRune + 32) {
                            continue;
                        }
                        return false;
                    }
                    let r = simpleFold(sourceRune);
                    while (r !== sourceRune && r < testRune) {
                        r = simpleFold(r);
                    }
                    if (r === testRune) {
                        continue;
                    }
                    return false;
                }
                return true;
            }
        }
        if (tr === sr) {
            continue;
        }
        if (tr < sr) {
            const tmp = tr;
            tr = sr;
            sr = tmp;
        }
        if (65 <= sr && sr <= 90 && tr === sr + 32) {
            continue;
        }
        return false;
    }
    return true;
}
/**
 * Determines if two character buffers are equal using case-sensitive comparison.
 *
 * @param value - The first character buffer to compare.
 * @param test - The second character buffer to compare.
 * @returns `true` if the buffers are exactly equal; otherwise `false`.
 *
 * @example Basic comparison
 * ```ts
 * equal("hello", "hello");  // Returns true
 * equal("Hello", "hello");  // Returns false (case mismatch)
 * ```
 *
 * @example With Unicode
 * ```ts
 * equal("café", "café");  // Returns true
 * equal("你好", "你好");  // Returns true
 * ```
 *
 * @example Different lengths return false
 * ```ts
 * equal("hello", "hello ");  // Returns false
 * ```
 */
export function equal(value, test) {
    const s = toCharSliceLike(value);
    const t = toCharSliceLike(test);
    if (s.length !== t.length) {
        return false;
    }
    let i = 0;
    for (; i < s.length; i++) {
        const sr = s.at(i) ?? -1;
        const tr = t.at(i) ?? -1;
        if (sr === -1 || tr === -1) {
            return false;
        }
        if (tr === sr) {
            continue;
        }
        return false;
    }
    return true;
}
