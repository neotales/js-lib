# @neotales/linux-libsecret

Linux secret storage backed by the freedesktop.org Secret Service through `libsecret`.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/linux-libsecret)](https://jsr.io/@neotales/linux-libsecret)
[![npm version](https://badge.fury.io/js/@neotales%2Flinux-libsecret.svg)](https://badge.fury.io/js/@neotales%2Flinux-libsecret)
[![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-lib.svg)](https://badge.fury.io/gh/neotales%2Fjs-lib)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/linux-libsecret/doc).

[Module list](https://github.com/neotales/js-lib).

## Installation

```sh
deno add jsr:@neotales/linux-libsecret
npx jsr add @neotales/linux-libsecret
```

## Usage

```ts
import { getSecretString, isAvailable, saveSecret } from "@neotales/linux-libsecret";

if (isAvailable()) {
  saveSecret("my-service", "my-account", "my-secret");
  console.log(getSecretString("my-service", "my-account"));
}
```

The root module provides a uniform vault API:

| Export            | Description                                        |
| ----------------- | -------------------------------------------------- |
| `isAvailable`     | Reports whether a native libsecret backend loaded. |
| `getSecret`       | Reads raw secret bytes.                            |
| `getSecretString` | Reads a UTF-8 secret string.                       |
| `saveSecret`      | Creates or updates a secret from text or bytes.    |
| `removeSecret`    | Deletes a secret.                                  |
| `listSecrets`     | Lists service records with copied secret bytes.    |

## Native FFI

```ts
import {
  Gio,
  isGioAvailable,
  isLinuxKeyringAvailable,
  Libsecret,
  LibsecretErrorHandle,
} from "@neotales/linux-libsecret/ffi";

if (isLinuxKeyringAvailable()) {
  const schema = Libsecret.secretSchemaNew(
    "org.freedesktop.Secret.Generic",
    0,
    "service",
    0,
    "account",
    0,
    null,
  );
  if (schema !== null) {
    const errorOut = new LibsecretErrorHandle();
    const password = Libsecret.secretPasswordLookupSync(
      schema,
      null,
      errorOut,
      "service",
      "my-service",
      "account",
      "my-account",
      null,
    );
    if (errorOut.error() !== null) throw errorOut.error();
    if (password !== null) Libsecret.secretPasswordFree(password);
  }
}
```

`Libsecret` exposes camelCase wrappers for libsecret's native functions. `GError**` is represented by a caller-created `LibsecretErrorHandle`, which is bound to the runtime on its first call, reset when reused there, and read with `error()`. Schemas and returned passwords are runtime-bound handles; password text is read with `password.text()` and the handle must be released with `secretPasswordFree`.

GIO cancellation is optional. Check `isGioAvailable()` before calling `Gio.cancellableNew()`, `Gio.cancellableCancel()`, or `Gio.cancellableRelease()`; those methods throw when GIO is unavailable. A `GCancellableHandle` is runtime-bound, can be passed to a synchronous password call, and must be released exactly once.

## Runtime support

The module README table is the support claim. The module can be imported on another
platform, but `isAvailable()` is `false` and every root operation throws the
documented unavailable error. That is a fail-closed failure, not support.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source; Linux only, requires `--allow-ffi` where the runtime asks for it |
| Node.js | ✅ | published npm ESM twin (Node >= 26, Linux only, needs `node:ffi`) |
| Bun | ✅ | source; Linux only |
| Ende | ❌ | source; no libsecret FFI backend |
| QuickJS-ng | ❌ | one ESM bundle; no libsecret FFI backend |
| workerd | ❌ | one ESM bundle; no libsecret FFI backend |
| txiki.js | ✅ | one ESM bundle, run with `tjs run`; Linux only, uses `tjs:ffi`. Verified locally against txiki.js 26.11.0 built from source; no Linux binary is published for CI |
| ClearScript | ❌ | TypeScript graph; no libsecret FFI backend |
| browsers | ❌ | one ESM bundle; no libsecret FFI backend |
| JerryScript | ❌ | no native FFI; the test build specializes the real `ffi.ts` by removing its top-level-await backend region, and the default backend throws unavailable |

The `@neotales/linux-libsecret/ffi-txiki` entry point opens libsecret, GLib,
GObject, and GIO when present, and exposes `open`, `isOpened`, and `close`. Its
binding table is covered by mock tests on every lane. The Linux CI lane builds
the pinned txiki.js 26.11.0 source and runs the suite; a published Linux binary
does not exist, so the workflow clones the tag and its submodules.

- Deno requires `--allow-ffi` where the runtime asks for it, for example: `deno run --allow-ffi app.ts`.
- Node.js requires `--experimental-ffi`, for example: `node --experimental-ffi app.ts`.
- Bun uses its built-in FFI and needs no additional flag.
- The process ABI must be verified as 64-bit little-endian. Every lookup, store, clear, and enumeration reads 8-byte little-endian `GError` and pointer fields. A 32-bit, big-endian, or unknown process fails closed before native loading or before the first operation; it does not guess from the host machine.
- `libsecret-1.so.0`, `libglib-2.0.so.0`, and `libgobject-2.0.so.0` are required for the normal backend. `libgio-2.0.so.0` may be absent unless you explicitly use `GCancellable` operations through `Gio`.
- Install your distribution's libsecret runtime or development package as appropriate; package names vary by distribution. Also run a Secret Service implementation. `libsecret` is the client library, not a Secret Service implementation.

## Secret encoding

Services and accounts must be non-empty and must not contain NUL or unpaired
surrogates. Secrets are UTF-8 text: a `Uint8Array` secret is accepted only when
it is valid UTF-8 with no NUL byte. Embedded NUL, invalid UTF-8, and unpaired
surrogates are rejected before any FFI call, so distinct values cannot collapse
to the same C string. Use a binary vault for arbitrary bytes.

## License

[MIT License](./LICENSE.md)
