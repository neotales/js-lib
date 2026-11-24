# @neotales/path

## Overview

Path utilities for operating system file paths that is a repackage
of the [@std/path](https://jsr.io/@std/path) module with minor
changes to enable it to work in node and bun.

Deno's @std/path is based upon [Browserify's implementation of path](https://github.com/browserify/path-browserify/tree/master).

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/path)](https://jsr.io/@neotales/path)
[![npm version](https://badge.fury.io/js/@neotales%2Fpath.svg)](https://badge.fury.io/js/@neotales%2Fpath)

## Runtime support

The module README table is the support claim. Path manipulation is pure
JavaScript. `fromFileUrl`, `toFileUrl`, and the URL forms of `basename`,
`dirname`, `extname`, `join`, and `normalize` need a `URL` global.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source |
| Node.js | ✅ | published npm ESM twin (node >= 22) |
| Bun | ✅ | source |
| Ende | ✅ | source |
| QuickJS-ng | ✅ (no `URL`) | one ESM bundle; URL scenarios are a printed skip |
| workerd | ✅ | one ESM bundle |
| txiki.js | ✅ | one ESM bundle |
| ClearScript | ✅ (no `URL`) | TypeScript graph; URL scenarios are a printed skip |
| browsers | ✅ | one ESM bundle; Firefox drops non-local file hosts, so those assertions are skipped there |
| JerryScript | ✅ (no `URL`, no lookbehind) | IIFE bundle. URL scenarios are skipped. `joinGlobs(..., { globstar: true })` performs no globstar matching; it joins and delegates to `normalizeGlob`, whose globstar guard uses a `(?<=...)` lookbehind. Jerry rejects that construct, so `normalizeGlob(..., { globstar: true })` and `joinGlobs(..., { globstar: true })` are skipped there. The million-character `isGlob` pattern is skipped for size |

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/path/doc)

A list of other modules can be found at [github.com/neotales/js-lib](https://github.com/neotales/js-lib)

## Installation

```bash
# Deno
deno add jsr:@neotales/path

# npm from jsr
npx jsr add @neotales/path

# from npmjs.org
npm install @neotales/path
```

## Usage

```typescript
import { basename, dirname, isAbsolute, join, resolve } from "@neotales/path";

isAbsolute("./test"); // false

const dir = resolve("./test");
const file = join(dir, "text.txt");

dirname(file);
basename(file); // "text.txt"
```

## Root Exports

Root exports select POSIX or Windows behavior from the current runtime.

| Export             | Subpath                             | Description                                                  |
| ------------------ | ----------------------------------- | ------------------------------------------------------------ |
| `basename`         | `@neotales/path/basename`           | Returns the last portion of a path.                          |
| `common`           | `@neotales/path/common`             | Returns the shared path prefix from a set of paths.          |
| `dirname`          | `@neotales/path/dirname`            | Returns the directory portion of a path.                     |
| `extname`          | `@neotales/path/extname`            | Returns the extension of a path, including the leading dot.  |
| `format`           | `@neotales/path/format`             | Creates a path string from a `ParsedPath` object.            |
| `fromFileUrl`      | `@neotales/path/from-file-url`      | Converts a file URL to a path string.                        |
| `globToRegExp`     | `@neotales/path/glob-to-regexp`     | Converts a glob string to a regular expression.              |
| `isAbsolute`       | `@neotales/path/is-absolute`        | Checks whether a path is absolute.                           |
| `isGlob`           | `@neotales/path/is-glob`            | Checks whether a string contains glob syntax.                |
| `join`             | `@neotales/path/join`               | Joins path segments and normalizes the result.               |
| `joinGlobs`        | `@neotales/path/join-globs`         | Joins glob segments and normalizes the result.               |
| `match`            | `@neotales/path/match`              | Tests a path against a glob pattern.                         |
| `matchesGlob`      | `@neotales/path/matches-glob`       | Node.js-compatible alias for `match`.                        |
| `normalize`        | `@neotales/path/normalize`          | Normalizes a path by resolving `.` and `..` segments.        |
| `normalizeGlob`    | `@neotales/path/normalize-glob`     | Normalizes a glob string.                                    |
| `parse`            | `@neotales/path/parse`              | Parses a path string into a `ParsedPath` object.             |
| `relative`         | `@neotales/path/relative`           | Returns a relative path from one path to another.            |
| `resolve`          | `@neotales/path/resolve`            | Resolves path segments into an absolute path.                |
| `toFileUrl`        | `@neotales/path/to-file-url`        | Converts a path string to a file URL.                        |
| `toNamespacedPath` | `@neotales/path/to-namespaced-path` | Converts a Windows path to a namespace path; no-op on POSIX. |

```typescript
import {
  basename,
  common,
  dirname,
  extname,
  format,
  fromFileUrl,
  globToRegExp,
  isAbsolute,
  isGlob,
  join,
  joinGlobs,
  match,
  matchesGlob,
  normalize,
  normalizeGlob,
  parse,
  relative,
  resolve,
  toFileUrl,
  toNamespacedPath,
} from "@neotales/path";

basename("/tmp/file.txt"); // "file.txt"
common(["/tmp/a", "/tmp/b"]); // "/tmp"
dirname("/tmp/file.txt"); // "/tmp"
extname("/tmp/file.txt"); // ".txt"
format({ dir: "/tmp", base: "file.txt" }); // "/tmp/file.txt"
fromFileUrl("file:///tmp/file.txt"); // "/tmp/file.txt" on POSIX
globToRegExp("**/*.ts", { globstar: true }).test("src/index.ts"); // true
isAbsolute("/tmp"); // true on POSIX
isGlob("**/*.ts"); // true
join("/tmp", "file.txt"); // "/tmp/file.txt" on POSIX
joinGlobs(["src", "**", "*.ts"], { globstar: true }); // "src/**/*.ts" on POSIX
match("src/index.ts", "src/*.ts"); // true
matchesGlob("src/index.ts", "src/*.ts"); // true
normalize("/tmp/../tmp/file.txt"); // "/tmp/file.txt" on POSIX
normalizeGlob("foo/bar/../*", { globstar: true }); // "foo/*" on POSIX
parse("/tmp/file.txt").base; // "file.txt"
relative("/tmp/a", "/tmp/b"); // "../b" on POSIX
resolve("."); // current working directory
toFileUrl("/tmp/file.txt").href; // "file:///tmp/file.txt" on POSIX
toNamespacedPath("/tmp/file.txt"); // "/tmp/file.txt" on POSIX
```

## Constants And Types

| Export              | Subpath                         | Description                                              |
| ------------------- | ------------------------------- | -------------------------------------------------------- |
| `DELIMITER`         | `@neotales/path/constants`      | Current-runtime PATH environment delimiter.              |
| `SEPARATOR`         | `@neotales/path/constants`      | Current-runtime path separator.                          |
| `SEPARATOR_PATTERN` | `@neotales/path/constants`      | Current-runtime separator-matching regular expression.   |
| `GlobOptions`       | `@neotales/path/glob-to-regexp` | Options for glob conversion, joining, and normalization. |
| `ParsedPath`        | `@neotales/path/types`          | Parsed path object shape used by `parse` and `format`.   |

```typescript
import { DELIMITER, SEPARATOR, SEPARATOR_PATTERN } from "@neotales/path/constants";
import type { GlobOptions, ParsedPath } from "@neotales/path";

process.env.PATH?.split(DELIMITER);
["tmp", "file.txt"].join(SEPARATOR);
"tmp///file.txt".split(SEPARATOR_PATTERN);

const options: GlobOptions = { globstar: true };
const parsed: ParsedPath = { root: "/", dir: "/tmp", base: "file.txt", ext: ".txt", name: "file" };
```

## POSIX Exports

POSIX exports are available from `@neotales/path/posix` and from explicit subpaths.
They always use `/` separators regardless of the current runtime.

| Export                                        | Subpath                                   |
| --------------------------------------------- | ----------------------------------------- |
| `basename`                                    | `@neotales/path/posix/basename`           |
| `common`                                      | `@neotales/path/posix/common`             |
| `DELIMITER`, `SEPARATOR`, `SEPARATOR_PATTERN` | `@neotales/path/posix/constants`          |
| `dirname`                                     | `@neotales/path/posix/dirname`            |
| `extname`                                     | `@neotales/path/posix/extname`            |
| `format`                                      | `@neotales/path/posix/format`             |
| `fromFileUrl`                                 | `@neotales/path/posix/from-file-url`      |
| `globToRegExp`                                | `@neotales/path/posix/glob-to-regexp`     |
| `isAbsolute`                                  | `@neotales/path/posix/is-absolute`        |
| `isGlob`                                      | `@neotales/path/posix/is-glob`            |
| `join`                                        | `@neotales/path/posix/join`               |
| `joinGlobs`                                   | `@neotales/path/posix/join-globs`         |
| `match`                                       | `@neotales/path/posix/match`              |
| `matchesGlob`                                 | `@neotales/path/posix/matches-glob`       |
| `normalize`                                   | `@neotales/path/posix/normalize`          |
| `normalizeGlob`                               | `@neotales/path/posix/normalize-glob`     |
| `parse`                                       | `@neotales/path/posix/parse`              |
| `relative`                                    | `@neotales/path/posix/relative`           |
| `resolve`                                     | `@neotales/path/posix/resolve`            |
| `toFileUrl`                                   | `@neotales/path/posix/to-file-url`        |
| `toNamespacedPath`                            | `@neotales/path/posix/to-namespaced-path` |
| `ParsedPath`                                  | `@neotales/path/posix`                    |

```typescript
import * as posix from "@neotales/path/posix";

posix.join("/tmp", "file.txt"); // "/tmp/file.txt"
posix.relative("/tmp/a", "/tmp/b"); // "../b"
posix.toFileUrl("/tmp/file.txt").href; // "file:///tmp/file.txt"
```

## Windows Exports

Windows exports are available from `@neotales/path/windows` and from explicit
subpaths. They always use Windows path rules regardless of the current runtime.

| Export                                        | Subpath                                     |
| --------------------------------------------- | ------------------------------------------- |
| `basename`                                    | `@neotales/path/windows/basename`           |
| `common`                                      | `@neotales/path/windows/common`             |
| `DELIMITER`, `SEPARATOR`, `SEPARATOR_PATTERN` | `@neotales/path/windows/constants`          |
| `dirname`                                     | `@neotales/path/windows/dirname`            |
| `extname`                                     | `@neotales/path/windows/extname`            |
| `format`                                      | `@neotales/path/windows/format`             |
| `fromFileUrl`                                 | `@neotales/path/windows/from-file-url`      |
| `globToRegExp`                                | `@neotales/path/windows/glob-to-regexp`     |
| `isAbsolute`                                  | `@neotales/path/windows/is-absolute`        |
| `isGlob`                                      | `@neotales/path/windows/is-glob`            |
| `join`                                        | `@neotales/path/windows/join`               |
| `joinGlobs`                                   | `@neotales/path/windows/join-globs`         |
| `match`                                       | `@neotales/path/windows/match`              |
| `matchesGlob`                                 | `@neotales/path/windows/matches-glob`       |
| `normalize`                                   | `@neotales/path/windows/normalize`          |
| `normalizeGlob`                               | `@neotales/path/windows/normalize-glob`     |
| `parse`                                       | `@neotales/path/windows/parse`              |
| `relative`                                    | `@neotales/path/windows/relative`           |
| `resolve`                                     | `@neotales/path/windows/resolve`            |
| `toFileUrl`                                   | `@neotales/path/windows/to-file-url`        |
| `toNamespacedPath`                            | `@neotales/path/windows/to-namespaced-path` |
| `ParsedPath`                                  | `@neotales/path/windows`                    |

```typescript
import * as windows from "@neotales/path/windows";

windows.join("C:\\tmp", "file.txt"); // "C:\\tmp\\file.txt"
windows.parse("C:\\tmp\\file.txt").root; // "C:\\"
windows.toNamespacedPath("C:\\tmp\\file.txt"); // "\\\\?\\C:\\tmp\\file.txt"
```

## Notes

`@neotales/path` repackages Deno `@std/path` to avoid runtime-specific package
shims when publishing `@neotales/*` modules to npm. It also includes URL helpers
such as `toFileUrl` and `fromFileUrl` that are not exposed by `node:path`.
Resolving relative paths requires a runtime current working directory; it throws
in browser-like runtimes without one.

## License

[MIT License](./LICENSE.md)

This package includes code from Deno `@std/path` and `path-browserify`; see
[`LICENSE.md`](./LICENSE.md) for full notices.
