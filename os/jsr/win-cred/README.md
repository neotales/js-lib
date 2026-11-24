# @neotales/win-cred

Windows Credential Manager secret storage.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/win-cred)](https://jsr.io/@neotales/win-cred)
[![npm version](https://badge.fury.io/js/@neotales%2Fwin-cred.svg)](https://badge.fury.io/js/@neotales%2Fwin-cred)
[![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-lib.svg)](https://badge.fury.io/gh/neotales%2Fjs-lib)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/win-cred/doc).

[Module list](https://github.com/neotales/js-lib).

## Installation

```sh
deno add jsr:@neotales/win-cred
npx jsr add @neotales/win-cred
npm install @neotales/win-cred
```

### Runtime support

The module README table is the support claim. The module can be imported on another
platform, but `isAvailable()` is `false` and every root operation throws the
documented unavailable error. That is a fail-closed failure, not support.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source; Windows only, requires `--allow-ffi` |
| Node.js | ✅ | published npm ESM twin (Node >= 26, Windows only, needs `node:ffi`) |
| Bun | ✅ | source; Windows only |
| Ende | ❌ | source; no Credential Manager FFI backend |
| QuickJS-ng | ❌ | one ESM bundle; no Credential Manager FFI backend |
| workerd | ❌ | one ESM bundle; no Credential Manager FFI backend |
| txiki.js | ✅ | one ESM bundle, run with `tjs run`; Windows only, uses `tjs:ffi` |
| ClearScript | ❌ | TypeScript graph; no Credential Manager FFI backend |
| browsers | ❌ | one ESM bundle; no Credential Manager FFI backend |
| JerryScript | ❌ | no native FFI; the test build specializes the real `ffi.ts` by removing its top-level-await backend region, and the default backend throws unavailable |

Load instructions: [runtime documentation](../../../docs/README.md).

## Secret Store API

The package root stores opaque secrets by service and account. `getSecret()` returns bytes and `getSecretString()` decodes UTF-8.

```ts
import {
  getSecret,
  getSecretString,
  isAvailable,
  listSecrets,
  removeSecret,
  saveSecret,
} from "jsr:@neotales/win-cred";

if (!isAvailable())
  throw new Error("Credential Manager FFI is unavailable");

saveSecret("myapp", "token", "secret");
saveSecret("myapp", "key", new Uint8Array([0, 255, 1]));

console.log(getSecretString("myapp", "token"));
console.log(getSecret("myapp", "key"));
console.log(listSecrets("myapp").map(({ account }) => account));

removeSecret("myapp", "token");
removeSecret("myapp", "key");
```

Services and accounts must be non-empty. The root API encodes them into an internal Credential Manager target name, so it lists only records created through this API.

## Native API

`@neotales/win-cred/ffi` exposes raw Credential Manager operations for callers that need native target names, credential types, persistence scopes, or raw credential blobs. Unlike the root API, `WinCred` does not namespace targets. It is safe to import on unsupported runtimes; call `isWinCredAvailable()` before invoking it.

```ts
import {
  CredEnumerateFlags,
  CredPersist,
  CredType,
  CredWriteFlags,
  isWinCredAvailable,
  WinCred,
} from "jsr:@neotales/win-cred/ffi";

if (!isWinCredAvailable())
  throw new Error("Credential Manager FFI is unavailable");

const targetName = "myapp/native-token";
const credentialBlob = new TextEncoder().encode("secret");

WinCred.write({
  flags: 0,
  type: CredType.GENERIC,
  targetName,
  comment: "Native Credential Manager example",
  lastWritten: 0n,
  credentialBlobSize: credentialBlob.length,
  credentialBlob,
  persist: CredPersist.LOCAL_MACHINE,
  attributeCount: 0,
  targetAlias: "",
  userName: "token",
}, CredWriteFlags.NONE);

const credential = WinCred.read(targetName, CredType.GENERIC);
console.log(credential?.userName);
console.log(new TextDecoder().decode(credential?.credentialBlob));

const credentials = WinCred.enumerate("myapp/*", CredEnumerateFlags.NONE);
console.log(credentials.map(({ targetName }) => targetName));

WinCred.delete(targetName, CredType.GENERIC);
```

`WinCred.write`, `WinCred.read`, `WinCred.delete`, and `WinCred.enumerate` throw when the OS or runtime FFI backend is unavailable. `read`, `delete`, and `enumerate` report `null`/`false`/`[]` only for `ERROR_NOT_FOUND` (1168); access denied, missing logon session, and every other Win32 error throw with the code.

## Runtime Support

Deno requires `--allow-ffi`. Without it, `isAvailable()` returns `false` and Windows secret operations explain the missing permission.

Node.js requires Node 26 or later with `--experimental-ffi`.

Bun uses `bun:ffi` and loads `advapi32.dll`.

txiki.js uses `tjs:ffi`. The public `@neotales/win-cred/ffi-txiki` entry point opens
`advapi32.dll` and `kernel32.dll` eagerly, exposes `open`, `isOpened`, and
`close`, and the binding table is covered by mock tests on every lane. Native
calls require a Windows host; the Windows CI leg runs a read-only missing-target
check that never lists or reads an existing credential.

Credential writes require an interactive Windows logon session. OpenSSH sessions can fail with Win32 error `1312` (`ERROR_NO_SUCH_LOGON_SESSION`); validate writes from an interactive RDP or console session. The test suite never writes a credential unless a caller opts in; the imported scenarios exercise the throwing unsupported path, the pure bindings, and the read-only missing-target check.

## License

[MIT License](./LICENSE.md)
