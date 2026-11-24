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
import "./_dnt.polyfills.js";
export { isRegistryAvailable, Registry, RegistryError, RegistryKey } from "./registry.js";
export { EXECUTE, Rights, Types } from "./types.js";
export { HKEY_CLASSES_ROOT, HKEY_CURRENT_CONFIG, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, HKEY_PERFORMANCE_DATA, HKEY_USERS, } from "./types.js";
