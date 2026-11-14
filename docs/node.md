# Node.js

Node.js should load `chars`, `slices`, and `is-elevated`; see the [module README tables](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), and [is-elevated](../os/jsr/is-elevated/README.md).

Node loads the published npm ESM twin and requires `node >= 22`.

```sh
npm install @neotales/chars
```

```js
import { isSpace } from "@neotales/chars";
console.log(isSpace(32));
```

`is-elevated` uses experimental `node:ffi` (Node 26.1.0) when available and koffi `^2.9.0` as the optional fallback.
