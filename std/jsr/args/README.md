# @neotales/args

## Overview

Cross-runtime command-line argument helpers: split shell-like strings, join
argument arrays, splat an object into arguments, and parse options into a
JSON-like object.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/args)](https://jsr.io/@neotales/args)
[![npm version](https://badge.fury.io/js/@neotales%2Fargs.svg)](https://badge.fury.io/js/@neotales%2Fargs)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/args/doc).

[Module list](https://github.com/neotales/js-lib).

## Installation

```bash
# Deno
deno add jsr:@neotales/args

# npm from jsr
npx jsr add @neotales/args

# from npmjs.org
npm install @neotales/args
```

### Runtime support

The module README table is the support claim.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source |
| Node.js | ✅ | published npm ESM twin (node >= 22) |
| Bun | ✅ | source; Bun rewrites @neotales/ imports to relative paths |
| Ende | ✅ | source |
| QuickJS-ng | ✅ | one ESM bundle |
| workerd | ✅ | one ESM bundle, imported from the worker |
| txiki.js | ✅ | one ESM bundle, run with `tjs run` |
| ClearScript | ✅ | TypeScript graph transpiled to .js, then loaded by the host |
| browsers | ✅ | one ESM bundle, no syntax rewrite |
| JerryScript | ✅ | IIFE, ES2020 pass, then console mapped to print |

Load instructions: [runtime documentation](../../../docs/README.md).

## Usage

```typescript
import { join, parse, splat, split } from "@neotales/args";

console.log(split("echo hello world --test")); // ["echo", "hello", "world", "--test"]

console.log(join(["echo", "hello", "world"])); // "echo hello world"
console.log(join(["echo", "hello world"])); // 'echo "hello world"'

const args = splat({
  foo: "bar",
  splat: {
    command: ["git", "clone"],
  } as SplatOptions,
});

console.log(args); // ["git", "clone", "--foo", "bar"]

console.log(parse(["--name", "neo", "--count=2", "-v", "input.txt"], { boolean: ["v"] }));
// { _: ["input.txt"], name: "neo", count: 2, v: true }
```

## Functions

- `split` - splits a string into an array of arguments.
- `join` - joins an array of arguments into a string.
- `splat` - converts an object with args into an array of arguments.
- `parse` - parses arguments into an object with positional values in `_`.

## Parsing

`parse` supports long and short options, repeated values, aliases, defaults,
boolean flags, and preserving values after `--`.

```ts
import { parse } from "@neotales/args/parse";

parse(["-n", "neo"], { alias: { name: "n" }, default: { color: "blue" } });
// { _: [], name: "neo", n: "neo", color: "blue" }

parse(["--id", "001", "--", "--not-parsed"], { string: ["id"], "--": true });
// { _: [], id: "001", "--": ["--not-parsed"] }
```

## License

[MIT License](./LICENSE.md)
