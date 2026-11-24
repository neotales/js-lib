# Unicode tables

These files are generated from the Go standard library's `unicode` package.
Do not hand-edit them.

| Property | Value |
| --- | --- |
| Source | `go1.24.0/src/unicode/tables.go` |
| Unicode version | 15.0.0 |
| SHA-256 | `80a109e5dd4ed40a85d69ddf95175f647bbd68c577d27eb475cda63790bb2487` |

The package deliberately stays on Unicode 15.0.0. Go 1.24.0 is the pinned
source, and a newer Go release usually carries a newer Unicode edition. Moving
the package to a newer edition is a separate decision, not a routine table
refresh.

Regenerate or check the files from the `js/lib` directory:

```sh
bun eng/scripts/generate-chars-tables.ts
bun eng/scripts/generate-chars-tables.ts --check
bun eng/scripts/generate-chars-tables.ts --source ./tables.go
```

`--source` accepts a local copy of the pinned file and is useful offline. Both
paths verify the SHA-256 and the Unicode version before writing or checking
anything.
