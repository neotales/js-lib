/** Returns whether a path value is a URL when the host provides the URL API. */
export function isUrl(value: string | URL): value is URL {
  return typeof URL !== "undefined" && value instanceof URL;
}
