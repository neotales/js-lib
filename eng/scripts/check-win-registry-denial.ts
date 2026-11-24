// Windows-only denial probe. Run without --allow-ffi:
//   deno run --allow-sys eng/scripts/check-win-registry-denial.ts
// A denied FFI must report unavailable, not throw at import or claim support.

import {
  isRegistryAvailable,
  Registry,
  RegistryError,
} from "../../os/jsr/win-registry/mod.ts";

if (Deno.build.os !== "windows") {
  console.log("not run: Windows-only win-registry denial probe");
  Deno.exit(0);
}

if (isRegistryAvailable()) {
  throw new Error(
    "isRegistryAvailable() returned true without --allow-ffi; the backend open() probe did not run",
  );
}

try {
  Registry.openKey("HKCU\\Software");
  throw new Error("expected RegistryError from a denied registry backend");
} catch (error) {
  if (!(error instanceof RegistryError)) throw error;
  if (!error.message.includes("not supported on this platform or runtime")) {
    throw new Error(
      `denied probe did not leave the default throwing backend: ${error.message}`,
    );
  }
}

console.log("win-registry denial ok: unavailable without --allow-ffi");
