/**
 * ## Overview
 *
 * Cross-runtime process utilities providing access to process ID, command-line arguments,
 * executable path, current working directory, directory navigation, and standard I/O streams.
 * Provides full native process support in Deno, Node.js, and Bun, partial support in
 * runtimes that expose only some process facilities, and a limited browser fallback.
 *
 * ![logo](https://raw.githubusercontent.com/neotales/js-libraries/refs/heads/dev/eng/assets/logo.png)
 *
 * [![JSR](https://jsr.io/badges/@neotales/process)](https://jsr.io/@neotales/process)
 * [![npm version](https://badge.fury.io/js/@neotales%2Fprocess.svg)](https://badge.fury.io/js/@neotales%2Fprocess)
 * [![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-std.svg)](https://badge.fury.io/gh/neotales%2Fjs-std)
 *
 * ## Documentation
 *
 * Documentation is available on [jsr.io](https://jsr.io/@neotales/process/doc)
 *
 * A list of other modules can be found at [github.com/neotales/js-libraries](https://github.com/neotales/js-libraries)
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@neotales/process
 *
 * # npm from jsr
 * npx jsr add @neotales/process
 *
 * # from npmjs.org
 * npm install @neotales/process
 * ```
 *
 * ## Quick Start
 *
 * ```typescript
 * import { args, pid, execPath, cwd, chdir, exit, stdout } from "@neotales/process";
 *
 * // Access process info
 * console.log("PID:", pid);
 * console.log("Args:", args);
 * console.log("Executable:", execPath());
 * console.log("Working directory:", cwd());
 *
 * // Change directory
 * chdir("../other-project");
 * console.log("New directory:", cwd());
 *
 * // Write to stdout
 * const encoder = new TextEncoder();
 * stdout.writeSync(encoder.encode("Hello from stdout\n"));
 *
 * // Exit with code
 * exit(0);
 * ```
 *
 * ## API Reference
 *
 * ### Constants
 *
 * | Constant | Type | Description |
 * |----------|------|-------------|
 * | `pid` | `number` | The process ID of the current process (0 in browser) |
 * | `ppid` | `number` | The parent process ID (0 in browser) |
 * | `args` | `ReadonlyArray<string>` | Command-line arguments (excludes executable and script path) |
 * | `stdin` | `StdReader` | Standard input stream reader |
 * | `stdout` | `StdWriter` | Standard output stream writer |
 * | `stderr` | `StdWriter` | Standard error stream writer |
 *
 * ```typescript
 * import { pid, args } from "@neotales/process";
 *
 * // Process ID
 * console.log(`Running as PID: ${pid}`);
 *
 * // Command-line arguments (e.g., `deno run script.ts --flag value`)
 * // args = ["--flag", "value"]
 * for (const arg of args) {
 *     console.log(`Arg: ${arg}`);
 * }
 * ```
 *
 * ### Directory Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `cwd()` | Returns the current working directory |
 * | `chdir(directory)` | Changes the current working directory |
 * | `pushd(directory)` | Push directory to stack and change to it |
 * | `popd()` | Pop directory from stack and change to it |
 * | `execPath()` | Returns the path to the current executable |
 *
 * ```typescript
 * import { cwd, chdir, pushd, popd, execPath } from "@neotales/process";
 *
 * // Get current directory
 * console.log(cwd()); // "/home/user/project"
 *
 * // Change directory
 * chdir("../other");
 * console.log(cwd()); // "/home/user/other"
 *
 * // Use pushd/popd for temporary directory changes
 * pushd("/tmp");
 * console.log(cwd()); // "/tmp"
 * const prevDir = popd();
 * console.log(prevDir); // "/tmp"
 *
 * // Get executable path
 * console.log(execPath()); // "/usr/bin/deno" or similar
 * ```
 *
 * ### Process Control
 *
 * | Function | Description |
 * |----------|-------------|
 * | `exit(code?)` | Exits the process with optional exit code (default: 0) |
 *
 * ```typescript
 * import { exit } from "@neotales/process";
 *
 * // Exit successfully
 * exit(0);
 *
 * // Exit with error
 * exit(1);
 * ```
 *
 * ### Standard Streams
 *
 * | Interface | Methods |
 * |-----------|---------|
 * | `StdWriter` | `write(chunk)`, `writeSync(chunk)`, `isTerm()`, `close()` |
 * | `StdReader` | `read(data)`, `readSync(data)`, `isTerm()`, `close()` |
 *
 * ```typescript
 * import { stdout, stderr, stdin } from "@neotales/process";
 *
 * const encoder = new TextEncoder();
 * const decoder = new TextDecoder();
 *
 * // Write to stdout
 * stdout.writeSync(encoder.encode("Output message\n"));
 * await stdout.write(encoder.encode("Async output\n"));
 *
 * // Write to stderr
 * stderr.writeSync(encoder.encode("Error message\n"));
 *
 * // Check if stream is a terminal
 * if (stdout.isTerm()) {
 *     console.log("Running in interactive terminal");
 * }
 *
 * // Read from stdin
 * const buffer = new Uint8Array(1024);
 * const bytesRead = stdin.readSync(buffer);
 * if (bytesRead !== null && bytesRead > 0) {
 *     console.log("Input:", decoder.decode(buffer.subarray(0, bytesRead)));
 * }
 * ```
 *
 * ### Error Classes
 *
 * | Class | Description |
 * |-------|-------------|
 * | `ChangeDirectoryError` | Thrown when `chdir()` fails (e.g., directory not found) |
 *
 * ```typescript
 * import { chdir, ChangeDirectoryError } from "@neotales/process";
 *
 * try {
 *     chdir("/nonexistent/path");
 * } catch (error) {
 *     if (error instanceof ChangeDirectoryError) {
 *         console.error("Failed to change directory:", error.message);
 *     }
 * }
 * ```
 *
 * ## Browser Support (Experimental)
 *
 * The browser polyfill provides limited functionality:
 *
 * | Feature | Browser Behavior |
 * |---------|------------------|
 * | `pid` | Always returns 0 |
 * | `args` | Returns empty array |
 * | `cwd()` | Returns `location.pathname` |
 * | `chdir()`/`pushd()`/`popd()` | No-op |
 * | `exit()` | Throws because a browser cannot exit the host process |
 * | `stdout/stderr` | Write to console |
 * | `stdin` | Returns null for reads |
 *
 * ## License
 *
 * [MIT License](./LICENSE.md)
 *
 * @module
 */
import "./_dnt.polyfills.js";
export * from "./args.js";
export * from "./chdir.js";
export * from "./cwd.js";
export * from "./exec_path.js";
export * from "./exit.js";
export * from "./pid.js";
export * from "./ppid.js";
export * from "./popd.js";
export * from "./pushd.js";
export * from "./streams.js";
