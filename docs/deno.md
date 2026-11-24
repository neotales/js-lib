# Deno

Deno should load [chars](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [env](../std/jsr/env/README.md), [dotenv](../std/jsr/dotenv/README.md), and [path](../std/jsr/path/README.md), plus [is-elevated](../os/jsr/is-elevated/README.md), [win-registry](../os/jsr/win-registry/README.md), [win-cred](../os/jsr/win-cred/README.md), [darwin-keychain](../os/jsr/darwin-keychain/README.md), and [linux-libsecret](../os/jsr/linux-libsecret/README.md); see each module README for its support table. The three credential modules are OS-specific and need `--allow-ffi` where the runtime asks for it.

Install and import `chars` from JSR; Deno runs TypeScript source and resolves workspace imports from `deno.json`.

```sh
deno add jsr:@neotales/chars
```

```ts
import { isSpace } from "@neotales/chars";
console.log(isSpace(32));
```

For `is-elevated`, use `--allow-sys --allow-ffi`. For `win-registry` on Windows, use `--allow-ffi`.

Deno 2.9.8 reports `Deno.permissions.querySync({name:"ffi"})` as granted without `--allow-ffi`; grant it explicitly on versions that require it. The denial probe in the test suite is a printed skip on a runtime that grants FFI by default.
