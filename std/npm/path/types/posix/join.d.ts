/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@neotales/path/posix/join";
 * import { equal } from "node:assert/strict";
 *
 * const path = join("/foo", "bar", "baz/asdf", "quux", "..");
 * equal(path, "/foo/bar/baz/asdf");
 * ```
 *
 * @example Working with URLs
 * ```ts
 * import { join } from "@neotales/path/posix/join";
 * import { equal } from "node:assert/strict";
 *
 * const url = new URL("https://deno.land");
 * url.pathname = join("std", "path", "mod.ts");
 * equal(url.href, "https://deno.land/std/path/mod.ts");
 *
 * url.pathname = join("//std", "path/", "/mod.ts");
 * equal(url.href, "https://deno.land/std/path/mod.ts");
 * ```
 *
 * @param paths The paths to join.
 * @returns The joined path.
 */
export declare function join(path?: URL | string, ...paths: string[]): string;
