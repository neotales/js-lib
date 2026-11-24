/**
 * Return the directory path of a `path`.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@neotales/path/posix/dirname";
 * import { equal } from "node:assert/strict";
 *
 * equal(dirname("/home/user/Documents/"), "/home/user");
 * equal(dirname("/home/user/Documents/image.png"), "/home/user/Documents");
 * equal(dirname("https://deno.land/std/path/mod.ts"), "https://deno.land/std/path");
 * ```
 *
 * @example Working with URLs
 *
 * ```ts
 * import { dirname } from "@neotales/path/posix/dirname";
 * import { equal } from "node:assert/strict";
 *
 * equal(dirname("https://deno.land/std/path/mod.ts"), "https://deno.land/std/path");
 * equal(dirname("https://deno.land/std/path/mod.ts?a=b"), "https://deno.land/std/path");
 * equal(dirname("https://deno.land/std/path/mod.ts#header"), "https://deno.land/std/path");
 * ```
 *
 * @param path The path to get the directory from.
 * @returns The directory path.
 */
export declare function dirname(path: string | URL): string;
