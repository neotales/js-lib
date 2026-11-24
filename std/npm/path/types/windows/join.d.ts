/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@neotales/path/windows/join";
 * import { equal } from "node:assert/strict";
 *
 * const joined = join("C:\\foo", "bar", "baz\\..");
 * equal(joined, "C:\\foo\\bar");
 * ```
 *
 * @param paths The paths to join.
 * @returns The joined path.
 */
export declare function join(path?: URL | string, ...paths: string[]): string;
