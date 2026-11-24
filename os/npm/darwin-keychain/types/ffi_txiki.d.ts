/**
 * txiki.js FFI backend for macOS Keychain.
 *
 * Loads Security.framework and CoreFoundation through `tjs:ffi`. The specifier
 * is imported through a variable so bundlers and other runtimes never resolve
 * it statically. The libraries also load lazily on the first backend call.
 *
 * @module
 * @internal
 */
import "./_dnt.polyfills.js";
import type { DarwinKeychainBackend } from "./types.js";
/**
 * Eagerly opens Security.framework and CoreFoundation through `tjs:ffi`.
 *
 * @throws {Error} If a framework cannot be loaded.
 */
export declare const open: () => void;
/**
 * Reports whether the backend currently holds opened frameworks.
 *
 * @returns `true` after a successful {@link open} or lazy load and before {@link close}.
 */
export declare const isOpened: () => boolean;
/**
 * Unloads both frameworks so a later {@link open} starts from a clean state.
 */
export declare const close: () => void;
/**
 * The txiki.js implementation of the {@link DarwinKeychainBackend} contract,
 * backed by Security.framework. The frameworks open lazily on the first call.
 */
export declare const backend: DarwinKeychainBackend;
