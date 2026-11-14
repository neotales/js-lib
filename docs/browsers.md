# browsers

Browsers should load `chars` and `slices`; see their [module README tables](../std/jsr/chars/README.md) and [slices](../std/jsr/slices/README.md).

Bundle as ESM and import with `<script type="module">`. No syntax rewrite is applied.

```html
<script type="module">
  import { isSpace } from "./chars.mjs";
  console.log(isSpace(32));
</script>
```

`is-elevated` can be imported with `ffi_*.ts` left out of the bundle, but that is not support: `isElevatedAvailable()` is false and `isElevated()` throws.

## Test lanes

`bun run test:chromium` uses a Chromium on `PATH`. Firefox and WebKit are separate lanes and use the browser builds of the Playwright version pinned in `package.json` and `pnpm-lock.yaml`; a host Firefox or WebKit is not used.

```sh
pnpm install
pnpm exec playwright install firefox webkit
bun run test:firefox -- std/chars std/slices
bun run test:webkit -- std/chars std/slices
```

On Linux, install the system libraries too: `pnpm exec playwright install --with-deps firefox webkit`.

The lanes reuse the ESM bundle that the Chromium lane loads. They wait for the page to mark the suite complete, so a suite that finishes after a top-level `await` is not read early. A missing Playwright package or browser prints `not run <lane>` and exits non-zero. An assertion failure, an uncaught error, or a timeout fails the lane.

`PLAB_TEST_BROWSER_TIMEOUT` sets the Playwright launch, navigation and suite-wait timeout in milliseconds (default 20000). Cleanup uses normal `browser.close()` and cleanup errors fail the lane. A browser or driver that hangs during local cleanup can require manual cleanup; the timeout does not guarantee process containment. CI runs each browser in a separate ephemeral GitHub-hosted Linux job with a job timeout.
