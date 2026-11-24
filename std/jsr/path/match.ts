/**
 * Tests whether a path matches a glob pattern using the current platform's
 * path separators.
 *
 * @param path The path to test.
 * @param pattern The glob pattern.
 * @returns `true` when the path matches the pattern.
 */
import { globToRegExp } from "./glob_to_regexp.ts";

export function match(path: string, pattern: string): boolean {
  return globToRegExp(pattern).test(path);
}
