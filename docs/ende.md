# Ende

Ende should load [chars](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [env](../std/jsr/env/README.md), [dotenv](../std/jsr/dotenv/README.md), and [path](../std/jsr/path/README.md), plus [is-elevated](../os/jsr/is-elevated/README.md). The registry and credential modules have no Ende FFI backend and report themselves unavailable.

Ende uses the same JSR import as Deno, runs TypeScript source, and resolves names from the workspace. `bun run sync:ende` copies `deno.json` onto `ende.json`; do not edit `ende.json`.

```ts
import { isSpace } from "@neotales/chars";
console.log(isSpace(32));
```

`is-elevated` requires `--allow-sys`.
