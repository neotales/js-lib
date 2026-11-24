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
export declare function windowsJoin(args: string[]): string;
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
export declare function unixJoin(args: string[]): string;
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
export declare function join(args: string[]): string;
