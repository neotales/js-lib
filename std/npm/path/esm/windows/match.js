/**
 * Tests whether a Windows path matches a glob pattern.
 *
 * @param path The path to test.
 * @param pattern The glob pattern.
 * @returns `true` when the path matches the pattern.
 */
import { globToRegExp } from "./glob_to_regexp.js";
export function match(path, pattern) {
    return globToRegExp(pattern).test(path);
}
