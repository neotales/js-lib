#!/usr/bin/env bash
# Build the pinned txiki.js release for the Linux lane. GitHub publishes macOS
# and Windows binaries only, so Linux builds from the tagged source. The
# generated JS bundles are checked in, so no esbuild/pnpm step is needed.
#
# Contract: stdout is exactly one line, the absolute path to the built `tjs`
# binary. Clone, submodule, configure, and build output all go to stderr, so a
# caller can capture stdout into GITHUB_ENV or a variable without parsing it.
# Re-running with an executable binary already present is a no-op.
set -euo pipefail

version="26.11.0"
root="${TMPDIR:-/tmp}/neotales-txiki-${version}"
source_dir="$root/source"
build_dir="$root/build"
bin="$build_dir/tjs"

fail() {
  printf 'build-txiki: %s\n' "$1" >&2
  exit 1
}

# A GitHub env file is line-oriented, and a PATH entry is colon-separated. A
# temporary path carrying either cannot be exported or prepended safely, so
# reject it here instead of letting a later write produce an invalid file or a
# split PATH entry. The path must also be absolute because the caller runs from
# a different directory than the one that receives it.
case "$root" in
  *$'\n'* | *$'\r'*) fail "temporary path contains a newline or carriage return" ;;
esac
case "$root" in
  *:*) fail "temporary path contains a colon, which cannot be a PATH entry" ;;
esac
[[ "$root" == /* ]] || fail "temporary path is not absolute: $root"

# Keep the caller's stdout for the one line we publish, and send everything
# else, including every command below, to stderr. This is stronger than
# redirecting each command: a future clone, submodule, or CMake invocation
# cannot leak into the captured value by forgetting a redirection.
exec 3>&1
exec 1>&2

if [[ ! -x "$bin" ]]; then
  rm -rf "$source_dir" "$build_dir"
  mkdir -p "$root"
  git clone --depth 1 --branch "v${version}" https://github.com/saghul/txiki.js "$source_dir"
  git -C "$source_dir" submodule update --init --recursive
  cmake -S "$source_dir" -B "$build_dir" \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_WITH_MIMALLOC=OFF
  cmake --build "$build_dir" -j "${JOBS:-$(nproc)}"
fi

[[ "$bin" == /* ]] || fail "binary path is not absolute: $bin"
[[ -f "$bin" ]] || fail "build did not produce a regular file: $bin"
[[ -x "$bin" ]] || fail "build produced a file that is not executable: $bin"

# Prove the binary runs before handing its path to a caller that will only add
# its directory to PATH. A broken prebuilt binary fails here rather than as a
# missing command in every test lane.
"$bin" --version

printf '%s\n' "$bin" >&3
