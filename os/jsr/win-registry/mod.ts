/**
 * Windows Registry helpers.
 *
 * @example Usage
 * ```ts
 * import { Registry } from "@neotales/win-registry";
 *
 * const key = Registry.createKey("HKCU\\Software\\MyApp");
 * key.setString("Theme", "dark");
 * ```
 *
 * @module
 */

export { isRegistryAvailable, Registry, RegistryError, RegistryKey } from "./registry.ts";
export { EXECUTE, type Key, type KeyInfo, type RegistryBackend, Rights, Types } from "./types.ts";
export {
  HKEY_CLASSES_ROOT,
  HKEY_CURRENT_CONFIG,
  HKEY_CURRENT_USER,
  HKEY_LOCAL_MACHINE,
  HKEY_PERFORMANCE_DATA,
  HKEY_USERS,
} from "./types.ts";
