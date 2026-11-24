# Publishing

`js-cd.yml` publishes on a release tag. It is the only workflow that writes to a registry.
There is no manual dispatch. A normal release is one annotated tag, `vYYYY.MM.DD-r.N`. The
workflow's plan job discovers which registered areas changed, writes one plan, and then starts
one publish job per selected area. Legacy area tags (`std/v*`, `js/v*`, `os/v*`) still select
exactly one area.

A version that already exists is never overwritten: npm requires an exact tarball match to skip
it, and an existing JSR version is logged and skipped because Deno publishes only unpublished
versions. See [Existing versions](#existing-versions).

## Workflow triggers and shells

Only `js-cd.yml` runs for a release tag. `js-std-ci.yml` and `js-os-ci.yml`
declare `branches: ["**"]` on `push` in addition to their `paths` filters. A
`paths`-only push filter matches both branch and tag pushes, and path filters
are not evaluated at all for a tag, so the release tag started CI and the
release. `branches` is matched only against `refs/heads/`, so `**` covers every
branch and no tag. The checker evaluates the branch list in order, including
`!` negation, requires at least one positive pattern, and requires the
representative branches (`dev`, `plab-js-lib`, `rt-txiki`, and a slashed
`fix/...` name) to survive; `["**", "!**"]` excludes everything and is refused.

A job whose matrix includes `windows-latest` runs `run:` under PowerShell unless
the step sets `shell: bash`. The tag guard is a POSIX script (`set -euo
pipefail` and `case`), so it must declare `shell: bash`; without it Windows
fails with a `ParserError` before the first command. `eng/scripts/check-workflow-wiring.mjs`
checks the shell and the trigger semantics for every js workflow in the
checkout; the shell check reads the whole step, so `shell: bash` is accepted
whether it comes before or after `run:`. `eng/scripts/workflow-wiring.test.mjs`
covers the failures, including a workflow mutated to drop the branch filter,
cancel it with ordered negation, or lose the shell.

The npm package preflight (`check-publish.mjs`) spawns `npm`. npm is a shell
script on Linux and macOS but `npm.cmd` on Windows, and `spawnSync("npm")` does
not search `PATHEXT`, so on run 43659324489 the windows-latest leg failed with
`spawnSync npm ENOENT` and the release stopped before `plan`. Package contents
do not depend on the runner OS, so `js-cd.yml` gates that step with
`if: ${{ !cancelled() && runner.os == 'Linux' }}`, the same gate
`js-std-ci.yml` and `js-os-ci.yml` already use. The Linux leg of the release
matrix always runs it; the runtime test lanes still run on every OS.
`check-workflow-wiring.mjs` compares the step's `if:` with that one reviewed
line and requires the test job to run on `${{ matrix.os }}` with
`ubuntu-24.04`, `macos-latest`, and `windows-latest` in its `os` list; a
rewritten condition, a changed matrix label, a `matrix.exclude`, or a dropped
step fails `workflow-wiring.test.mjs`. It does not interpret arbitrary GitHub
expressions.

## Release ref guard

A release is a tag push. Before tests and again before publishing, the workflow checks out
`refs/tags/<tag>` explicitly and runs `eng/scripts/check-release-ref.mjs`. That guard fails
unless:

- the trigger is a tag (`github.ref_type == tag`);
- `github.ref` is exactly `refs/tags/<github.ref_name>`;
- the checked-out `HEAD` is `github.sha`;
- the tag ref resolves to `github.sha`.

This prevents a branch/tag mix-up, a moved tag, and an OIDC run whose code is not the code
GitHub triggered. The coordinator additionally requires a normal `vYYYY.MM.DD-r.N` tag to be
annotated, and resolves an annotated tag to its commit before comparing it with `HEAD`.
Legacy area tags keep working even if they are lightweight.

## Tag to area

| Tag | Areas | Notes |
| --- | --- | --- |
| `vYYYY.MM.DD-r.N` | discovered | The normal release tag. An annotated tag. The plan job selects registered areas. |
| `std/vYYYY.MM.DD-r.N` | `std` | Legacy. Selects `std` only. |
| `js/vYYYY.MM.DD-r.N` | `std` | Legacy alias for `std/v*`. |
| `os/vYYYY.MM.DD-r.N` | `os` | Legacy. Selects `os` only. |

The package version comes from each manifest, not from the tag. The tag selects the area and
orders the release. A tag does not change a version. A `vYYYY.MM.DD-r.N` tag is reserved for
js-lib in this repository and its satellite; do not use that shape for another project, because
the baseline walk treats it as a js-lib release.

## Area registry

`eng/release-areas.json` is the only list of publishable areas. It currently registers `std` and
`os`:

```json
{
  "areas": [
    { "name": "std", "legacyTagPrefixes": ["std/v", "js/v"] },
    { "name": "os", "legacyTagPrefixes": ["os/v"] }
  ],
  "sharedPaths": ["AGENTS.md", "LICENSE.md", "README.md", "..."]
}
```

- A top-level directory containing `jsr/` or `npm/` that is not registered fails the plan. Add
  the area to this file, or remove the directory.
- A registered area with no publishable package fails the plan.
- There are no per-area jobs in the workflow. The matrix is generated from the registry, so a new
  area needs no workflow edit.
- `sharedPaths` are release/build/root paths that affect every area. A change under `eng/`,
  `docs/`, `.github/`, or a root manifest selects every area. A `README.md` inside
  `std/jsr/chars/` is packaged documentation and selects only `std`; `docs/publishing.md` is
  shared and selects both.
- Anything outside a registered area and outside `sharedPaths` is conservatively treated as
  shared and selects every area.

The plan job refuses an unregistered area, or a registered area with no publishable package,
before it produces a matrix.

## Release plan and preflight

The plan job runs `node eng/scripts/release-coordinator.mjs plan` before any publish job. It:

1. validates the tag, resolving an annotated tag to its commit;
2. finds the previous normal release tag by walking the **first-parent** chain from `HEAD`,
   skipping the current tag and every tag at `HEAD`;
3. with no previous normal release tag, selects every registered area (the first release);
4. otherwise selects areas whose paths changed, plus every area with a manifest version that is
   absent from JSR or npm;
5. inspects both registries for every area it considers, and fails closed on a network error,
   a non-404 HTTP error, malformed JSR metadata, or a malformed npm response;
6. runs `publish.mjs` preflight for the selected areas, which:
   - validates every npm version's dist-tag;
   - runs `deno publish --dry-run` for every JSR package with no `--no-check`, no
     `--no-provenance`, and no `--allow-dirty` — the same flags as the real publish;
   - runs `pnpm pack` for every npm twin and refuses a `workspace:` link, a test, or the harness;
   - reads the registry for every target version;
   - records an existing JSR version as `skip-existing` instead of failing the plan;
   - requires every npm twin to have a JSR source at the same version;
   - orders both registries by the workspace dependency graph (`chars` before `slices`);
7. validates the plan against the checkout manifests, so an area/package mismatch cannot start a
   job;
8. writes `.build/release-plan.json`, `.build/release-notes.md`,
   `.build/release-rationale.json`, and `.build/release-matrix.json`, then emits the matrix and the
   plan as GitHub Actions job outputs.

The preflight does not upload. A dry run does not authenticate, so it does **not** prove that
the trusted publisher accepts the workflow. Only a real publish exercises OIDC.

A 404 from the JSR package metadata means the package is unpublished; a version missing from a
200 `versions` object is an unpublished version. Both are planned for publish. A 200 response
with `null`, malformed JSON, or a malformed `versions` object fails the plan. A network error or
a non-404 HTTP error also fails the plan. None of those are turned into a skip.

An npm 404 means the version is unpublished. A 200 must be an object whose `name` and `version`
match the requested package and version, and whose `dist` object has a `sha512-...` `integrity`
and a non-empty `tarball`. A `null`, empty, wrong-name, wrong-version, or incomplete 200 is
malformed and fails the plan. It is never treated as an existing version.

The matrix has one row per selected area. An area that is not selected produces no row; when no
area is selected the matrix contains one sentinel row and the publish job is skipped, because
GitHub rejects an empty matrix. Each publish job runs
`node eng/scripts/publish.mjs publish --area <area> --expect-plan .build/release-plan.json`.
It re-runs the plan for race safety, but refuses to publish a package set that differs from the
coordinator's approved plan. `--area` is mandatory for a normal release tag, so a matrix job
cannot silently publish another area.

The plan job exposes `has_areas`, `matrix`, and `plan` as GitHub Actions job outputs from its
`release_plan` step. `eng/scripts/check-workflow-wiring.mjs` and
`eng/scripts/workflow-wiring.test.mjs` check every `js-cd.yml` copy in the checkout (both in the
monorepo), so a missing step id or outputs mapping cannot silently skip every publish job. The same
checker enforces the tag/branch trigger split, `shell: bash` on Windows jobs, and the Linux gate on
the npm package preflight.

A legacy area tag (`std/v*`, `js/v*`, `os/v*`) still resolves without `--area`. It selects exactly
one area and uses the previous area tag for its notes, preserving the old behaviour.

## Cross-area dependencies

A matrix runs one job per area, so one area cannot be ordered after another in the same run. The
coordinator validates every cross-area workspace dependency against the registry:

- if the dependency version is already published, the release may proceed;
- if it is missing, the plan fails before any upload and names the area that must be released
  first.

`std` and `os` are currently independent. This is a preflight refusal, not silent reordering.

## Release notes

The plan job generates release notes before any publish job starts. Nothing is created as a
GitHub Release, and the plan and publish jobs keep `contents: read`.

The files are deterministic and live in the ignored build directory:

| File | Written by | Purpose |
| --- | --- | --- |
| `.build/release-plan.json` | `release-coordinator.mjs` | Package name, version, action and relative directory for every planned package |
| `.build/release-notes.md` | `release-coordinator.mjs` | The combined markdown below, appended to `$GITHUB_STEP_SUMMARY` |
| `.build/release-rationale.json` | `release-coordinator.mjs` | Tag kind, baseline, changed paths, registry state, missing versions, selection reasons, and plan |
| `.build/release-matrix.json` | `release-coordinator.mjs` | The matrix that was emitted, including the sentinel row |

The four files are uploaded as the `js-lib-release-plan-<run_id>-<run_attempt>` artifact. The plan
is also passed to each publish job as a job output; the artifact is the durable record. In the
monorepo the same files are under `js/lib/.build/`. The tag is in the file, not in the artifact
name, because a tag can contain `/`.

The package table comes from the coordinator's preflight plan, not from a second discovery pass.
`publish` is the only action reported as scheduled to publish. `skip-existing` (JSR) and
`verified-skip` (npm) are reported in a separate table with their limitation spelled out. A JSR
skip is **not** a content check, and the notes say so. Plan errors stop the notes from scheduling
anything. The notes are generated before any upload, so a publish failure does not erase the plan
that was approved.

The combined notes have one section per selected area. A shared change appears in every affected
area's section, because it really does affect every area. When no area is selected the notes say
so and say that no publish job was scheduled.

The generator validates each area's slice of the plan before writing anything. Its expected
package set comes from the publishable JSR and npm manifests discovered in the checkout, using
the same discovery as `publish.mjs`; no package name is hardcoded here. The area's entries must
carry that area, and their name, version, and canonical relative `dir` must match a discovered
manifest. The plan must contain every discovered package exactly once: a missing package, an
extra or fake package, a wrong version, a wrong directory, or a duplicate is rejected. A `std`
plan passed to an `os` area, or the reverse, is rejected too. In the notes generator, rejection is
a non-zero exit before the output file is written. In the coordinator, the rejection is recorded
in a failure note and the plan job exits non-zero, so no publish job starts.

### Baseline and commit range

The plan job checks out with `fetch-depth: 0`; without full tags and history the baseline is wrong
or absent.

- A normal `v*` release uses the nearest previous normal release tag on the **first-parent**
  chain. A tag on a merged side branch is not a release ancestor of this history and is ignored.
  The current tag and every tag at `HEAD` are excluded, so a re-run does not compare the tag with
  itself.
- A legacy area tag keeps the old baseline: the nearest reachable area tag with a shorter
  history. `std` notes consider both `std/v*` and `js/v*`; `os` notes consider `os/v*`. When two
  aliases are at the same commit, the current prefix wins the tie.
- The first normal release has no previous normal tag. It selects every registered area and uses
  the full reachable history through `HEAD`. Area tags that predate the normal format are not
  used as its baseline.
- Merge commits are omitted from the change list. A commit is included when it changes this
  area, or when it changes a shared path (`eng/`, `docs/`, `.github/`, or a root manifest).
  Shared changes affect every area, so they appear in every area's section.
- A module label comes only from this area's paths. A commit that changes `eng/` and
  `os/jsr/is-elevated` is labelled `area` in the `std` notes, not `is-elevated`. A commit that
  changes both a `std` module and `eng/` is labelled with the module and `area`.
- A module comes from the paths a commit changed (`std/jsr/chars`, `std/npm/chars`,
  `os/jsr/is-elevated`, and so on), not from its scope. A shared path such as `docs/`, `eng/`, or
  `.github/` is labelled `area`.
- A commit that appears twice is rendered once by full SHA.
- When no commit touches the area, the notes say so explicitly instead of presenting an empty
  section that reads as "nothing changed".

### Conventional types and scopes

The changelog is grouped by the conventional type, in this order: breaking,
`feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`,
`style`, `revert`, `import`, other. `feature` is normalized to `feat`. A `!`
before the colon or a `breaking` type is listed under **Breaking changes**.

Scopes such as `js-chars`, `js-slices`, `js-is-elevated`, and `js-lib` are shown
on the line. The legacy import subjects use bare `chars`, `slices`, and
`is-elevated`; those parse too. The scope is a label, not proof: if the commit
did not change that module's paths, the line is labelled `area`. A non-conventional
subject is still listed under **Other changes** with its scope omitted, because a
missing line is worse than an uncategorised one. Non-conventional subjects use
the same calculated module and `area` labels as conventional ones; they are not
blanked to a generic area label.

Commit text is untrusted. It never reaches a shell, `<`, `>`, `&`, backticks and
table pipes are escaped, control characters are removed, and the script prints
only the output path and counts to stdout. The step summary is a file, not a
stdout workflow command.

The script refuses to write notes for a tag that does not resolve to `HEAD`, or
for a tag missing from the checkout, unless `--allow-missing-tag` is passed for a
local preview. This repeats the release ref guard rather than assuming the ref.

## Existing versions

- **npm:** the local `pnpm pack` tarball's sha512 is compared with the registry
  `dist.integrity`. A match is a verified skip. Before that comparison, the version response must
  be a valid object for the requested name and version with a `sha512-...` integrity and a
  non-empty tarball. A malformed 200 fails before any upload; a 404 is an unpublished version.
  A missing or different integrity fails before any upload. A version that exists with other code
  must be bumped, not republished.
- **JSR:** an existing version is logged and skipped. Deno publishes only unpublished versions,
  so a rerun of the same tag does the same thing. The registry exposes no local artifact that
  this repository can compare with the source, so the skip is **not** a content check. The tool
  prints `not verified` and never claims that the published files are identical to the tree.
  - If the source changed, bump the version. Skipping an existing version cannot publish new
    code under the same version.
  - If only a later package in the same area failed, rerunning the tag is safe: the earlier JSR
    packages are skipped and the remaining ones publish.

Deno 2.9.8 checks the registry before its expensive type check and skips an existing version
with `Warning: Skipping, already published`. It can also report `Already uploaded, waiting for
publishing` when another run is uploading the same version. The script treats both as a skip
only when Deno exits zero. A non-zero exit is a real failure even when that message appears,
because Deno keeps polling an in-flight upload and reports its failure.

## Partial releases

The first irreversible upload can still be followed by a failure. That is unavoidable:

- JSR `chars` can publish, then `slices` fail. npm is not attempted.
- JSR can finish, then npm `chars` fail.
- Deno can upload a JSR version and then fail to accept the provenance attestation. Deno warns
  and exits zero; the package is published without a provenance badge.
- A runner can lose the network after a registry accepts an upload.

A rerun of the same tag is safe for versions that already exist:

- An existing JSR version is skipped with a note that its content was not verified.
- An existing npm version is skipped only when its tarball integrity matches exactly; a different
  tarball fails.
- A later version that is still missing is published. Dependency order is unchanged.

A new normal release also repairs a previous partial release without a path change. The
coordinator reads the current manifests and both registries, and selects an area whenever any of
its manifest versions is absent, even if no commit since the previous tag touched that area. A
registry error fails the plan instead of being treated as "already published".

Each area is a separate matrix job. If `std` fails, `os` is not marked failed and does not
republish `std`. A re-run of the tag queues behind the same per-area concurrency group. Do not
move, delete, or reuse the old tag.

The limitation is content: if a JSR version exists but the source at the tag changed, the skip
will not update it. Bump the version of any package whose content changed. The skip cannot detect
that for you, because JSR publishes no artifact this repository can compare.

Do not move, delete, or reuse the old tag. Do not unpublish or yank a version to force a rerun.

## npm and pnpm

The npm twins are generated by `bun run transpile` from the JSR source. Do not hand-edit them.
`@neotales/slices` depends on `@neotales/chars` with `workspace:*`. `npm publish` would upload
that literal string and produce a broken package. The workflow uses `pnpm publish`, which
rewrites the dependency to the version in the workspace manifest. The preflight also refuses a
packed manifest that still shows a `workspace:` link.

`pnpm publish` checks the git branch unless it detects CI. The workflow sets `CI: "true"`,
which lets a detached tag checkout publish. Do not remove it.

## Prerelease tags

Only `alpha.N`, `beta.N`, and `rc.N` are recognized. `0.1.0-alpha.0` goes to `alpha`;
`latest` stays on the last stable version. Any other prerelease (`next.1`, `preview.1`,
`alpha` without a number, `alpha.0.1`) fails the plan before any upload. A stable version goes
to `latest`.

## JSR dependency order

`deno publish --dry-run` resolves `slices` against the workspace even while
`@neotales/chars@0.1.0-alpha.0` is unpublished. Actual publishing relies on the script's
order: `chars` first, then `slices`. If `chars` fails, `slices` is never attempted. JSR does
not rewrite the dependency to a published version until `deno publish` prepares the tarball.

## os workspace

`os/deno.json` is a nested Deno workspace with `nodeModulesDir: auto`. Deno does not read
`os/pnpm-workspace.yaml`; without this file it tries to migrate it during `deno publish`, and
the `is-elevated` type check fails on `@types/node`. `os/ende.json` is the synced copy.

`std/deno.json` is also a nested Deno workspace for `std/jsr/*`, with
`nodeModulesDir: auto`. It prevents Deno from trying to migrate the neighboring
`std/pnpm-workspace.yaml` during JSR dry runs and resolves intra-area imports such
as `@neotales/env` from the workspace. Auto-install is needed for the
`@types/node` reference used by `env`'s public types.

## Authentication

Both registries use GitHub Actions OIDC. The publish job has `id-token: write` and
`environment: production`, runs on a GitHub-hosted runner, and reads no npm token, no
`NODE_AUTH_TOKEN`, and no JSR token. The plan job has `contents: read` only and cannot mint an
OIDC token, so the coordinator cannot publish.

The npm trusted publisher is configured per package on npmjs.com:

- Organization or user: `neotales`
- Repository: `js-lib`
- Workflow filename: `js-cd.yml`
- Environment name: `production`
- Allowed actions: `npm publish`, and optionally `npm stage publish`

The workflow publishes directly. A trusted publisher that allows only `npm stage publish`
will reject it even though OIDC authentication succeeds.

The JSR package must be linked to `https://github.com/neotales/js-lib` in the package's
Settings tab. The public `meta.json` for `@neotales/chars`, `@neotales/slices`, and
`@neotales/is-elevated` already reports that link.

### Workflow identity constraint

Publishing stays in the top-level `js-cd.yml`. It is not moved to a reusable workflow. The npm
trusted-publisher form names a workflow **filename** that must live in `.github/workflows/`, and
npm validates the calling workflow's name when `workflow_call` is involved; moving the publish
steps to another file would change the identity npm checks and could silently break the existing
`js-cd.yml`/`production` configuration. A matrix job inside `js-cd.yml` keeps the same workflow
filename and environment for every area.

JSR does not configure a workflow filename: the package is linked to the repository and accepts
GitHub Actions OIDC. Keeping the same repository and workflow file is still the identity that was
linked.

This was checked against the official documentation on 2026-11-14:

- npm, [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers):
  workflow filename only, no path, must exist in `.github/workflows/`; reusable workflows validate
  the calling workflow and require `id-token: write` on both.
- JSR, [Publishing packages](https://jsr.io/docs/publishing-packages): link the package to the
  GitHub repository, then publish from GitHub Actions with `id-token: write`; no separate
  workflow-name setting.

No registry setting needs to change for this release coordinator. If a trusted publisher is
deleted and recreated, keep the filename `js-cd.yml` and environment `production`.

Registry-side settings cannot be read by this repository. If a publish returns `ENEEDAUTH`,
`actorNotAuthorized`, or `actorNotScopeMember`, check the registry setting before changing
this workflow.

## Bootstrap restrictions

- npm validates a newly created trusted publisher with its first successful publish. The
  configuration expires if that publish does not happen within two days. Delete-and-recreate
  resets the window.
- An existing npm trusted publisher connection cannot be edited. Change the workflow filename
  by deleting the connection and creating it again.
- Self-hosted runners are not supported for npm trusted publishing.
- Provenance is automatic for a public repository and a public package. A private repository
  publishes without provenance.
- JSR's scope setting "require scope member" is on by default. The user who pushes the release
  tag must be a member of the `@neotales` scope unless that setting is changed.

## Manual checks

These need an authenticated browser and are not done by CI:

1. npm: Packages -> each of `@neotales/chars`, `@neotales/slices`, and
   `@neotales/is-elevated` -> Settings -> Trusted publishing. Confirm `neotales/js-lib`,
   `js-cd.yml`, `production`, and `npm publish`.
2. npm: after the first successful publish, set Publishing access to "Require two-factor
   authentication and disallow tokens" and revoke old automation tokens.
3. JSR: each package -> Settings -> GitHub repository is `neotales/js-lib`; scope -> Settings
   -> GitHub Actions publishing security.
4. Create the normal release tag as an annotated tag in `neotales/js-lib`:
   `git tag -a v2026.11.14-r.1 -m "v2026.11.14-r.1"`. Do not create a lightweight tag for
   `v*`.

## Local dry runs

Run from `js/lib` in a clean checkout of the tag. A local branch is not `dev`, so use
`--no-git-checks` for pnpm; CD does not.

```sh
node eng/scripts/check-publish.mjs
bun run sync:ende -- --check
node --test eng/scripts/publish.test.mjs
node --test eng/scripts/release-notes.test.mjs
node --test eng/scripts/release-coordinator.test.mjs
node --test eng/scripts/workflow-wiring.test.mjs

# The normal release path. --allow-missing-tag is only for a local preview.
RELEASE_TAG=v2026.11.14-r.1 node eng/scripts/release-coordinator.mjs plan \
  --allow-missing-tag \
  --plan-json .build/release-plan.json \
  --notes .build/release-notes.md \
  --rationale .build/release-rationale.json \
  --matrix-json .build/release-matrix.json

# The legacy area path remains available.
RELEASE_TAG=std/v2026.11.14-r.1 node eng/scripts/publish.mjs preflight --plan-json .build/release-plan-std.json
RELEASE_TAG=os/v2026.11.14-r.1 node eng/scripts/publish.mjs preflight --plan-json .build/release-plan-os.json
RELEASE_TAG=std/v2026.11.14-r.1 node eng/scripts/release-notes.mjs --plan .build/release-plan-std.json --output .build/release-notes-std.md --allow-missing-tag
RELEASE_TAG=os/v2026.11.14-r.1 node eng/scripts/release-notes.mjs --plan .build/release-plan-os.json --output .build/release-notes-os.md --allow-missing-tag

pnpm --dir std/npm/chars publish --dry-run --no-git-checks
pnpm --dir std/npm/slices publish --dry-run --no-git-checks
pnpm --dir os/npm/is-elevated publish --dry-run --no-git-checks
(cd std/jsr/chars && deno publish --dry-run)
(cd std/jsr/slices && deno publish --dry-run)
(cd os/jsr/is-elevated && deno publish --dry-run)
```

A preflight where every version already exists exits 0: each existing JSR version prints
`skip-existing` (content not verified), and each npm twin whose tarball integrity matches prints
`verified-skip`. That is a successful no-op, not an upload. A preflight that cannot read JSR
metadata exits non-zero and uploads nothing.

`deno publish` refuses a working tree with untracked files. Use `--allow-dirty` only for a
local packaging check, never for the release preflight. A local preview of a normal tag that has
not been created yet needs `--allow-missing-tag`; that also skips the annotated-tag check because
there is no local tag object to inspect.

A coordinator run reads JSR and npm but never writes to either registry, never creates a GitHub
Release, and never creates or moves a git tag. The plan job is the only place the matrix is
produced; a publish worker cannot add an area.
