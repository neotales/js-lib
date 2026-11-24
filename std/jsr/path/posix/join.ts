// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { assertPath } from "../_common/assert_path.ts";
import { isUrl } from "../_is_url.ts";
import { normalize } from "./normalize.ts";
import { fromFileUrl } from "./from_file_url.ts";

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
export function join(path?: URL | string, ...paths: string[]): string {
  if (path === undefined) return ".";
  if (isUrl(path)) {
    path = fromFileUrl(path);
  }
  paths = path ? [path, ...paths] : paths;
  paths.forEach((value) => assertPath(value));
  const joined = paths.filter((value) => value.length > 0).join("/");
  return joined === "" ? "." : normalize(joined);
}
