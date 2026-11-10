using Microsoft.ClearScript;
using Microsoft.ClearScript.JavaScript;
using Microsoft.ClearScript.V8;

// Loads the test entry as an ES module. ClearScript does not infer the category.
// The host sets ModuleCategory.Standard, allows file loads, and resolves each
// import from the entry file's directory. Imported modules inherit that category.

if (args.Length != 1)
{
    Console.Error.WriteLine("usage: ClearScriptHost <entry.js>");
    return 2;
}

var entry = Path.GetFullPath(args[0]);
if (!File.Exists(entry))
{
    Console.Error.WriteLine($"missing entry: {entry}");
    return 2;
}

using var engine = new V8ScriptEngine();
engine.AddHostType(typeof(Console));
engine.Execute(
    """
    globalThis.console = {
      log: function () {
        var parts = [];
        for (var i = 0; i < arguments.length; i++) parts.push(String(arguments[i]));
        Console.WriteLine(parts.join(" "));
      }
    };
    """);
engine.DocumentSettings.AccessFlags = DocumentAccessFlags.EnableFileLoading;
engine.DocumentSettings.SearchPath = Path.GetDirectoryName(entry)!;

var info = new DocumentInfo(new Uri(entry))
{
    Category = ModuleCategory.Standard,
};
engine.Execute(info, File.ReadAllText(entry));
return 0;
