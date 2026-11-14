# Bun

Bun should load `chars`, `slices`, and `is-elevated`; see the [module README tables](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), and [is-elevated](../os/jsr/is-elevated/README.md).

Install the npm twin with `bun add @neotales/chars`, or run TypeScript source. Bun does not read the Deno workspace.

```sh
bun add @neotales/chars
```

```ts
import { isSpace } from "@neotales/chars";
console.log(isSpace(32));
```
