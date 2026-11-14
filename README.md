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
bun run test:chromium
bun run test:firefox
bun run test:webkit
bun run test -- std/chars
bun run test:ende -- std/chars
bun run sync:ende
```

A lane that cannot run prints `not run` and exits non-zero. That is not a pass.

`test:firefox` and `test:webkit` drive the browser builds of the pinned Playwright. Install them with `pnpm install` and `pnpm exec playwright install firefox webkit`; see [browsers](docs/browsers.md).

Tests import `@neotales/test` and `@neotales/assert`. Those modules are not published. Suites are generated under `.build/test/` from workspace manifests and each module's `*.test.ts` files. Run all modules with `bun run test`, or select a module with `bun run test -- std/chars` (the same selector works with `test:<lane>`). Each module runs in isolation; failures are aggregated after all selected suites finish. Unknown modules and modules without tests fail explicitly.

CI runs Bun, Node, and Deno on every branch, on Ubuntu, macOS, and Windows. Ende, QuickJS-ng, workerd, and ClearScript are steps on the Ubuntu leg. txiki.js is a step on the macOS and Windows legs. Firefox and WebKit are separate ephemeral Ubuntu jobs that install the pinned Playwright browsers before they run. Those runtime steps run on `dev`, `plab-js-lib`, and a branch named `rt-<runtime>`, such as `rt-ende`, `rt-firefox`, or `rt-txiki`. A release tag runs the Bun, Node, and Deno tests and the Ende, QuickJS-ng, workerd, ClearScript, and txiki.js steps in `js-cd.yml`; the Firefox and WebKit lanes run only in the branch workflows. The non-browser runtime steps in one job run together. Publishing is a separate workflow, and the action pin check is a third one.

A release tag publishes the area named by the tag. `std/v*` and `js/v*` publish `std`; `os/v*` publishes `os`. npm uses `pnpm publish` and JSR uses `deno publish`. Both authenticate with GitHub Actions OIDC and neither reads a token. Package versions come from the manifests, not the tag. `eng/scripts/publish.mjs` preflights all packages before the first upload, skips an existing npm version only on an exact tarball match, and fails on an existing JSR version. A ref guard verifies the checked-out HEAD is the triggering tag commit. Registry-side setup, recovery limits, bootstrap restrictions, and failure modes are in [docs/publishing.md](docs/publishing.md).

A module README is copied from [eng/templates/README.md](eng/templates/README.md). The checklist is [eng/templates/README.checklist.md](eng/templates/README.checklist.md). The runtime table uses ✅ and ❌. A lane may generate code from the TypeScript before the binary sees it. The module README names that rewrite. Deno and Ende run the source. JerryScript gets an IIFE, an ES2020 pass, and `console` mapped to `print`. A module with private fields says so. Browsers get an ESM bundle. `is-elevated` leaves its FFI files out of that bundle.

Tests are not published. A JSR package excludes them, and an npm pack that still contains one is refused. A test may import another module in this tree by its `@neotales/` name. Deno and Ende resolve that name from the workspace. The other lanes rewrite it to a relative path. That link is not part of the published package. `sync:ende` copies `deno.json` onto `ende.json`. Edit the Deno file, then run the task.

The module README runtime table is under Installation and is the support claim, not a test log. Load instructions for [Deno, Node.js, Bun, Ende, QuickJS-ng, workerd, txiki.js, ClearScript, browsers, and JerryScript](docs/README.md).
