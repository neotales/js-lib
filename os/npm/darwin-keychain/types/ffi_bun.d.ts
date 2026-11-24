/** Bun FFI backend for macOS Keychain. */
import "./_dnt.polyfills.js";
import type { DarwinKeychainBackend } from "./types.js";
/** Raw generic-password operations implemented through Bun FFI. */
export declare const backend: DarwinKeychainBackend;
