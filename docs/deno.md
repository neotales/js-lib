# Deno

Deno should load `chars`, `slices`, and `is-elevated`; see each [module README](../std/jsr/chars/README.md), [slices README](../std/jsr/slices/README.md), and [is-elevated README](../os/jsr/is-elevated/README.md) for its support table.

Install and import `chars` from JSR; Deno runs TypeScript source and resolves workspace imports from `deno.json`.

```sh
deno add jsr:@neotales/chars
```

```ts
import { isSpace } from "@neotales/chars";
console.log(isSpace(32));
```

For `is-elevated`, use `--allow-sys --allow-ffi`.
