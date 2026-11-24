/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 *
 * @example Usage
 * ```ts
 * import { normalize } from "@neotales/path/posix/normalize";
 * import { equal } from "node:assert/strict";
 *
 * const path = normalize("/foo/bar//baz/asdf/quux/..");
 * equal(path, "/foo/bar/baz/asdf");
 * ```
 *
 * @example Working with URLs
 *
 * Note: This function will remove the double slashes from a URL's scheme.
 * Hence, do not pass a full URL to this function. Instead, pass the pathname of
 * the URL.
 *
 * ```ts
 * import { normalize } from "@neotales/path/posix/normalize";
 * import { equal } from "node:assert/strict";
 *
 * const url = new URL("https://deno.land");
 * url.pathname = normalize("//std//assert//.//mod.ts");
 * equal(url.href, "https://deno.land/std/assert/mod.ts");
 *
 * url.pathname = normalize("std/assert/../async/retry.ts");
 * equal(url.href, "https://deno.land/std/async/retry.ts");
 * ```
 *
 * @param path The path to normalize.
 * @returns The normalized path.
 */
export declare function normalize(path: string | URL): string;
