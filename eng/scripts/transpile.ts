// Generate an npm package from a JSR module with dnt. The JSR tree is the source.
// Do not hand-edit std/npm or os/npm.

import { emptyDir, build } from "jsr:@deno/dnt@0.44.0";
import { walk } from "jsr:@std/fs@1.0.19/walk";
import { join } from "jsr:@std/path@1.1.2";

const root = join(import.meta.dirname!, "../..");
const modules = [
  ["std", "chars"],
  ["std", "slices"],
  ["os", "is-elevated"],
] as const;

for (const [area, name] of modules) {
  await transpile(area, name);
}

async function transpile(area: string, name: string): Promise<void> {
  const source = join(root, area, "jsr", name);
  const outDir = join(root, area, "npm", name);
  const config = JSON.parse(await Deno.readTextFile(join(source, "deno.json"))) as {
    name: string;
    version: string;
    license?: string;
    exports: Record<string, string>;
  };
  const entryPoints = Object.entries(config.exports).map(([entryName, path]) => ({
    name: entryName,
    path,
  }));
  const mappings = await workspaceMappings(source);
  const configFile = await writeImportMap(area, name, mappings);
  await emptyDir(outDir);
  const previous = Deno.cwd();
  try {
    Deno.chdir(source);
    await build({
      entryPoints,
      outDir,
      declaration: "separate",
      esModule: true,
      scriptModule: false,
      skipSourceOutput: true,
      test: false,
      typeCheck: false,
      skipNpmInstall: true,
      packageManager: "pnpm",
      configFile,
      shims: { deno: false },
      package: {
        name: config.name,
        version: config.version,
        license: config.license ?? "MIT",
        type: "module",
        engines: { node: ">=22" },
        repository: {
          type: "git",
          url: "git+https://github.com/neotales/js-lib.git",
          directory: `${area}/npm/${name}`,
        },
        keywords: runtimeKeywords(name),
        dependencies: workspaceDependencies(mappings),
        optionalDependencies: name === "is-elevated" ? { koffi: "^2.9.0" } : undefined,
      },
      async postBuild() {
        await Deno.copyFile(join(source, "README.md"), join(outDir, "README.md"));
        await Deno.copyFile(join(source, "LICENSE.md"), join(outDir, "LICENSE.md"));
      },
    });
  } finally {
    Deno.chdir(previous);
  }
  await removeNodeModules(outDir);
  console.log(`transpiled ${area}/${name}`);
}

async function workspaceMappings(source: string): Promise<Record<string, { name: string; version: string; subPath?: string }>> {
  const mappings: Record<string, { name: string; version: string; subPath?: string }> = {};
  for await (const entry of walk(source, { exts: [".ts"], includeDirs: false })) {
    if (entry.name.includes(".test.") || entry.name.includes("_test.")) continue;
    const text = await Deno.readTextFile(entry.path);
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;
      const spec = trimmed.match(/from\s+["'](@neotales\/[^"']+)["']/);
      if (!spec) continue;
      const specifier = spec[1];
      if (mappings[specifier]) continue;
      const packageName = specifier.split("/").slice(0, 2).join("/");
      const subPath = specifier.slice(packageName.length + 1);
      if (!(await exportExists(packageName, subPath))) continue;
      const version = await packageVersion(packageName);
      mappings[specifier] = subPath
        ? { name: packageName, version, subPath }
        : { name: packageName, version };
    }
  }
  return mappings;
}

async function writeImportMap(
  area: string,
  name: string,
  mappings: Record<string, { name: string; version: string; subPath?: string }>,
): Promise<string | false> {
  if (Object.keys(mappings).length === 0) return false;
  const imports: Record<string, string> = {};
  for (const [specifier, mapping] of Object.entries(mappings)) {
    const target = mapping.subPath
      ? `npm:${mapping.name}@${mapping.version}/${mapping.subPath}`
      : `npm:${mapping.name}@${mapping.version}`;
    imports[specifier] = target;
  }
  const dir = join(root, ".build", "transpile");
  await Deno.mkdir(dir, { recursive: true });
  const file = join(dir, `${area}-${name}.json`);
  await Deno.writeTextFile(file, JSON.stringify({ imports }));
  return file;
}

function workspaceDependencies(
  mappings: Record<string, { name: string; version: string; subPath?: string }>,
): Record<string, string> | undefined {
  const dependencies: Record<string, string> = {};
  for (const mapping of Object.values(mappings)) {
    dependencies[mapping.name] = mapping.name.startsWith("@neotales/") ? "workspace:*" : mapping.version;
  }
  return Object.keys(dependencies).length ? dependencies : undefined;
}

function runtimeKeywords(name: string): string[] | undefined {
  const portable = ["deno", "node", "bun", "ende", "quickjs-ng", "workerd", "txiki", "clearscript", "browsers"];
  if (name === "chars") return ["chars", ...portable, "jerryscript"];
  if (name === "slices") return ["slices", ...portable, "jerryscript"];
  if (name === "is-elevated") return ["is-elevated", "deno", "node", "bun", "ende", "workerd", "txiki"];
  return undefined;
}

async function exportExists(packageName: string, subPath: string): Promise<boolean> {
  const module = packageName.slice("@neotales/".length);
  for (const area of ["std", "os"]) {
    try {
      const json = JSON.parse(await Deno.readTextFile(join(root, area, "jsr", module, "deno.json"))) as {
        exports?: Record<string, string>;
      };
      const key = subPath ? `./${subPath}` : ".";
      return Boolean(json.exports?.[key]);
    } catch {
      // The other area may own it.
    }
  }
  return false;
}

async function packageVersion(packageName: string): Promise<string> {
  const module = packageName.slice("@neotales/".length);
  for (const area of ["std", "os"]) {
    const manifest = join(root, area, "jsr", module, "deno.json");
    try {
      const json = JSON.parse(await Deno.readTextFile(manifest)) as { version?: string };
      if (json.version) return json.version;
    } catch {
      // The other area may own it.
    }
  }
  throw new Error(`no version for ${packageName}`);
}

async function removeNodeModules(dir: string): Promise<void> {
  try {
    await Deno.remove(join(dir, "node_modules"), { recursive: true });
  } catch {
    // dnt did not install.
  }
}
