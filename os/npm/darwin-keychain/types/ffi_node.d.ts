/** Node.js FFI backend for macOS Keychain. */
import "./_dnt.polyfills.js";
import type { DarwinKeychainBackend } from "./types.js";
/** Raw generic-password operations implemented through Node.js FFI. */
export declare const backend: DarwinKeychainBackend;
