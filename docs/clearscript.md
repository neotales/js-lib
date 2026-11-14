# ClearScript

ClearScript should load `chars` and `slices`; see their [module README tables](../std/jsr/chars/README.md) and [slices](../std/jsr/slices/README.md).

The loader transpiles the TypeScript graph to `.js`, then the C# host creates a `V8ScriptEngine`, enables file loading, sets the entry directory as `SearchPath`, and executes the entry as a standard module. It adds the `Console` host type and maps `console.log` to `Console.WriteLine`.

The test lane runs the repo host with the transpiled entry using `dotnet run --project eng/scripts/clearscript/ClearScriptHost.csproj -c Release -- <entry.js>`; the host project references Microsoft.ClearScript.V8 7.5.0.

```sh
dotnet run --project eng/scripts/clearscript/ClearScriptHost.csproj -c Release -- .build/clearscript/modules/entry.js
```
