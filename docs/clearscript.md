# ClearScript

ClearScript should load [chars](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [env](../std/jsr/env/README.md), [dotenv](../std/jsr/dotenv/README.md), and [path](../std/jsr/path/README.md); see their module README tables. `path` skips its URL scenarios because the host has no `URL` global. No OS module has a ClearScript FFI backend.

The loader transpiles the TypeScript graph to `.js`, then the C# host creates a `V8ScriptEngine`, enables file loading, sets the entry directory as `SearchPath`, and executes the entry as a standard module. It adds the `Console` host type and maps `console.log` to `Console.WriteLine`.

The test lane runs the repo host with the transpiled entry using `dotnet run --project eng/scripts/clearscript/ClearScriptHost.csproj -c Release -- <entry.js>`; the host project references Microsoft.ClearScript.V8 7.5.0.

```sh
dotnet run --project eng/scripts/clearscript/ClearScriptHost.csproj -c Release -- .build/clearscript/modules/entry.js
```
