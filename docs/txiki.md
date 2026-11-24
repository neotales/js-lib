# txiki.js

txiki.js should load [chars](../std/jsr/chars/README.md), [slices](../std/jsr/slices/README.md), [strings](../std/jsr/strings/README.md), [args](../std/jsr/args/README.md), [env](../std/jsr/env/README.md), [dotenv](../std/jsr/dotenv/README.md), and [path](../std/jsr/path/README.md), plus [is-elevated](../os/jsr/is-elevated/README.md), [win-registry](../os/jsr/win-registry/README.md), [win-cred](../os/jsr/win-cred/README.md), [darwin-keychain](../os/jsr/darwin-keychain/README.md), and [linux-libsecret](../os/jsr/linux-libsecret/README.md); see each module README for its support table. The OS modules use `tjs:ffi`; `win-cred` and `win-registry` are Windows-only, `darwin-keychain` is macOS-only, and `linux-libsecret` has no published Linux txiki.js binary; the Linux CI lane clones tag `v26.11.0`, builds it with CMake, and runs the suite. A local source build loaded the real libsecret and GIO backends and passed.

`eng/scripts/build-txiki.sh` prints exactly one line on stdout: the absolute path to the built `tjs`. Clone, submodule, CMake configure, and CMake build output go to stderr, so the CI step can capture the value into `GITHUB_ENV` without parsing it. A second run with an executable binary already at the versioned temporary root is a no-op. `eng/scripts/build-txiki.test.mjs` proves the contract against fake commands, including every failure path, without a clone or a build.

There is no registry install here. Bundle as ESM and run it with `tjs run`. There is no Linux binary; support is still claimed, and binaries are available for macOS and Windows. The `is-elevated` and `win-registry` Windows backends use `tjs:ffi`. The `win-registry` binding table is covered by mock tests on every lane; native registry calls require a Windows host.

Windows CI runs the disposable win-registry write test with `WIN_REGISTRY_WRITE_TESTS=1` and `REQUIRE_WIN_REGISTRY_FFI=1`. It creates only a newly-created unique `HKCU\Software` key and deletes it. Local runs without both variables write nothing. The Windows win-cred leg reads only a randomly named missing target; the macOS darwin-keychain leg opens the real frameworks and reports availability without touching a keychain item.

```sh
bun build ../std/jsr/chars/mod.ts --target=browser --format=esm --outfile=chars.mjs
tjs run chars.mjs
```
