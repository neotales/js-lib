# @neotales/darwin-keychain

## Overview

`@neotales/darwin-keychain` provides simple macOS keychain access for generic passwords backed by `Security.framework` FFI.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/darwin-keychain)](https://jsr.io/@neotales/darwin-keychain)
[![npm version](https://badge.fury.io/js/@neotales%2Fdarwin-keychain.svg)](https://badge.fury.io/js/@neotales%2Fdarwin-keychain)
[![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-lib.svg)](https://badge.fury.io/gh/neotales%2Fjs-lib)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/darwin-keychain/doc).

A list of other modules can be found at [github.com/neotales/js-lib](https://github.com/neotales/js-lib).

## Installation

```sh
deno add jsr:@neotales/darwin-keychain
npx jsr add @neotales/darwin-keychain
npm install @neotales/darwin-keychain
```

## Usage

```typescript
import {
  getSecret,
  getSecretString,
  isAvailable,
  listSecrets,
  removeSecret,
  saveSecret,
} from "@neotales/darwin-keychain";

if (!isAvailable())
  throw new Error("Keychain FFI is unavailable");

saveSecret("my-service", "token", "my-secret");
saveSecret("my-service", "bytes", new Uint8Array([0, 255, 1]));

console.log(getSecretString("my-service", "token"));
console.log(getSecret("my-service", "bytes"));
console.log(listSecrets("my-service").map(({ account }) => account));

removeSecret("my-service", "token");
removeSecret("my-service", "bytes");
```

Services and accounts must be non-empty. The root API stores generic-password entries in the default macOS keychain and returns opaque bytes from `getSecret()` and `listSecrets()`.

## Native API

```typescript
import { isDarwinKeychainAvailable, Keychain } from "@neotales/darwin-keychain/ffi";

if (!isDarwinKeychainAvailable())
  throw new Error("Keychain FFI is unavailable");

const item = Keychain.SecKeychainAddGenericPassword(
  "my-service",
  "native-token",
  new TextEncoder().encode("secret"),
);
try {
  Keychain.SecKeychainItemModifyAttributesAndData(item, new TextEncoder().encode("updated"));
  const found = Keychain.SecKeychainFindGenericPassword("my-service", "native-token");
  console.log(found?.secret);
  if (found)
    Keychain.CFRelease(found.item);
  Keychain.SecKeychainItemDelete(item);
} finally {
  Keychain.CFRelease(item);
}
```

`Keychain` also exposes `SecKeychainSearchCreateFromAttributes`, `SecKeychainSearchCopyNext`, and `SecKeychainItemCopyAttributesAndData` for native enumeration. Returned `KeychainHandle` instances are runtime-specific opaque references; release every item and search handle with `Keychain.CFRelease()`.

## Exports

| Export                                                                                     | Subpath                         | Description                                         |
| ------------------------------------------------------------------------------------------ | ------------------------------- | --------------------------------------------------- |
| `getSecret`, `getSecretString`, `saveSecret`, `removeSecret`, `listSecrets`, `isAvailable` | `@neotales/darwin-keychain`     | Uniform secret-store facade.                        |
| `DarwinKeychain`, `Keychain`, `isDarwinKeychainAvailable`, `KeychainHandle`                | `@neotales/darwin-keychain/ffi` | Native generic-password and Security.framework API. |
| `SecretRecord`                                                                             | `@neotales/darwin-keychain`     | Keychain list record type.                          |

## Runtime support

The module README table is the support claim. The module can be imported on another
platform, but `isAvailable()` is `false` and every root operation throws the
documented unavailable error. That is a fail-closed failure, not support.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source; macOS only, requires `--allow-ffi` |
| Node.js | ✅ | published npm ESM twin (Node >= 26, macOS only, needs `node:ffi`) |
| Bun | ✅ | source; macOS only |
| Ende | ❌ | source; no Security.framework FFI backend |
| QuickJS-ng | ❌ | one ESM bundle; no Security.framework FFI backend |
| workerd | ❌ | one ESM bundle; no Security.framework FFI backend |
| txiki.js | ✅ | one ESM bundle, run with `tjs run`; macOS only, uses `tjs:ffi` |
| ClearScript | ❌ | TypeScript graph; no Security.framework FFI backend |
| browsers | ❌ | one ESM bundle; no Security.framework FFI backend |
| JerryScript | ❌ | no native FFI; the test build specializes the real `ffi.ts` by removing its top-level-await backend region, and the default backend throws unavailable |

The `@neotales/darwin-keychain/ffi-txiki` entry point opens Security.framework and
CoreFoundation eagerly and exposes `open`, `isOpened`, and `close`. Its binding
table is covered by mock tests on every lane, including search/attribute error
propagation and typed-array owner retention through the native search call. Native keychain calls require a
macOS host; the imported scenarios never read or write a real keychain item.

## License

[MIT License](./LICENSE.md)
