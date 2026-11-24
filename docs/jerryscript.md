# JerryScript

JerryScript should load [chars](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [env](../std/jsr/env/README.md), [dotenv](../std/jsr/dotenv/README.md), and [path](../std/jsr/path/README.md); see their module README tables. `path` skips URL scenarios. `joinGlobs(..., { globstar: true })` has no globstar matching of its own; it joins and delegates to `normalizeGlob`, whose globstar guard uses a lookbehind. Jerry rejects lookbehind, so both `normalizeGlob(..., { globstar: true })` and `joinGlobs(..., { globstar: true })` are skipped, as is the million-character `isGlob` pattern for size. No OS module has a JerryScript FFI backend; the Jerry build specializes each real facade by removing its top-level-await backend region, so the default throwing backend reports unavailable.

JerryScript 3.0.0 uses the `es.next` profile and has no release binary. The pinned binary is `~/.cache/neotales/jerryscript-v3.0.0/build/bin/jerry`. Build an IIFE, pass it through esbuild `--target=es2020`, then prepend a `console` object whose methods map to `print`.

```sh
bun build ../std/jsr/chars/mod.ts --target=browser --format=iife --outfile=chars.iife.js
esbuild chars.iife.js --bundle --format=iife --target=es2020 --outfile=chars.es2020.js
printf '%s\n' 'var console = { log: print, error: print, warn: print, info: print };' > chars.jerry.js
cat chars.es2020.js >> chars.jerry.js
~/.cache/neotales/jerryscript-v3.0.0/build/bin/jerry chars.jerry.js
```

The ES2020 pass rewrites the `slices` private fields.
