# txiki.js

txiki.js should load `chars`, `slices`, and `is-elevated`; see the [module README tables](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), and [is-elevated](../os/jsr/is-elevated/README.md).

There is no registry install here. Bundle as ESM and run it with `tjs run`. There is no Linux binary; support is still claimed, and binaries are available for macOS and Windows. The `is-elevated` Windows backend is `tjs:ffi`.

```sh
bun build ../std/jsr/chars/mod.ts --target=browser --format=esm --outfile=chars.mjs
tjs run chars.mjs
```
