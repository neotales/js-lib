# @neotales/is-elevated

## Overview

`@neotales/is-elevated` detects whether the current process is running with elevated privileges.
On Unix-like systems this typically means root. On Windows it checks whether the current token is elevated.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/is-elevated)](https://jsr.io/@neotales/is-elevated)
[![npm version](https://badge.fury.io/js/@neotales%2Fis-elevated.svg)](https://badge.fury.io/js/@neotales%2Fis-elevated)
[![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-lib.svg)](https://badge.fury.io/gh/neotales%2Fjs-lib)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/is-elevated/doc).

[Module list](https://github.com/neotales/js-lib)..

## Installation

```sh
deno add jsr:@neotales/is-elevated
npx jsr add @neotales/is-elevated
npm install @neotales/is-elevated
```

### Runtime support

The module README table is the support claim. A browser can still load `is-elevated`. That is not support: `isElevatedAvailable()` is false there, and `isElevated()` throws.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source; requires --allow-sys and --allow-ffi |
| Node.js | ✅ | published npm ESM twin (node >= 22) |
| Bun | ✅ | source; Bun rewrites @neotales/ imports to relative paths |
| Ende | ✅ | source; requires --allow-sys |
| QuickJS-ng | ❌ | one ESM bundle |
| workerd | ✅ | one ESM bundle, imported from the worker |
| txiki.js | ✅ | one ESM bundle, run with `tjs run`; Windows backend is `tjs:ffi` |
| ClearScript | ❌ | TypeScript graph transpiled to .js, then loaded by the host |
| browsers | ❌ | one ESM bundle, no syntax rewrite; leaves ffi_*.ts out; node:module and bun:ffi are not loaded |
| JerryScript | ❌ | no bundle; FFI files import host modules the IIFE cannot include |

Load instructions: [runtime documentation](../../../docs/README.md).

## Usage

```typescript
import { isElevated } from "@neotales/is-elevated";

if (!isElevated()) {
  throw new Error("Run this as admin/root");
}
```

## Exports

| Export                | Subpath                 | Description                                                  |
| --------------------- | ----------------------- | ------------------------------------------------------------ |
| `isElevated`          | `@neotales/is-elevated` | Detects whether the current process is elevated.             |
| `isElevatedAvailable` | `@neotales/is-elevated` | Reports whether elevation detection can run in this runtime. |

```typescript
import { isElevated } from "@neotales/is-elevated";

const elevated = isElevated();

if (elevated) {
  console.log("ready for privileged work");
}
```

## Elevation Detection

On Unix-like systems, elevation means an effective user ID of `0`. The module uses an effective ID when the runtime exposes one and otherwise falls back to `Deno.uid()`. This keeps the result tied to the identity under which the process is actually executing.

On Windows, the module opens the current process token and calls `GetTokenInformation` with `TokenElevation`. The returned `TokenIsElevated` value describes the current process token, which is the relevant answer for an operation that needs administrator privileges.

This intentionally does not use `Shell32.IsUserAnAdmin`. That API is a convenience membership check and can disagree with the current token under User Account Control: an administrator account may be running with a filtered, non-elevated token. Token elevation inspection reports the process state directly.

## Node.js FFI

On Windows, Node uses `node:ffi` when the module loads. It was added in 26.1.0, is still experimental, and requires `--experimental-ffi`. If it does not load, the same call goes through koffi. The generated npm package declares koffi `^2.9.0` as an optional dependency. When neither is available, `isElevatedAvailable()` returns `false` and `isElevated()` throws.

## License

[MIT License](./LICENSE.md)
