/** Returns whether a path value is a URL when the host provides the URL API. */
export function isUrl(value) {
    return typeof URL !== "undefined" && value instanceof URL;
}
