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

`bun run test` is the gate. The other lanes are `bun run test:<lane>` and the scripts live in `eng/scripts/`. Each lane has a timeout and must finish in well under a minute. A lane that cannot run exits non-zero. The runner is `@neotales/test` and assert is `@neotales/assert`. Both are workspace members with `publish: false`. They must not import `node:` or read `process`. Ende has neither. Do not use top-level await in the runner. A test that needs a runtime permission branches on that runtime and is a skip everywhere else.

A test may import a sibling as `@neotales/<name>` or `@neotales/<name>/<export>`. That name is a member of the satellite `deno.json` workspace. It is not an npm `workspace:` link, and a lane must not fetch it from a registry.

Deno and Ende resolve the name from that workspace and run generated suite entries as source. `deno.json` stays the file Deno and JSR read. `bun run sync:ende` copies each one onto `ende.json` so Ende does not warn. Do not edit `ende.json`. A package excludes it from publish.

Bun does not read a Deno workspace. Neither do Node, QuickJS-ng, workerd, txiki.js, or ClearScript. The launcher rewrites `@neotales/<name>` to a relative path from the member's `exports` before those lanes see the file. The bundle lanes inline that path. ClearScript gets the rewritten `.js` graph. A specifier that is not a workspace member fails the lane.

`workspace:*` belongs only in a generated npm twin's `package.json`, so pnpm can link siblings inside one area. pnpm rewrites it on publish. `npm publish` does not. The pack check allows that form and refuses any other `workspace:` link. Deno, Ende, QuickJS-ng, workerd, txiki.js, and ClearScript do not run the npm twin.

## Publishing

Test files are not part of a package. Every `jsr/*/deno.json` sets `publish.exclude` so `*.test.ts`, `*_test.ts`, `*.spec.ts`, and the same names in `.js`, `.mjs`, `.cjs`, and `.d.ts` are left out, and exclude the unpublished harness modules, which declare `publish: false`. `jsr publish` also follows imports, so an export must not import a test file or the harness module. `eng/scripts/check-publish.mjs` fails if a dry run would ship one. An npm twin is refused the same way: `npm pack` must not list a test file. `workspace:*` is allowed in the twin. Any other `workspace:` link is refused.

`js-cd.yml` publishes on a release tag. A normal release is one annotated tag, `vYYYY.MM.DD-r.N`; its plan job discovers the registered areas that changed or still have an unpublished version. `std/v*` and `js/v*` select `std`, and `os/v*` selects `os`; the legacy tags keep their old one-area behaviour. Areas are listed only in `eng/release-areas.json`. Add an area there; do not add a per-area workflow job.

`eng/scripts/release-coordinator.mjs` runs before any publish job. It resolves the previous normal release tag on the first-parent chain (or selects every area on the first release), reads both registries, treats a missing manifest version as a selected area, fails closed on a registry error, and writes the plan, combined notes, rationale and GitHub Actions matrix. It validates the plan against the checkout and refuses a cross-area dependency whose target version is not already published. The plan job has `contents: read` only.

`eng/scripts/check-publish.mjs` is a Linux-only step in `js-cd.yml`, matching `js-std-ci.yml` and `js-os-ci.yml`. It spawns `npm`, which is `npm.cmd` on Windows, and `spawnSync("npm")` does not search `PATHEXT`; package contents are platform independent, and the Linux leg of the matrix always runs the check. The runtime lanes still run on every OS. Windows CD failed on run 43659324489 with `spawnSync npm ENOENT` before this gate existed.

`eng/scripts/publish.mjs` preflights every selected package before the first upload with a release-equivalent `deno publish --dry-run`, then publishes in dependency order. `publish --area <area>` publishes one matrix area and `--expect-plan` refuses a package set that differs from the coordinator's plan. npm publishes with `pnpm publish`, which rewrites `workspace:*`; `npm publish` does not. Both registries authenticate with GitHub Actions OIDC, not a token. npm requires a valid version response with matching name/version and sha512 integrity plus tarball metadata, then an exact packed-tarball sha512 match to skip an existing version; a malformed 200 fails closed. An existing JSR version is logged and skipped, because Deno publishes only unpublished versions; the skip explicitly does not verify content, and a network error or malformed JSR metadata still fails closed. Unrecognized prereleases are rejected before upload. A release is a tag push; the ref guard verifies the checked-out HEAD is `github.sha`. Registry-side setup, recovery limits, and failure modes are in [docs/publishing.md](docs/publishing.md).

Publishing stays in the top-level `js-cd.yml` with a matrix job per area; it is not moved to a reusable workflow, because npm validates the workflow filename and environment named in its trusted-publisher configuration. `eng/scripts/workflow-wiring.test.mjs` checks every `js-cd.yml` copy in the checkout so the plan job's `has_areas`, `matrix`, and `plan` outputs stay mapped to the publish matrix. It also refuses a tag-triggered CI workflow, a branch-triggered release, a Windows job whose `run:` block lacks `shell: bash`, and a release whose npm package preflight is not gated to Linux. The npm connection must keep `js-cd.yml` and `production`, and the JSR package must stay linked to `neotales/js-lib`.

`js-cd.yml` also generates `.build/release-notes.md` from the same preflight plan and the commit history. The notes are appended to the run's step summary and uploaded with the plan, rationale and matrix as an artifact. No GitHub Release is created, and the job keeps `contents: read`. The package table is the plan; a JSR skip is reported as a skip, not a shipment. Baseline choice, conventional types, scopes and the exact output files are in [docs/publishing.md](docs/publishing.md).

`os/deno.json` is a nested Deno workspace with `nodeModulesDir: auto`, and `os/ende.json` is its synced copy. Deno does not read `os/pnpm-workspace.yaml`; without the file it tries to migrate it during `deno publish`, and the `is-elevated` type check fails on `@types/node`.

## Secrets

No credentials, tokens, or key bodies in this tree. A local env file is
gitignored. A committed example may be named `.env.example` and must not
contain a real secret.
