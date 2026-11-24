/**
 * The `join` module provides functions to join command line arguments
 * into a properly escaped string. Handles platform-specific escaping
 * for Windows and Unix/Linux shells.
 *
 * @example Basic joining
 * ```ts
 * import { join } from "@neotales/args/join";
 *
 * join(["echo", "hello", "world"]);  // "echo hello world"
 * join(["ls", "-la", "my documents"]);  // 'ls -la "my documents"'
 * ```
 *
 * @example Platform-specific functions
 * ```ts
 * import { unixJoin, windowsJoin } from "@neotales/args/join";
 *
 * unixJoin(["echo", "$HOME"]);  // 'echo "\\$HOME"'
 * windowsJoin(["echo", "hello world"]);  // 'echo "hello world"'
 * ```
 *
 * @module
 */

const WINDOWS = (globalThis as { process?: { platform?: string } }).process?.platform === "win32" ||
  (globalThis as { Deno?: { build?: { os?: string } } }).Deno?.build?.os === "windows";
import { isSpace } from "@neotales/chars/is-space";
import { toCharArray } from "@neotales/slices/utils";

function containsWindowsSpecialChars(value: string): { found: boolean; codePoints?: Uint32Array } {
  const chars = toCharArray(value);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    // space or double quote
    if (c === 32 || c === 34) {
      // double quote, single quote, backslash
      return { found: true, codePoints: undefined };
    }
  }

  return { found: false, codePoints: chars };
}

function containsSpecialChars(value: string): { found: boolean; codePoints?: Uint32Array } {
  const chars = toCharArray(value);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];

    // space, double quote, single quote, backslash
    if (c === 36 || c === 96 || c === 34 || c === 92 || c === 39 || isSpace(c)) {
      // dollar sign, backtick, double quote, backslash, single quote
      return { found: true, codePoints: undefined };
    }
  }

  return { found: false, codePoints: chars };
}

/**
 * Joins command arguments into a Windows-compatible command string.
 *
 * Handles Windows-specific escaping rules:
 * - Arguments with spaces or quotes are wrapped in double quotes
 * - Backslashes before quotes are doubled
 * - Internal quotes are escaped with backslash
 *
 * @param args - The command arguments to join.
 * @returns A properly escaped Windows command string.
 *
 * @example Basic usage
 * ```ts
 * windowsJoin(["echo", "hello", "world"]);  // "echo hello world"
 * windowsJoin(["echo", "hello world"]);  // 'echo "hello world"'
 * ```
 *
 * @example With quotes
 * ```ts
 * windowsJoin(["echo", 'say "hi"']);  // 'echo "say \"hi\""'
 * ```
 */
export function windowsJoin(args: string[]): string {
  const sb: number[] = [];
  for (const arg of args) {
    if (sb.length > 0) {
      sb.push(32); // space character
    }

    const { found, codePoints } = containsWindowsSpecialChars(arg);
    if (!found) {
      sb.push(...(codePoints ?? []));
      continue;
    }

    let backslashCount = 0;
    sb.push(34); // open double quote

    const argChars = toCharArray(arg);
    for (let i = 0; i < argChars.length; i++) {
      const c = argChars[i];
      switch (c) {
        // backslash
        case 92:
          backslashCount++;
          continue;
        // double quote
        case 34: {
          const times = 2 * backslashCount + 1;
          backslashCount = 0;
          if (times > 0) {
            sb.push(...Array(times).fill(92));
          }

          sb.push(34); // close double quote
          continue;
        }

        default:
          if (backslashCount > 0) {
            if (backslashCount === 1) {
              sb.push(92);
            } else {
              sb.push(...Array(backslashCount).fill(92));
            }
            backslashCount = 0;
          }

          sb.push(c);
          continue;
      }
    }

    if (backslashCount > 0) {
      if (backslashCount === 1) {
        sb.push(92);
      } else {
        sb.push(...Array(backslashCount).fill(92));
      }
      backslashCount = 0;
    }

    sb.push(34); // close double quote
  }

  const ret = String.fromCodePoint(...sb);
  sb.length = 0; // clear the buffer
  return ret;
}

/**
 * Joins command arguments into a Unix/Linux-compatible command string.
 *
 * Handles Unix-specific escaping rules:
 * - Arguments with special chars are wrapped in double quotes
 * - Dollar signs, backticks, quotes, and backslashes are escaped
 * - Preserves literal meaning of special shell characters
 *
 * @param args - The command arguments to join.
 * @returns A properly escaped Unix command string.
 *
 * @example Basic usage
 * ```ts
 * unixJoin(["echo", "hello", "world"]);  // "echo hello world"
 * unixJoin(["echo", "hello world"]);  // 'echo "hello world"'
 * ```
 *
 * @example With special characters
 * ```ts
 * unixJoin(["echo", "$HOME"]);  // 'echo "\\$HOME"'
 * unixJoin(["echo", "`date`"]);  // 'echo "\\`date\\`"'
 * ```
 */
export function unixJoin(args: string[]): string {
  const sb: number[] = [];
  for (let i = 0; i < args.length; i++) {
    if (sb.length > 0) {
      sb.push(32); // space character
    }

    const c = args[i];
    const { found, codePoints } = containsSpecialChars(c);
    if (!found) {
      sb.push(...(codePoints ?? []));
      continue;
    }

    sb.push(34); // open double quote
    const cChars = toCharArray(c);
    for (let j = 0; j < cChars.length; j++) {
      const k = cChars[j];
      // dollar sign, backtick, double quote, backslash
      if (k === 36 || k === 96 || k === 34 || k === 92) {
        sb.push(92); // add backslash before special character
      }
      sb.push(k);
    }

    sb.push(34); // close double quote
  }

  const ret = String.fromCodePoint(...sb);
  sb.length = 0; // clear the buffer
  return ret;
}

/**
 * Joins command arguments into a platform-appropriate command string.
 *
 * Uses `windowsJoin` on Windows and `unixJoin` on Unix/Linux/macOS.
 * Properly escapes special characters for the current platform's shell.
 *
 * @param args - The command arguments to join.
 * @returns A properly escaped command string for the current platform.
 *
 * @example Basic usage
 * ```ts
 * join(["echo", "hello", "world"]);  // "echo hello world"
 * join(["ls", "-la", "my folder"]);  // 'ls -la "my folder"'
 * ```
 *
 * @example With special characters
 * ```ts
 * join(["echo", "Hello, World!"]);  // 'echo "Hello, World!"'
 * join(["git", "commit", "-m", "Fix bug #123"]);  // 'git commit -m "Fix bug #123"'
 * ```
 */
export function join(args: string[]): string {
  return WINDOWS ? windowsJoin(args) : unixJoin(args);
}
