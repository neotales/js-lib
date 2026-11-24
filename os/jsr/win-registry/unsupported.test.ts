import { ok } from "@neotales/assert";
import { test } from "@neotales/test";
import {
  isRegistryAvailable,
  Registry,
  RegistryError,
} from "@neotales/win-registry";

function expectUnsupported(name: string, fn: () => unknown): void {
  try {
    fn();
  } catch (error) {
    if (error instanceof RegistryError) return;
    throw new Error(`${name} threw ${String(error)} instead of RegistryError`);
  }
  throw new Error(`${name} did not throw RegistryError`);
}

test("default registry backend throws for every operation when unsupported", (t) => {
  if (isRegistryAvailable()) {
    t.skip("a registry backend is available on this host");
  }

  const operations: Array<[string, () => unknown]> = [
    ["Registry.openKey", () => Registry.openKey("HKCU\\Software")],
    ["Registry.createKey", () => Registry.createKey("HKCU\\Software\\MyApp")],
    ["Registry.deleteKey", () => Registry.deleteKey("HKCU\\Software\\MyApp")],
    ["HKCU.openKey", () => Registry.HKCU.openKey("Software")],
    ["HKLM.createKey", () => Registry.HKLM.createKey("SOFTWARE\\MyApp")],
    ["HKU.deleteKey", () => Registry.HKU.deleteKey("S-1-5-21")],
    ["HKPD.deleteValue", () => Registry.HKPD.deleteValue("S-1-5-21", "Theme")],
    ["HKCC.getSubKeyNames", () => Registry.HKCC.getSubKeyNames()],
    ["HKCR.getValueNames", () => Registry.HKCR.getValueNames()],
  ];
  for (const [name, operation] of operations) {
    expectUnsupported(name, operation);
  }

  const key = Registry.HKCU;
  const keyOperations: Array<[string, () => unknown]> = [
    ["key.unwrap", () => key.unwrap()],
    ["key.close", () => key.close()],
    ["key[Symbol.dispose]", () => key[Symbol.dispose]()],
    ["key.openKey", () => key.openKey("Software")],
    ["key.createKey", () => key.createKey("Software\\MyApp")],
    ["key.deleteKey", () => key.deleteKey("Software\\MyApp")],
    ["key.deleteValue", () => key.deleteValue("Theme")],
    ["key.getSubKeyNames", () => key.getSubKeyNames()],
    ["key.getValueNames", () => key.getValueNames()],
    ["key.getValue", () => key.getValue("Theme")],
    ["key.getString", () => key.getString("Theme")],
    ["key.getMultiString", () => key.getMultiString("Recent")],
    ["key.getInt32", () => key.getInt32("Count")],
    ["key.getInt64", () => key.getInt64("Timestamp")],
    ["key.getBinary", () => key.getBinary("State")],
    ["key.setValue", () => key.setValue("Theme", new Uint8Array([1]), 1)],
    ["key.setMultiString", () => key.setMultiString("Recent", ["a"])],
    ["key.setBinary", () => key.setBinary("State", new Uint8Array([1]))],
    ["key.setString", () => key.setString("Theme", "dark")],
    ["key.setExpandString", () => key.setExpandString("Logs", "%USERPROFILE%\\logs")],
    ["key.setInt32", () => key.setInt32("Count", 1)],
    ["key.setInt64", () => key.setInt64("Timestamp", 1n)],
    ["key.stat", () => key.stat()],
  ];
  for (const [name, operation] of keyOperations) {
    expectUnsupported(name, operation);
  }
});
