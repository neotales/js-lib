# Bun

Bun should load [chars](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [env](../std/jsr/env/README.md), [dotenv](../std/jsr/dotenv/README.md), and [path](../std/jsr/path/README.md), plus [is-elevated](../os/jsr/is-elevated/README.md), [win-registry](../os/jsr/win-registry/README.md), [win-cred](../os/jsr/win-cred/README.md), [darwin-keychain](../os/jsr/darwin-keychain/README.md), and [linux-libsecret](../os/jsr/linux-libsecret/README.md); see the module README tables. Bun runs the TypeScript source; the OS modules select `bun:ffi` only on their own platform.

Install the npm twin with `bun add @neotales/chars`, or run TypeScript source. Bun does not read the Deno workspace.

```sh
bun add @neotales/chars
```

```ts
import { isSpace } from "@neotales/chars";
console.log(isSpace(32));
```
