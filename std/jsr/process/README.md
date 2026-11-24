# @neotales/process

## Overview

Cross-runtime process utilities providing access to process ID, command-line arguments,
executable path, current working directory, directory navigation, and standard I/O streams.
Full process support is provided in Deno, Node.js, Bun, and Ende; capability-specific partial
backends are listed below.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/process)](https://jsr.io/@neotales/process)
[![npm version](https://badge.fury.io/js/@neotales%2Fprocess.svg)](https://badge.fury.io/js/@neotales%2Fprocess)

<!-- runtime-support:begin -->

## Runtime support

| Runtime | Support | Available capabilities and exact gaps |
| --- | --- | --- |
| Deno | Full | All exported process APIs use Deno's native process/stdio APIs. OS permissions (notably `--allow-sys` and directory permissions) and platform behavior still apply; `close()` closes Deno's standard handles. |
| Node.js | Full | Native metadata, cwd/chdir, exit and fd-backed sync/async standard streams. `close()` intentionally leaves host-owned Node streams open. |
| Bun | Full | Node-compatible process APIs and fd-backed standard streams. `close()` intentionally leaves host-owned streams open. |
| QuickJS-ng 0.18.0 | Partial | When `std`/`os` are exposed (`--std` or imported from `qjs:std`/`qjs:os`), args, executable path (`os.exePath`, not script path), pid, cwd/chdir, exit and std FILE streams are available. No ppid; stream async methods are Promise wrappers around blocking FILE I/O. |
| txiki.js 26.11.0 | Partial | Native args, pid/ppid, cwd/chdir, executable path, exit and WHATWG stdin/stdout/stderr. Stream reads/writes are async only; sync reads/writes throw and `isTerm()` reports false because no terminal query is exposed. Stream close is a no-op. |
| Chromium | Partial | Empty args/zero IDs, URL-path cwd, no-op chdir, console output and null stdin; no executable path or process exit. |
| Cloudflare Workers (workerd) | Partial | Tested with the lane's 2026-11-10 compatibility date (`nodejs_compat` default): `process.pid` is the sentinel `1`, `cwd()` is `/bundle`, argv has one entry, stdin is an empty readable stream, stdout is log-backed/non-TTY, and `chdir(".")` leaves cwd unchanged while a nonexistent path throws. These are worker shims, not OS process control; do not use `exit()` to terminate a worker. |
| JerryScript 3.0.0 | Partial | Standalone CLI exposes `print` only among the inspected process globals; stdout/stderr use print fallback. No args, pid/ppid, cwd/chdir, executable path, exit or stdin; custom embeddings may supply host APIs. |
| Ende | Full | Ende exposes a Deno-compatible process API; the isolated child probe verifies metadata, cwd/chdir, pushd/popd, exit status, and real sync/async stdio when launched with `--allow-sys --allow-read --allow-write`. |
| ClearScript | Unverified | Host capabilities depend on embedding. No .NET host was launched in this task, so no ClearScript capability is claimed. |

QuickJS's static API remains safe in classic-script hosts: consumers using
module imports rather than the CLI `--std` option must expose the `qjs:std`
and `qjs:os` namespaces on `globalThis.std` and `globalThis.os` before loading
the process module. The QuickJS lane verifies this ESM import/injection path.

“Full” means the public APIs are backed by host behavior, not that OS
permissions, terminal attachment, or platform-specific semantics disappear.
The focused tests exercise each capability available to the runtime; QuickJS
and txiki additionally run isolated child probes that verify exit status and
real piped stdin/stdout/stderr. `execPath()` means the runtime executable path;
QuickJS `scriptArgs[0]` is the script filename and is deliberately not used as
the executable path.

<!-- runtime-support:end -->

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/process/doc)

A list of other modules can be found at [github.com/neotales/js-lib](https://github.com/neotales/js-lib)

## Installation

```bash
# Deno
deno add jsr:@neotales/process

# npm from jsr
npx jsr add @neotales/process

# from npmjs.org
npm install @neotales/process
```

## Quick Start

```typescript
import { args, chdir, cwd, execPath, exit, pid, stdout } from "@neotales/process";

// Access process info
console.log("PID:", pid);
console.log("Args:", args);
console.log("Executable:", execPath());
console.log("Working directory:", cwd());

// Change directory
chdir("../other-project");
console.log("New directory:", cwd());

// Write to stdout
const encoder = new TextEncoder();
stdout.writeSync(encoder.encode("Hello from stdout\n"));

// Exit with code
exit(0);
```

## API Reference

### Constants

| Constant | Type                    | Description                                                  |
| -------- | ----------------------- | ------------------------------------------------------------ |
| `pid`    | `number`                | The process ID of the current process (0 in browser)         |
| `ppid`   | `number`                | The parent process ID (0 in browser)                         |
| `args`   | `ReadonlyArray<string>` | Command-line arguments (excludes executable and script path) |
| `stdin`  | `StdReader`             | Standard input stream reader                                 |
| `stdout` | `StdWriter`             | Standard output stream writer                                |
| `stderr` | `StdWriter`             | Standard error stream writer                                 |

```typescript
import { args, pid, ppid } from "@neotales/process";

// Process ID
console.log(`Running as PID: ${pid}`);
console.log(`Started by PID: ${ppid}`);

// Command-line arguments (e.g., `deno run script.ts --flag value`)
// args = ["--flag", "value"]
for (const arg of args) {
  console.log(`Arg: ${arg}`);
}
```

### Directory Functions

| Function           | Description                                |
| ------------------ | ------------------------------------------ |
| `cwd()`            | Returns the current working directory      |
| `chdir(directory)` | Changes the current working directory      |
| `pushd(directory)` | Push directory to stack and change to it   |
| `popd()`           | Pop directory from stack and change to it  |
| `execPath()`       | Returns the path to the current executable |

```typescript
import { chdir, cwd, execPath, popd, pushd } from "@neotales/process";

// Get current directory
console.log(cwd()); // "/home/user/project"

// Change directory
chdir("../other");
console.log(cwd()); // "/home/user/other"

// Use pushd/popd for temporary directory changes
pushd("/tmp");
console.log(cwd()); // "/tmp"
const prevDir = popd();
console.log(prevDir); // "/home/user/project"

// Get executable path
console.log(execPath()); // "/usr/bin/deno" or similar
```

### Process Control

| Function      | Description                                            |
| ------------- | ------------------------------------------------------ |
| `exit(code?)` | Exits the process with optional exit code (default: 0) |

```typescript
import { exit } from "@neotales/process";

// Exit successfully
exit(0);

// Exit with error
exit(1);
```

### Standard Streams

| Interface   | Methods                                                   |
| ----------- | --------------------------------------------------------- |
| `StdWriter` | `write(chunk)`, `writeSync(chunk)`, `isTerm()`, `close()` |
| `StdReader` | `read(data)`, `readSync(data)`, `isTerm()`, `close()`     |

On Node.js, `close()` is a no-op because these streams belong to the host process.
`close()` also leaves Bun, QuickJS, and txiki host streams open; Deno closes its
standard handles. Browser and fallback streams have no host handle to close.

`read()` and `write()` return promises, but this does not guarantee non-blocking
I/O or cancellation. In QuickJS-ng, both methods perform synchronous FILE I/O
before returning a resolved promise. Other runtimes use the host behavior
described in the runtime table; the API has no cancellation parameter.

```typescript
import { stderr, stdin, stdout } from "@neotales/process";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Write to stdout
stdout.writeSync(encoder.encode("Output message\n"));
// In QuickJS-ng, the FILE write blocks before this promise is returned.
await stdout.write(encoder.encode("Async output\n"));

// Write to stderr
stderr.writeSync(encoder.encode("Error message\n"));

// Check if stream is a terminal
if (stdout.isTerm()) {
  console.log("Running in interactive terminal");
}

// Read from stdin
const buffer = new Uint8Array(1024);
const bytesRead = stdin.readSync(buffer);
if (bytesRead !== null && bytesRead > 0) {
  console.log("Input:", decoder.decode(buffer.subarray(0, bytesRead)));
}

// On hosts with genuinely asynchronous stdin this awaits the host read.
// In QuickJS-ng, the synchronous FILE read occurs before the promise is returned.
const asyncBytesRead = await stdin.read(buffer);
```

### Error Classes

| Class                  | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `ChangeDirectoryError` | Thrown when `chdir()` fails (e.g., directory not found) |

```typescript
import { ChangeDirectoryError, chdir } from "@neotales/process";

try {
  chdir("/nonexistent/path");
} catch (error) {
  if (error instanceof ChangeDirectoryError) {
    console.error("Failed to change directory:", error.message);
  }
}
```

## Browser Support (Experimental)

The browser polyfill provides limited functionality:

| Feature            | Browser Behavior            |
| ------------------ | --------------------------- |
| `pid`              | Always returns 0            |
| `args`             | Returns empty array         |
| `cwd()`            | Returns `location.pathname` |
| `chdir(path)`      | No-op                       |
| `pushd()`/`popd()` | No-op                       |
| `exit()`           | Throws because browsers cannot exit the host process |
| `stdout/stderr`    | Write to console            |
| `stdin`            | Returns null for reads      |

## License

[MIT License](./LICENSE.md)
