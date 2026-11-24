# QuickJS-ng

QuickJS-ng should load [chars](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [env](../std/jsr/env/README.md), [dotenv](../std/jsr/dotenv/README.md), and [path](../std/jsr/path/README.md); see their module README tables. `path` skips its URL scenarios because the engine has no `URL`. No OS module has a QuickJS-ng FFI backend.

There is no registry install here. Produce one ESM bundle from the TypeScript graph, then run the resulting file with `qjs` or `qjs-linux-x86_64`.

```sh
bun build ../std/jsr/chars/mod.ts --target=browser --format=esm --outfile=chars.mjs
qjs chars.mjs
```
