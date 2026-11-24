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
import { CHAR_BACKWARD_SLASH, CHAR_CARRIAGE_RETURN, CHAR_DOUBLE_QUOTE, CHAR_GRAVE_ACCENT, CHAR_LINE_FEED, CHAR_SINGLE_QUOTE, CHAR_SPACE, } from "@neotales/chars/constants";
import { toCharArray } from "@neotales/slices/utils";
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
export function split(value) {
    let Quote;
    (function (Quote) {
        Quote[Quote["None"] = 0] = "None";
        Quote[Quote["Single"] = 1] = "Single";
        Quote[Quote["Double"] = 2] = "Double";
    })(Quote || (Quote = {}));
    let quote = Quote.None;
    const tokens = [];
    const sb = [];
    const chars = toCharArray(value);
    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        if (quote > Quote.None) {
            if ((c === CHAR_SINGLE_QUOTE || c === CHAR_DOUBLE_QUOTE) &&
                chars[i - 1] === CHAR_BACKWARD_SLASH) {
                const copy = sb.slice(0, sb.length - 1);
                sb.length = 0; // clear the string builder
                sb.push(...copy);
                sb.push(c);
                continue;
            }
            if (quote === Quote.Single && c === CHAR_SINGLE_QUOTE) {
                quote = Quote.None;
                if (sb.length > 0) {
                    tokens.push(String.fromCodePoint(...sb));
                }
                sb.length = 0; // clear the string builder
                continue;
            }
            else if (quote === Quote.Double && c === CHAR_DOUBLE_QUOTE) {
                quote = Quote.None;
                if (sb.length > 0) {
                    tokens.push(String.fromCodePoint(...sb));
                }
                sb.length = 0; // clear the string builder
                continue;
            }
            sb.push(c);
            continue;
        }
        if (c === CHAR_SPACE) {
            const remaining = chars.length - 1 - i;
            if (remaining > 2) {
                // if the line ends with characters that normally allow for scripts with multiline
                // statements, consume token and skip characters.
                // ' \\\n'
                // ' \\\r\n'
                // ' `\n'
                // ' `\r\n'
                const j = chars[i + 1];
                const k = chars[i + 2];
                if (j === CHAR_SINGLE_QUOTE || j === CHAR_GRAVE_ACCENT) {
                    if (k === CHAR_LINE_FEED) {
                        i += 2;
                        if (sb.length > 0) {
                            tokens.push(String.fromCodePoint(...sb));
                        }
                        sb.length = 0; // clear the string builder
                        continue;
                    }
                    if (remaining > 3) {
                        const l = chars[i + 3];
                        if (k === CHAR_CARRIAGE_RETURN && l === CHAR_LINE_FEED) {
                            i += 3;
                            if (sb.length > 0) {
                                tokens.push(String.fromCodePoint(...sb));
                            }
                            sb.length = 0; // clear the string builder
                            continue;
                        }
                    }
                }
            }
            if (sb.length > 0) {
                tokens.push(String.fromCodePoint(...sb));
            }
            sb.length = 0; // clear the string builder
            continue;
        }
        if (c === CHAR_BACKWARD_SLASH) {
            const next = chars[i + 1];
            if (next === CHAR_SPACE || next === CHAR_SINGLE_QUOTE || next === CHAR_DOUBLE_QUOTE) {
                sb.push(c);
                sb.push(next);
                i++;
                continue;
            }
            else {
                sb.push(c);
                continue;
            }
        }
        if (sb.length === 0) {
            if (c === CHAR_SINGLE_QUOTE || c === CHAR_DOUBLE_QUOTE) {
                if (i > 0 && chars[i - 1] === CHAR_BACKWARD_SLASH) {
                    sb.push(c);
                    continue;
                }
                quote = c === CHAR_SINGLE_QUOTE ? Quote.Single : Quote.Double;
                continue;
            }
        }
        sb.push(c);
    }
    if (sb.length > 0) {
        tokens.push(String.fromCodePoint(...sb));
    }
    sb.length = 0; // clear the string builder
    return tokens;
}
