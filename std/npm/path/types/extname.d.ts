/**
 * Return the extension of the path with leading period (".").
 *
 * @example Usage
 * ```ts
 * import { extname } from "@neotales/path/extname";
 * import { equal } from "node:assert/strict";
 *
 * if (Deno.build.os === "windows") {
 *   equal(extname("C:\\home\\user\\Documents\\image.png"), ".png");
 * } else {
 *   equal(extname("/home/user/Documents/image.png"), ".png");
 * }
 * ```
 *
 * @param path Path with extension.
 * @returns The file extension. E.g. returns `.ts` for `file.ts`.
 */
export declare function extname(path: string | URL): string;
