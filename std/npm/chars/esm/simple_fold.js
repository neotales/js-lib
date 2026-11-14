import { toLower } from "./to_lower.js";
import { toUpper } from "./to_upper.js";
import { AsciiFold, CaseOrbit } from "./tables/case.js";
/**
 * Returns the folded character of the given character. If the character is
 * uppercase, lowercase is returned.  If the character is lowercase, uppercase is returned.
 *
 * If the character like digits 0-1 cannot be folded, the original character is returned.
 *
 * @param char The character to fold.
 * @returns The folded character.
 *
 * @example
 * ```ts
 * import { simpleFold } from "@neotales/chars";
 *
 * console.log(String.fromCharCode(simpleFold(0x41))); // 'a'
 * console.log(String.fromCharCode(simpleFold(0x61))); // 'A'
 * console.log(String.fromCharCode(simpleFold(0xDF))); // 's'
 * console.log(String.fromCharCode(simpleFold(0x73))); // 'ß'
 * console.log(String.fromCharCode(simpleFold(0x1F88))); // 'ᾀ'
 * console.log(String.fromCharCode(simpleFold(0x1F80))); // 'ᾈ'
 * ```
 */
export function simpleFold(char) {
    if (char < 0 || char > 0x10ffff) {
        return char;
    }
    if (char < AsciiFold.length) {
        return AsciiFold[char];
    }
    // Consult caseOrbit table for special cases.
    let lo = 0;
    let hi = CaseOrbit.length;
    while (lo < hi) {
        const m = (lo + hi) >>> 1;
        if (CaseOrbit[m][0] < char) {
            lo = m + 1;
        }
        else {
            hi = m;
        }
    }
    if ((lo < CaseOrbit.length && CaseOrbit[lo][0]) === char) {
        return CaseOrbit[lo][1];
    }
    // No folding specified. This is a one- or two-element
    // equivalence class containing rune and ToLower(rune)
    // and ToUpper(rune) if they are different from rune.
    const l = toLower(char);
    if (l != char) {
        return l;
    }
    return toUpper(char);
}
