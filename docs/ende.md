# Ende

Ende should load `chars`, `slices`, and `is-elevated`; see the [module README tables](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), and [is-elevated](../os/jsr/is-elevated/README.md).

Ende uses the same JSR import as Deno, runs TypeScript source, and resolves names from the workspace. `bun run sync:ende` copies `deno.json` onto `ende.json`; do not edit `ende.json`.

```ts
import { isSpace } from "@neotales/chars";
console.log(isSpace(32));
```

`is-elevated` requires `--allow-sys`.
