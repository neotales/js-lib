# JerryScript

JerryScript should load `chars` and `slices`; see their [module README tables](../std/jsr/chars/README.md) and [slices](../std/jsr/slices/README.md).

JerryScript 3.0.0 uses the `es.next` profile and has no release binary. The pinned binary is `~/.cache/neotales/jerryscript-v3.0.0/build/bin/jerry`. Build an IIFE, pass it through esbuild `--target=es2020`, then prepend a `console` object whose methods map to `print`.

```sh
bun build ../std/jsr/chars/mod.ts --target=browser --format=iife --outfile=chars.iife.js
esbuild chars.iife.js --bundle --format=iife --target=es2020 --outfile=chars.es2020.js
printf '%s\n' 'var console = { log: print, error: print, warn: print, info: print };' > chars.jerry.js
cat chars.es2020.js >> chars.jerry.js
~/.cache/neotales/jerryscript-v3.0.0/build/bin/jerry chars.jerry.js
```

The ES2020 pass rewrites the `slices` private fields. `is-elevated` is not bundled because its FFI files import host modules the IIFE cannot include.
