# QuickJS-ng

QuickJS-ng should load `chars` and `slices`; see their [module README tables](../std/jsr/chars/README.md) and [slices](../std/jsr/slices/README.md).

There is no registry install here. Produce one ESM bundle from the TypeScript graph, then run the resulting file with `qjs` or `qjs-linux-x86_64`.

```sh
bun build ../std/jsr/chars/mod.ts --target=browser --format=esm --outfile=chars.mjs
qjs chars.mjs
```
