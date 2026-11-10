# js-lib

JavaScript libraries for Neotales.

This tree is the root of [neotales/js-lib](https://github.com/neotales/js-lib).
In the plab monorepo it is the `js/lib` directory, and that prefix is removed
when the directory is published. A path here is the same path there.

## Tasks

Bun names the tasks. `bun test` is Bun's own runner and does not load these files.

```sh
bun run test
bun run test:deno
bun run test:node
bun run test:ende
bun run test:workerd
bun run test:quickjs
bun run test:txiki
```

A lane that cannot run prints `not run` and exits non-zero. That is not a pass.
