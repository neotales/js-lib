/**
 * The `split` module provides a function to split a command line string
 * into an array of arguments. Handles quoted strings, escaped characters,
 * and multiline continuation for bash/PowerShell scripts.
 *
 * @example Basic splitting
 * ```ts
 * import { split } from "@neotales/args/split";
 *
 * split("echo hello world");  // ["echo", "hello", "world"]
 * split("git commit -m 'Initial commit'");  // ["git", "commit", "-m", "Initial commit"]
 * ```
 *
 * @example Quoted arguments with spaces
 * ```ts
 * import { split } from "@neotales/args/split";
 *
 * split('ls -la "my documents"');  // ["ls", "-la", "my documents"]
 * split("grep 'hello world' file.txt");  // ["grep", "hello world", "file.txt"]
 * ```
 *
 * @example Multiline continuation
 * ```ts
 * import { split } from "@neotales/args/split";
 *
 * const cmd = `docker run \\
 *   --name myapp \\
 *   -p 8080:80`;
 * split(cmd);  // ["docker", "run", "--name", "myapp", "-p", "8080:80"]
 * ```
 *
 * @module
 */
/**
 * Splits a command line string into an array of arguments.
 *
 * Handles:
 * - Space-separated arguments
 * - Single and double quoted strings (preserving internal spaces)
 * - Escaped quotes within strings
 * - Multiline continuation with backslash (\) or backtick (`)
 * - Bash and PowerShell multiline syntax
 *
 * @param value - The command line string to split.
 * @returns An array of argument strings.
 *
 * @example Basic usage
 * ```ts
 * split("hello world");  // ["hello", "world"]
 * split("git clone https://example.com");  // ["git", "clone", "https://example.com"]
 * ```
 *
 * @example Double quoted arguments
 * ```ts
 * split('echo "hello world"');  // ["echo", "hello world"]
 * split('ls -la "my folder"');  // ["ls", "-la", "my folder"]
 * ```
 *
 * @example Single quoted arguments
 * ```ts
 * split("echo 'hello world'");  // ["echo", "hello world"]
 * split("grep 'pattern with spaces' file.txt");  // ["grep", "pattern with spaces", "file.txt"]
 * ```
 *
 * @example Escaped quotes
 * ```ts
 * split('echo \\"quoted\\"');  // ["echo", '\\"quoted\\"']
 * ```
 *
 * @example Multiline with backslash continuation
 * ```ts
 * const cmd = `--hello \\
 * "world"`;
 * split(cmd);  // ["--hello", "world"]
 * ```
 */
export declare function split(value: string): string[];
