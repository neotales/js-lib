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

## Secrets

No credentials, tokens, or key bodies in this tree. A local env file is
gitignored. A committed example may be named `.env.example` and must not
contain a real secret.
