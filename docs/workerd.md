# workerd

workerd should load [chars](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [env](../std/jsr/env/README.md), [dotenv](../std/jsr/dotenv/README.md), and [path](../std/jsr/path/README.md), plus [is-elevated](../os/jsr/is-elevated/README.md). The registry and credential modules have no workerd FFI backend.

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
