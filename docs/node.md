# Node.js

Node.js should load `chars`, `slices`, `strings`, `args`, `is-elevated`, and `win-registry`; see the [module README tables](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [is-elevated](../os/jsr/is-elevated/README.md), and [win-registry](../os/jsr/win-registry/README.md).

Node loads the published npm ESM twin and requires `node >= 22`.

```sh
npm install @neotales/chars
```

```js
import { isSpace } from "@neotales/chars";
console.log(isSpace(32));
```

`is-elevated` uses experimental `node:ffi` (Node 26.1.0) when available and koffi `^2.9.0` as the optional fallback. `win-registry` and `win-cred` are Windows only; `darwin-keychain` is macOS only; `linux-libsecret` is Linux only. All four use `node:ffi` and need Node >= 26 with FFI enabled. The npm twins for the registry and credential modules have no koffi fallback.
