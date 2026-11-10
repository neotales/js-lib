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
bun run test:clearscript
```

A lane that cannot run prints `not run` and exits non-zero. That is not a pass.

CI runs Bun, Node, and Deno on every branch, on Ubuntu, macOS, and Windows. Ende, QuickJS-ng, workerd, and ClearScript run on Ubuntu. txiki.js runs on macOS and Windows, where its releases exist. Those extra lanes run on `dev`, `plab-js-lib`, tags, and pull requests. Publishing is a separate workflow, and the action pin check is a third one.

Tests are not published. A JSR package excludes them, and an npm pack that still contains one is refused. A test may import another module in this tree by its `@neotales/` name. Deno and Ende resolve that name from the workspace. The other lanes rewrite it to a relative path. That link is not part of the published package.
