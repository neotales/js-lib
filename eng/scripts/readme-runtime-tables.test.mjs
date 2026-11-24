import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../../", import.meta.url).pathname;
async function modules(area) {
  const base = join(root, area, "jsr");
  return (await readdir(base, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

test("publishable module READMEs use vertical runtime tables", async () => {
  for (const area of ["std", "os"]) {
    for (const name of await modules(area)) {
      const dir = join(root, area, "jsr", name);
      const metadata = JSON.parse(await readFile(join(dir, "deno.json"), "utf8"));
      if (metadata.publish?.include === false || metadata.publish === false) continue;
      const readme = await readFile(join(dir, "README.md"), "utf8");
      assert.match(readme, /^#{1,3} Runtime support$/im, `${area}/${name} has runtime support heading`);
      const heading = readme.search(/^#{1,3} Runtime support$/im);
      const lines = readme.slice(heading).split("\n").filter((line) => line.startsWith("|"));
      assert.ok(lines.length >= 3, `${area}/${name} has a runtime table`);
      assert.match(lines[0], /^\| Runtime \|/i, `${area}/${name} table is vertical`);
      assert.ok(lines.slice(2).every((line) => /^\| [^|]+ \|/.test(line)), `${area}/${name} rows each represent a runtime`);
      assert.ok(!lines.some((line) => /\| (Deno|Node\.js|Bun) \|/.test(line.slice(1))), `${area}/${name} is not a horizontal matrix`);
    }
  }
});
