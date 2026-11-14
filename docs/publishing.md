# Publishing

`js-cd.yml` publishes on a release tag. It is the only workflow that writes to a registry.
There is no manual dispatch. A version that already exists is never overwritten: npm requires
an exact tarball match to skip it, and an existing JSR version is logged and skipped because
Deno publishes only unpublished versions. See [Existing versions](#existing-versions).

## Release ref guard

A release is a tag push. Before tests and again before publishing, the workflow checks out
`refs/tags/<tag>` explicitly and runs `eng/scripts/check-release-ref.mjs`. That guard fails
unless:

- the trigger is a tag (`github.ref_type == tag`);
- `github.ref` is exactly `refs/tags/<github.ref_name>`;
- the checked-out `HEAD` is `github.sha`;
- the tag ref resolves to `github.sha`.

This prevents a branch/tag mix-up, a moved tag, and an OIDC run whose code is not the code
GitHub triggered.

## Tag to area

| Tag | Area | Packages |
| --- | --- | --- |
| `std/vYYYY.MM.DD-r.N` | `std` | `@neotales/chars`, `@neotales/slices` |
| `js/vYYYY.MM.DD-r.N` | `std` | the same as `std/v*`, kept for the existing tag |
| `os/vYYYY.MM.DD-r.N` | `os` | `@neotales/is-elevated` |

The package version comes from each manifest, not from the tag. The tag selects the area
and orders the release. A tag does not change a version.

## Release plan and preflight

`node eng/scripts/publish.mjs preflight` runs before the first upload. It:

- validates every npm version's dist-tag;
- runs `deno publish --dry-run` for every JSR package with no `--no-check`, no
  `--no-provenance`, and no `--allow-dirty` — the same flags as the real publish;
- runs `pnpm pack` for every npm twin and refuses a `workspace:` link, a test, or the harness;
- reads the registry for every target version and rejects malformed JSR metadata;
- records an existing JSR version as `skip-existing` instead of failing the plan;
- requires every npm twin to have a JSR source at the same version;
- orders both registries by the workspace dependency graph (`chars` before `slices`).

The preflight does not upload. A dry run does not authenticate, so it does **not** prove that
the trusted publisher accepts the workflow. Only a real publish exercises OIDC.

A 404 from the JSR package metadata means the package is unpublished; a version missing from a
200 `versions` object is an unpublished version. Both are planned for publish. A 200 response
with `null`, malformed JSON, or a malformed `versions` object fails the plan. A network error or
a non-404 HTTP error also fails the plan. None of those are turned into a skip.

`node eng/scripts/publish.mjs publish` re-runs the plan and then uploads. It stops at the first
real failure.

## Existing versions

- **npm:** the local `pnpm pack` tarball's sha512 is compared with the registry
  `dist.integrity`. A match is a verified skip. A missing or different integrity fails before
  any upload. A version that exists with other code must be bumped, not republished.
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

## Authentication

Both registries use GitHub Actions OIDC. The publish job has `id-token: write` and
`environment: production`, runs on a GitHub-hosted runner, and reads no npm token, no
`NODE_AUTH_TOKEN`, and no JSR token.

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

## Local dry runs

Run from `js/lib` in a clean checkout of the tag. A local branch is not `dev`, so use
`--no-git-checks` for pnpm; CD does not.

```sh
node eng/scripts/check-publish.mjs
bun run sync:ende -- --check
node --test eng/scripts/publish.test.mjs
RELEASE_TAG=std/v2026.11.14-r.1 node eng/scripts/publish.mjs preflight
RELEASE_TAG=os/v2026.11.14-r.1 node eng/scripts/publish.mjs preflight
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
local packaging check, never for the release preflight.
