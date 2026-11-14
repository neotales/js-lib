/**
 * Provides functions to determine if a character buffer starts with a given prefix.
 * Includes both case-sensitive and case-insensitive (fold) versions.
 *
 * @module
 */
import { simpleFold } from "@neotales/chars/simple-fold";
import { toCharSliceLike } from "./utils.js";
/**
 * Determines if a character buffer starts with the given prefix using
 * a case-insensitive (Unicode fold) comparison.
 *
 * This function handles Unicode case folding properly, including characters
 * outside the ASCII range like accented letters, Greek, Cyrillic, etc.
 *
 * @param value - The character buffer to check.
 * @param prefix - The prefix to look for.
 * @returns `true` if the buffer starts with the prefix (case-insensitive); otherwise `false`.
 *
 * @example
 * ```typescript
 * import { startsWithFold } from '@neotales/slices/starts-with';
 *
 * startsWithFold("Hello World", "hello");  // true
 * startsWithFold("Hello World", "HELLO");  // true
 * startsWithFold("WÖRLD", "wörld");        // true (handles umlauts)
 * startsWithFold("Hello World", "world");  // false (not at start)
 * ```
 */
export function startsWithFold(value, prefix) {
    const s = toCharSliceLike(value);
    const t = toCharSliceLike(prefix);
    if (t.length > s.length) {
        return false;
    }
    let i = 0;
    for (; i < t.length; i++) {
        let sr = s.at(i) ?? -1;
        let tr = t.at(i) ?? -1;
        if (sr === -1 || tr === -1) {
            return false;
        }
        if ((sr | tr) >= 0x80) {
            {
                let j = i;
                for (; j < t.length; j++) {
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
 * Determines if a character buffer starts with the given prefix using
 * an exact (case-sensitive) comparison.
 *
 * @param value - The character buffer to check.
 * @param prefix - The prefix to look for.
 * @returns `true` if the buffer starts with the exact prefix; otherwise `false`.
 *
 * @example
 * ```typescript
 * import { startsWith } from '@neotales/slices/starts-with';
 *
 * startsWith("Hello World", "Hello");  // true
 * startsWith("Hello World", "hello");  // false (case-sensitive)
 * startsWith("Hello World", "He");     // true
 * startsWith("Hello World", "World");  // false (not at start)
 * startsWith("🎉Party", "🎉");          // true (handles emoji)
 * ```
 */
export function startsWith(value, prefix) {
    const s = toCharSliceLike(value);
    const t = toCharSliceLike(prefix);
    if (t.length > s.length) {
        return false;
    }
    let i = 0;
    for (; i < t.length; i++) {
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
