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

## Secrets

No credentials, tokens, or key bodies in this tree. A local env file is
gitignored. A committed example may be named `.env.example` and must not
contain a real secret.
