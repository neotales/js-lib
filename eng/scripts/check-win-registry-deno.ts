// Windows-only Deno lifecycle probe. Run with FFI allowed:
//   deno run --allow-sys --allow-ffi eng/scripts/check-win-registry-deno.ts
// Read-only: it opens predefined keys and never writes a registry value.

import {
  isRegistryAvailable,
  Registry,
} from "../../os/jsr/win-registry/mod.ts";
import {
  close,
  isOpened,
  open,
} from "../../os/jsr/win-registry/ffi_deno.ts";

if (Deno.build.os !== "windows") {
  console.log("not run: Windows-only win-registry Deno probe");
  Deno.exit(0);
}

if (!isRegistryAvailable()) {
  throw new Error(
    "isRegistryAvailable() returned false with --allow-ffi; check the Deno backend",
  );
}

close();
if (isOpened()) throw new Error("backend stayed open after close()");
open();
if (!isOpened()) throw new Error("backend did not open after open()");

for (const path of ["HKCU\\Software", "HKLM\\SOFTWARE"]) {
  const key = Registry.openKey(path);
  try {
    key.getValueNames();
  } finally {
    key.close();
  }
}

close();
if (isOpened()) throw new Error("backend stayed open after the final close()");

console.log("win-registry Deno lifecycle ok");
