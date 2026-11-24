# @neotales/js-lib

Small, dependency-light JavaScript libraries for Neotales. One package per
folder, one test harness, many runtimes.

This directory is the repo root of
[neotales/js-lib](https://github.com/neotales/js-lib). In the plab monorepo it
is `js/lib`; that prefix disappears when the prefix is published. A path here
is the same path there.

![Short terminal animation showing `bun run test -- std/chars` pass a unicode folding test and finish with all selected suites passed](docs/assets/test-lanes.gif)

## Quick start

```sh
pnpm install            # browser lanes only; everything else is built in
bun run test            # Bun gate, every imported module
bun run test -- std/strings
bun run test:node -- std/strings
bun run transpile       # regenerate the generated npm twins
```

`bun test` is Bun's own runner and does not load these files. The tasks below
are the interface. A lane that cannot run prints `not run` and exits non-zero;
that is not a green check in a trench coat.

## What is imported, and what is shipped

These are two different questions, and the catalog keeps them apart.

- **Imported** means the source, tests, README, and generated npm twin are in
  this tree at `0.1.0-alpha.0`.
- **Published** means a version exists on npm or JSR. Every imported package is
  published at `0.0.0`. The alpha in this tree is not published by this branch.
- **Planned** means the module is in the import plan but is not here yet.

The registry column is a fact about the public registry, not a claim that the
alpha in this tree has shipped. Update that column only after checking the
registry, not after a green local run.

### Module catalog

| Module | Area | Status | Registry | Runtime claim | Notes |
| --- | --- | --- | --- | --- | --- |
| `@neotales/chars` | std | Imported | `0.0.0` · npm + JSR | All lanes; JerryScript skips four full Unicode sweeps | Unicode 15.0.0 tables generated from Go 1.24.0 |
| `@neotales/slices` | std | Imported | `0.0.0` · npm + JSR | All lanes | Private fields; the JerryScript ES2020 pass rewrites them |
| `@neotales/strings` | std | Imported | `0.0.0` · npm + JSR | All; `split(Uint8Array)` is skipped where `TextDecoder` is absent | QuickJS-ng, ClearScript, and JerryScript run the suite with that one skip |
| `@neotales/args` | std | Imported | `0.0.0` · npm + JSR | All lanes | Pure argument parsing |
| `@neotales/env` | std | Imported | `0.0.0` · npm + JSR | All lanes; command substitution needs a runtime command API | In-memory store where the host exposes no environment; async expansion runs on the Bun async lane |
| `@neotales/dotenv` | std | Imported | `0.0.0` · npm + JSR | All lanes | Pure parse, stringify, and expansion; no filesystem dependency |
| `@neotales/path` | std | Imported | `0.0.0` · npm + JSR | All lanes; URL forms need a `URL` global | Deno `@std/path` repackage; Jerry lacks `URL` and lookbehind |
| `@neotales/process` | std | Imported | `0.0.0` · npm + JSR | Deno, Node, Bun, Ende; reduced metadata/console streams in browsers, workers, QuickJS-ng, txiki.js, JerryScript, and ClearScript | Host process APIs are used only when present; unsupported `cwd`/`chdir` throw except browser `chdir` is a no-op |
| `@neotales/is-elevated` | os | Imported | `0.0.0` · npm + JSR | Deno, Node, Bun, Ende, workerd, and txiki.js where the host exposes the needed FFI/uid | Browsers, QuickJS-ng, ClearScript, and JerryScript can load it but do not support elevation |
| `@neotales/win-registry` | os | Imported | `0.0.0` · npm + JSR | Deno, Node, Bun, and txiki.js on Windows | Windows native calls are unverified on this Linux host; the tjs binding table has mock tests |
| `@neotales/win-cred` | os | Imported | `0.0.0` · npm + JSR | Deno, Node, Bun, and txiki.js on Windows | Unsupported platforms throw; Windows native calls are unverified on this Linux host; CI reads only a missing target |
| `@neotales/darwin-keychain` | os | Imported | `0.0.0` · npm + JSR | Deno, Node, Bun, and txiki.js on macOS | Unsupported platforms throw; native keychain calls are unverified on this Linux host; mocks cover error propagation and owner lifetime |
| `@neotales/linux-libsecret` | os | Imported | `0.0.0` · npm + JSR | Deno, Node, Bun, and txiki.js on Linux | Unsupported platforms and unverified/32-bit/big-endian ABIs fail closed; enumeration on all four backends; UTF-8 text only, NUL/invalid UTF-8 rejected; CI builds pinned txiki.js 26.11.0 |

Planned std modules: `results`, `fmt`,
`ansi`, `fs`, `exec`, `secrets`.

Not in the current import: `age`, `config`, `crypto`, `keepass`, `x509`.

When a module lands, add its row in the same change. When a release is
verified, update that row's registry column in the release change, not before.

## Testing and lanes

Run one module with a workspace label:

```sh
bun run test -- std/chars
bun run test:deno -- os/win-registry
```

| Lane | Command | What runs |
| --- | --- | --- |
| Bun | `bun run test` | TypeScript source with workspace imports rewritten |
| Async | `bun run test:async` | Promise-based scenarios, including env protocol resolution and rejection |
| Node.js | `bun run test:node` | Bun bundle that keeps Node builtins |
| Deno | `bun run test:deno` | TypeScript source and the Deno workspace |
| Ende | `bun run test:ende` | TypeScript source and the synced `ende.json` |
| QuickJS-ng | `bun run test:quickjs` | One ESM bundle under `qjs` |
| workerd | `bun run test:workerd` | One ESM bundle imported from a worker |
| txiki.js | `bun run test:txiki` | One ESM bundle under `tjs` |
| ClearScript | `bun run test:clearscript` | TypeScript graph transpiled to `.js`, loaded by the V8 host |
| JerryScript | `bun run test:jerry` | IIFE, ES2020 pass, then `console` mapped to `print` |
| Chromium | `bun run test:chromium` | ESM bundle in a headless Chromium |
| Firefox | `bun run test:firefox` | ESM bundle through pinned Playwright |
| WebKit | `bun run test:webkit` | ESM bundle through pinned Playwright; host libraries must be installed |

Bun, Node, and Deno run on every branch. Ende, QuickJS-ng, workerd, and
ClearScript are Ubuntu steps. txiki.js runs on macOS and Windows. Firefox and
WebKit are separate ephemeral Ubuntu jobs. The workflows under
[.github/workflows](.github/workflows/) are the source of truth; see
[docs/](docs/README.md) for load instructions and each module README for its
support table.

Lanes share `.build`. Run them sequentially on one machine, or give each lane
its own root.

## Usage

```ts
import { isSpace, equalFold } from "@neotales/chars";
import { parse } from "@neotales/args";
import { camelize } from "@neotales/strings";

console.log(isSpace(32)); // true
console.log(equalFold(0x41, 0x61)); // true
console.log(camelize("hello_world")); // "helloWorld"

const args = parse(["--name", "neo", "input.txt"]);
console.log(args.name); // "neo"
```

Inside this tree, tests and modules import siblings as `@neotales/<name>` or
`@neotales/<name>/<export>`. Deno and Ende resolve that name from the workspace.
Every other lane rewrites it to a relative path before it runs. Published
packages import the same names from npm or JSR.

## Layout

```text
std/jsr/<package>/      source that is edited
std/npm/<package>/      generated npm twin; never hand-edit
os/jsr/<package>/       source that is edited
os/npm/<package>/       generated npm twin; never hand-edit
std/jsr/assert/         the assertion module, publish: false
std/jsr/test/           the test runner, publish: false
eng/                    tasks, transpile, publish, and the release checks
docs/                   runtime load notes
.github/workflows/      CI and CD
```

`std/` and `os/` are separate pnpm workspaces because their dependency sets
differ. `os/deno.json` is a nested Deno workspace with `nodeModulesDir: auto`;
`os/ende.json` is its synced copy.

## Working on a module

1. Read [AGENTS.md](AGENTS.md).
2. Keep the JSR source in `std/jsr` or `os/jsr`. That is the file you edit.
3. Tests import `@neotales/test` and `@neotales/assert`. Do not add a second
   test framework, `node:test`, or a browserified `assert`.
4. Run `bun run sync:ende` after changing a `deno.json`. Do not edit
   `ende.json` by hand.
5. Add the module to `eng/scripts/transpile.ts`, run `bun run transpile`, and
   commit the generated npm twin.
6. Run the Bun gate, then the lanes that are relevant to the module. Record
   exact counts and every skip.
7. Do not add a module to a lane selector before the lane can run it. A skip is
   a printed skip; a missing binary is `not run`, not a pass.

The npm twins are generated by dnt from the JSR source. Tests, the harness,
and `ende.json` are excluded from packages. `eng/scripts/check-publish.mjs`
fails if a dry run or `npm pack` would ship one.

## Publishing

Publishing is a release-tag action, not a side effect of a local build. The
release coordinator selects the areas that changed, preflights every package,
and publishes npm and JSR with GitHub Actions OIDC. Read
[docs/publishing.md](docs/publishing.md) before touching a release. No token is
read or stored in this tree.

## For coding agents

- Start with [AGENTS.md](AGENTS.md) and the module README.
- `std/npm` and `os/npm` are generated. Fix the source, then transpile.
- `ende.json` is generated. Fix `deno.json`, then `bun run sync:ende`.
- A workspace label is the selector: `bun run test -- os/is-elevated`.
- If the same lane fails twice, report the command, the output, and what was
  ruled out instead of adding another retry.
- Never log a credential, token, or path outside this project. There are no
  secrets in this tree.

## License

MIT. See [LICENSE.md](LICENSE.md). Individual modules may carry additional
notices in their own `LICENSE.md`; `strings` includes the MIT notice for the
inflection tables.
