// The libsecret backends must prove the process ABI before loading native code.
// A 32-bit or big-endian process would misread GError and pointer structures, so
// the gate must precede the Node/Bun/Deno native loader.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const backends = [
  ["os/jsr/linux-libsecret/ffi_node.ts", 'createRequire(import.meta.url)'],
  ["os/jsr/linux-libsecret/ffi_bun.ts", 'await import(/* @vite-ignore */ specifier)'],
  ["os/jsr/linux-libsecret/ffi_deno.ts", 'const deno ='],
];

test("libsecret backends gate the process ABI before native loading", () => {
  for (const [file, native] of backends) {
    const text = readFileSync(join(root, file), "utf8");
    const gate = text.indexOf("requireLibsecretAbi(detectPointerWidth(), detectEndianness())");
    const load = text.indexOf(native);
    assert.ok(gate >= 0, `${file}: missing requireLibsecretAbi gate`);
    assert.ok(load > gate, `${file}: native loader appears before the ABI gate`);
  }
});

test("libsecret txiki gates every backend operation", () => {
  const text = readFileSync(join(root, "os/jsr/linux-libsecret/txiki_bindings.ts"), "utf8");
  for (const name of [
    "secretSchemaNew",
    "secretPasswordLookupSync",
    "secretPasswordStoreSync",
    "secretPasswordClearSync",
    "secretPasswordFree",
    "cancellableNew",
    "cancellableCancel",
    "cancellableRelease",
    "listSecretRecords",
  ]) {
    const body = text.slice(text.indexOf(`function ${name}(`));
    assert.match(body.slice(0, 500), /assertAbi\(\)/, `${name}: no ABI assertion`);
  }
});
