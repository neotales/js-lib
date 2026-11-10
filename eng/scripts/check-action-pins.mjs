// Fail unless every `uses:` is a commit SHA with a version comment.
// --latest also checks that the comment is still the newest GitHub release.
// This is not part of ci or cd.

import { readFileSync } from "node:fs";

const latest = process.argv.includes("--latest");
const files = process.argv.slice(2).filter((arg) => arg !== "--latest");
if (files.length === 0) {
  console.error("usage: node check-action-pins.mjs [--latest] workflow.yml ...");
  process.exit(2);
}

const pin = /^(\s*-?\s*uses:\s*)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)@([0-9a-f]{40})(?:\s+#\s*(v\S+))?\s*$/;
let failed = 0;

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  for (const [index, line] of lines.entries()) {
    if (!line.includes("uses:")) continue;
    const match = line.match(pin);
    if (!match || !match[4]) {
      console.error(`${file}:${index + 1}: pin uses: to a 40-character SHA and a # vX.Y.Z comment`);
      failed++;
      continue;
    }
    if (!latest) continue;
    const repo = match[2];
    const comment = match[4];
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "js-lib-pin-check" },
    });
    if (!response.ok) {
      console.error(`${file}:${index + 1}: ${repo} latest release returned ${response.status}`);
      failed++;
      continue;
    }
    const body = await response.json();
    if (body.tag_name !== comment) {
      console.error(`${file}:${index + 1}: ${repo} comment ${comment} is not latest ${body.tag_name}`);
      failed++;
    }
  }
}

if (failed > 0) process.exit(1);
console.log(`pins ok (${files.length} file${files.length === 1 ? "" : "s"})`);
