/**
 * Return the extension of the `path` with leading period.
 *
 * @example Usage
 * ```ts
 * import { extname } from "@neotales/path/posix/extname";
 * import { equal } from "node:assert/strict";
 *
 * equal(extname("/home/user/Documents/file.ts"), ".ts");
 * equal(extname("/home/user/Documents/"), "");
 * equal(extname("/home/user/Documents/image.png"), ".png");
 * ```
 *
 * @example Working with URLs
 *
 * Note: This function doesn't automatically strip hash and query parts from
 * URLs. If your URL contains a hash or query, remove them before passing the
 * URL to the function. This can be done by passing the URL to `new URL(url)`,
 * and setting the `hash` and `search` properties to empty strings.
 *
 * ```ts
 * import { extname } from "@neotales/path/posix/extname";
 * import { equal } from "node:assert/strict";
 *
 * equal(extname("https://deno.land/std/path/mod.ts"), ".ts");
 * equal(extname("https://deno.land/std/path/mod.ts?a=b"), ".ts?a=b");
 * equal(extname("https://deno.land/std/path/mod.ts#header"), ".ts#header");
 * ```
 *
 * @param path The path to get the extension from.
 * @returns The extension (ex. for `file.ts` returns `.ts`).
 */
export declare function extname(path: string | URL): string;
