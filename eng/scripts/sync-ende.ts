// Copy each deno.json onto ende.json. Ende warns when it falls back to
// deno.json. A symlink is not a copy: JSR refuses one inside a package, and
// writing through it would overwrite the source. --check fails if they differ.

import { lstatSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dir, "../..");
const check = Bun.argv.includes("--check");
const args = Bun.argv.slice(2).filter((arg) => arg !== "--check");
if (args.length > 0) {
  console.error("usage: bun eng/scripts/sync-ende.ts [--check]");
  throw new Error("unknown argument");
}

const pairs = [
  ["deno.json", "ende.json"],
  ["deno.jsonc", "ende.jsonc"],
] as const;
const skip = new Set([".git", ".build", "node_modules", "dist"]);
const failures: string[] = [];
let wrote = 0;

for (const dir of directories(root)) syncDir(dir);

if (failures.length > 0) {
  for (const message of failures) console.error(message);
  process.exit(1);
}
console.log(check ? `ende.json matches deno.json` : `synced ende.json (${wrote} written)`);

function syncDir(dir: string): void {
  for (const [sourceName, destName] of pairs) {
    const source = join(dir, sourceName);
    const dest = join(dir, destName);
    const sourceStat = stat(source);
    const destStat = stat(dest);
    if (sourceStat === null || !sourceStat.isFile()) {
      if (destStat === null) continue;
      const label = rel(dest);
      if (check) failures.push(`${label} has no ${sourceName}`);
      else unlinkSync(dest);
      continue;
    }
    const bytes = readFileSync(source);
    if (destStat?.isFile() && !destStat.isSymbolicLink() && same(dest, bytes)) continue;
    const label = rel(dest);
    if (check) {
      failures.push(`${label} is not a copy of ${sourceName}`);
      continue;
    }
    if (destStat !== null) unlinkSync(dest);
    writeFileSync(dest, bytes);
    wrote++;
    console.log(label);
  }
}

function directories(dir: string): string[] {
  const found = [dir];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name) || entry.isSymbolicLink() || !entry.isDirectory()) continue;
    found.push(...directories(join(dir, entry.name)));
  }
  return found;
}

function same(path: string, bytes: Uint8Array): boolean {
  const current = readFileSync(path);
  return current.length === bytes.length && current.every((byte, index) => byte === bytes[index]);
}

function stat(path: string): ReturnType<typeof lstatSync> | null {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}

function rel(path: string): string {
  return relative(root, path).split("\\").join("/");
}
