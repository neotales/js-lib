# workerd

workerd should load `chars`, `slices`, and `is-elevated`; see the [module README tables](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), and [is-elevated](../os/jsr/is-elevated/README.md).

There is no registry install here. Bundle as ESM, expose it as an `esModule` entry, and import it from the worker.

```js
// worker.mjs
import { isSpace } from "./chars.mjs";
console.log(isSpace(32));
```

```jsonc
// workerd config: modules entry
{ "name": "chars", "esModule": "./chars.mjs" }
```
