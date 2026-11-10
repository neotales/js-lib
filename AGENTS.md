# js-lib

JavaScript libraries for Neotales. This directory is the root of
[neotales/js-lib](https://github.com/neotales/js-lib). In the plab monorepo it
is `js/lib`, and that prefix is removed when the directory is published. A path
here is the same path there.

Decisions that should outlive this tree go in atlas at `projects/plab/`, not in
this file.

## Layout

This directory is the repository root of the satellite. Folders that configure
that repository belong here. `.agents`, `.vscode`, `.github`, and the like are
exported with the prefix. Do not put them at the plab root. They would not be
published, and they would apply to the monorepo instead.

`.gitkeep` holds an otherwise empty directory in git. Delete it when the
directory gets a real file.

## Branches

`dev` is the integration branch. Do not create `main` or `master`.

## Tests

`bun run test` is the gate. The other lanes are `bun run test:<lane>` and the scripts live in `eng/scripts/`. Each lane has a timeout and must finish in well under a minute. A lane that cannot run exits non-zero. The files under `test/` must not import `node:` or read `process`. Ende has neither. Do not use top-level await in the runner. A test that needs a runtime permission branches on that runtime and is a skip everywhere else.

A test may import a sibling as `@neotales/<name>` or `@neotales/<name>/<export>`. That name is a member of the satellite `deno.json` workspace. It is not an npm `workspace:` link, and a lane must not fetch it from a registry.

Deno and Ende resolve the name from that workspace and run `test/main.ts` as source. `deno.json` stays the file Deno and JSR read. `bun run sync:ende` copies each one onto `ende.json` so Ende does not warn. Do not edit `ende.json`. A package excludes it from publish.

Bun does not read a Deno workspace. Neither do Node, QuickJS-ng, workerd, txiki.js, or ClearScript. The launcher rewrites `@neotales/<name>` to a relative path from the member's `exports` before those lanes see the file. The bundle lanes inline that path. ClearScript gets the rewritten `.js` graph. A specifier that is not a workspace member fails the lane.

`workspace:*` belongs only in a generated npm twin's `package.json`, so Node can link siblings of that twin. pnpm rewrites it on publish. `npm publish` does not. The pack check refuses it. Deno, Ende, QuickJS-ng, workerd, txiki.js, and ClearScript do not run the npm twin.

## Publishing

Test files are not part of a package. Every `jsr/*/deno.json` sets `publish.exclude` so `*.test.ts`, `*_test.ts`, `*.spec.ts`, and the same names in `.js`, `.mjs`, `.cjs`, and `.d.ts` are left out, along with `test/run.ts`, `test/assert.ts`, and `test/main.ts`. `jsr publish` also follows imports, so an export must not import a test file or `test/`. `eng/scripts/check-publish.mjs` fails if a dry run would ship one. An npm twin is refused the same way: `npm pack` must not list a test file, and the packed manifest must not contain `workspace:`.

## Secrets

No credentials, tokens, or key bodies in this tree. A local env file is
gitignored. A committed example may be named `.env.example` and must not
contain a real secret.
