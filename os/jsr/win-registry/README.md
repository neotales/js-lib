# @neotales/win-registry

## Overview

`@neotales/win-registry` is a Windows Registry API backed by runtime-specific
FFI: Deno FFI, Bun FFI, and Node.js `node:ffi`. It opens, creates, reads,
writes, enumerates, and deletes registry keys and values.

It is a Windows module. It does not provide a registry on Linux or macOS, and
it has no browser, QuickJS-ng, workerd, Ende, or ClearScript backend.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/win-registry)](https://jsr.io/@neotales/win-registry)
[![npm version](https://badge.fury.io/js/@neotales%2Fwin-registry.svg)](https://badge.fury.io/js/@neotales%2Fwin-registry)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/win-registry/doc).

[Module list](https://github.com/neotales/js-lib).

## Installation

```sh
deno add jsr:@neotales/win-registry
npx jsr add @neotales/win-registry
npm install @neotales/win-registry
```

### Runtime support

The module README table is the support claim. The module can be imported on
another platform; `isRegistryAvailable()` returns `false` there and registry
operations throw `RegistryError`. That is a safe failure, not support.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source; Windows only, requires `--allow-ffi` |
| Node.js | ✅ | published npm ESM twin (Node >= 26, Windows only, needs `node:ffi`) |
| Bun | ✅ | source; Windows only |
| Ende | ❌ | source; no registry FFI backend |
| QuickJS-ng | ❌ | one ESM bundle; no registry FFI backend |
| workerd | ❌ | one ESM bundle; no registry FFI backend |
| txiki.js | ✅ | one ESM bundle, run with `tjs run`; Windows only, uses `tjs:ffi` |
| ClearScript | ❌ | TypeScript graph; no registry FFI backend |
| browsers | ❌ | one ESM bundle; no registry FFI backend |
| JerryScript | ❌ | no native FFI; the test build specializes the real `registry.ts` by removing its top-level-await backend region, and the default backend throws unavailable |

Load instructions: [runtime documentation](../../../docs/README.md).

### Windows CI write test

Windows CI runs one disposable-key integration test. It is enabled only by:

- `WIN_REGISTRY_WRITE_TESTS=1`
- `REQUIRE_WIN_REGISTRY_FFI=1`

The test requires a working Windows backend and a real Windows host. It creates
a unique `HKCU\Software\neotales-js-test-registry-<time>-<random>` key only
when the backend reports it was newly created, writes and reads values, then
deletes that key. A pre-existing key is never modified. Local runs without both
variables write nothing.

`WIN_REGISTRY_WRITE_TESTS=1` alone skips and performs no write.
`REQUIRE_WIN_REGISTRY_FFI=1` alone fails closed. Both are required before any
registry mutation.

## Usage

```typescript
import { Registry } from "@neotales/win-registry";

using key = Registry.createKey("HKCU\\Software\\MyApp");

key.setString("Theme", "dark");
key.setInt32("LaunchCount", 3);

console.log(key.getString("Theme"));
```

## Examples

Read a string value:

```typescript
import { Registry } from "@neotales/win-registry";

using key = Registry.openKey(
  "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion",
);

console.log(key.getString("ProductName"));
console.log(key.getString("SystemRoot"));
```

Enumerate subkeys and values:

```typescript
using key = Registry.openKey("HKCU\\Software");

console.log(key.getSubKeyNames());
console.log(key.getValueNames());
console.log(key.stat());
```

Create a key and write string and DWORD values:

```typescript
using key = Registry.createKey("HKCU\\Software\\MyApp");

key.setString("Theme", "dark");
key.setExpandString("Logs", "%USERPROFILE%\\AppData\\Local\\MyApp\\logs");
key.setInt32("LaunchCount", 3);
```

Write multi-string and binary values:

```typescript
using key = Registry.createKey("HKCU\\Software\\MyApp");

key.setMultiString("RecentFiles", ["a.txt", "b.txt"]);
key.setBinary("State", new Uint8Array([1, 2, 3, 4]));
```

Use a predefined root key property directly:

```typescript
import { Registry, Rights } from "@neotales/win-registry";

using myApp = Registry.HKCU.openKey("Software\\MyApp", Rights.ALL_ACCESS);

myApp.setString("Theme", "dark");
console.log(myApp.path); // "HKEY_CURRENT_USER\Software\MyApp"
```

Other roots follow the same pattern: `Registry.HKCR`, `Registry.HKCU`,
`Registry.HKLM`, `Registry.HKU`, `Registry.HKPD`, and `Registry.HKCC`.

## Data types

| Registry type   | Constant          | JavaScript type | Helper                              |
| --------------- | ----------------- | --------------- | ----------------------------------- |
| `REG_SZ`        | `Types.SZ`        | `string`        | `setString` / `getString`           |
| `REG_EXPAND_SZ` | `Types.EXPAND_SZ` | `string`        | `setExpandString` / `getString`     |
| `REG_MULTI_SZ`  | `Types.MULTI_SZ`  | `string[]`      | `setMultiString` / `getMultiString` |
| `REG_BINARY`    | `Types.BINARY`    | `Uint8Array`    | `setBinary` / `getBinary`           |
| `REG_DWORD`     | `Types.DWORD`     | `number`        | `setInt32` / `getInt32`             |
| `REG_QWORD`     | `Types.QWORD`     | `bigint`        | `setInt64` / `getInt64`             |

A DWORD is an unsigned 32-bit integer. A QWORD is an unsigned 64-bit integer;
it maps to `bigint` because it can exceed `Number.MAX_SAFE_INTEGER`.

## Exports

| Export | Subpath | Description |
| --- | --- | --- |
| `Registry`, `RegistryKey`, `RegistryError`, `isRegistryAvailable` | `@neotales/win-registry` | Registry facade, key wrapper, and availability helpers. |
| `Registry`, `RegistryKey`, `RegistryError`, `isRegistryAvailable` | `@neotales/win-registry/registry` | Explicit registry facade subpath. |
| `Rights`, `Types`, `EXECUTE`, root constants, conversion helpers | `@neotales/win-registry/types` | Constants, types, and encoding helpers. |
| `backend`, `open`, `isOpened`, `close` | `@neotales/win-registry/ffi-deno` | Deno FFI backend (`advapi32.dll`). Internal. |
| `backend`, `open`, `isOpened`, `close` | `@neotales/win-registry/ffi-bun` | Bun FFI backend (`bun:ffi`). Internal. |
| `backend`, `open`, `isOpened`, `close` | `@neotales/win-registry/ffi-node` | Node.js FFI backend (`node:ffi`). Internal. |
| `backend`, `open`, `isOpened`, `close` | `@neotales/win-registry/ffi-txiki` | txiki.js FFI backend (`tjs:ffi`). Internal. |

## Backend lifecycle

The backend opens `advapi32.dll` lazily on the first registry operation, so no
explicit setup is required. Each backend also exports an explicit lifecycle:

| Function     | Description |
| ------------ | ----------- |
| `open()`     | Eagerly load the FFI module and open `advapi32.dll`. |
| `isOpened()` | `true` while the backend holds an opened library handle. |
| `close()`    | Unload `advapi32.dll` so a later `open()` starts clean. |

```ts
import { Registry } from "@neotales/win-registry";
import { close, isOpened, open } from "@neotales/win-registry/ffi-deno";

open(); // fail fast if --allow-ffi is missing
console.log(isOpened()); // true

using key = Registry.openKey("HKCU\\Software");
console.log(key.getSubKeyNames());

close();
```

Window FFI flags:

- **Deno**: run with `--allow-ffi`.
- **Node.js**: use Node >= 26 with `node:ffi` enabled.
- **Bun**: `bun:ffi` is built in.
- **txiki.js**: use the Windows build; `tjs:ffi` is built in.

There is no koffi fallback in this source. The generated npm package uses
`node:ffi`; the older published `0.0.0` tarball had a separate `ffi-koffi`
entry, which this import does not carry.

## Resource management

Every key returned by `Registry.openKey()` or `Registry.createKey()` owns a
Windows registry handle. Prefer `using` so the handle closes at the end of its
lexical scope, even when an operation throws. Predefined root keys such as
`Registry.HKCU` do not need closing.

```ts
using key = Registry.openKey("HKCU\\Software");
console.log(key.getValueNames());
```

When `using` is unavailable, close the key in `finally`:

```ts
const key = Registry.openKey("HKCU\\Software");
try {
  console.log(key.getValueNames());
} finally {
  key.close();
}
```

## License

[MIT License](./LICENSE.md)
