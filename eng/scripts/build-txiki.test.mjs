// The Linux txiki.js build runs inside a GitHub Actions step that captures
// stdout with `TXIKI_BIN="$(eng/scripts/build-txiki.sh)"` and writes the value
// to GITHUB_ENV. `git submodule update` prints checkout status lines on stdout,
// which made that env file invalid. The script now keeps every build line on
// stderr and prints one absolute binary path. These tests run the real script
// against fake git/cmake/tjs commands: no clone, build, or network.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "build-txiki.sh");
const version = "26.11.0";
const skip = process.platform === "win32" ? "requires a POSIX shell" : false;

function writeExecutable(path, lines) {
  writeFileSync(
    path,
    `#!/usr/bin/env bash\nset -euo pipefail\n${lines.join("\n")}\n`,
  );
  chmodSync(path, 0o755);
}

function fakeGit(path) {
  // The first two lines are the real submodule output that broke GITHUB_ENV.
  writeExecutable(path, [
    `printf '%s\\n' "Submodule 'deps/libuv' (https://github.com/libuv/libuv) registered for path 'deps/libuv'"`,
    `printf '%s\\n' "Submodule path 'deps/libuv': checked out 'dd9f081cc55a4d83e2a976848d074f28ee5f34eb'"`,
    `printf '%s\\n' "fake git stdout"`,
    `printf '%s\\n' "fake git stderr" >&2`,
    `if [[ "$1" == "clone" ]]; then last=""; for arg in "$@"; do last="$arg"; done; mkdir -p "$last"; fi`,
  ]);
}

function fakeCmake(path) {
  writeExecutable(path, [
    `out=""`,
    `prev=""`,
    `for arg in "$@"; do`,
    `  if [[ "$prev" == "-B" ]]; then out="$arg"; fi`,
    `  prev="$arg"`,
    `done`,
    `if [[ "$1" == "--build" ]]; then`,
    `  out="$2"`,
    `  printf '%s\\n' "fake cmake build stdout"`,
    `  printf '%s\\n' "fake cmake build stderr" >&2`,
    `  case "\${FAKE_TXIKI_BUILD:-ok}" in`,
    `    ok) printf '%s\\n' '#!/usr/bin/env bash' 'printf "tjs %s\\n" "26.11.0"' > "$out/tjs"; chmod 0755 "$out/tjs" ;;`,
    `    fail) exit 7 ;;`,
    `    missing) ;;`,
    `    notexec) printf '%s\\n' '#!/usr/bin/env bash' 'exit 0' > "$out/tjs"; chmod 0644 "$out/tjs" ;;`,
    `    badversion) printf '%s\\n' '#!/usr/bin/env bash' 'printf "%s\\n" "boom" >&2' 'exit 3' > "$out/tjs"; chmod 0755 "$out/tjs" ;;`,
    `    directory) mkdir -p "$out/tjs" ;;`,
    `    *) printf '%s\\n' "unknown FAKE_TXIKI_BUILD: \${FAKE_TXIKI_BUILD}" >&2; exit 2 ;;`,
    `  esac`,
    `else`,
    `  mkdir -p "$out"`,
    `  printf '%s\\n' "fake cmake configure stdout"`,
    `  printf '%s\\n' "fake cmake configure stderr" >&2`,
    `fi`,
  ]);
}

function makeFixture(t) {
  const root = mkdtempSync(join(tmpdir(), "txiki-build-test-"));
  const fakebin = join(root, "bin");
  const tmp = join(root, "tmp");
  mkdirSync(fakebin);
  mkdirSync(tmp);
  fakeGit(join(fakebin, "git"));
  fakeCmake(join(fakebin, "cmake"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return {
    root,
    fakebin,
    tmp,
    expected: join(tmp, `neotales-txiki-${version}`, "build", "tjs"),
    run(extraEnv = {}) {
      return spawnSync("bash", [script], {
        encoding: "utf8",
        env: {
          ...process.env,
          TMPDIR: tmp,
          PATH: `${fakebin}:${process.env.PATH ?? ""}`,
          JOBS: "1",
          ...extraEnv,
        },
      });
    },
  };
}

test(
  "stdout is only the absolute binary path even with noisy submodule output",
  { skip },
  (t) => {
    const fixture = makeFixture(t);
    const result = fixture.run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, `${fixture.expected}\n`);
    assert.equal(
      result.stdout.trimEnd().split("\n").length,
      1,
      "stdout must be one line",
    );
    assert.doesNotMatch(
      result.stdout,
      /\r/,
      "stdout must not contain a carriage return",
    );
    assert.match(
      result.stdout,
      /^\/.*\/tjs\n$/,
      "stdout must be an absolute tjs path",
    );

    assert.match(
      result.stderr,
      /Submodule path 'deps\/libuv': checked out 'dd9f081c/,
    );
    assert.match(result.stderr, /fake git stdout/);
    assert.match(result.stderr, /fake cmake configure stdout/);
    assert.match(result.stderr, /fake cmake build stdout/);
    assert.match(result.stderr, /tjs 26\.11\.0/);
    assert.ok(existsSync(fixture.expected));
  },
);

test("the captured line is a valid GITHUB_ENV entry", { skip }, (t) => {
  const fixture = makeFixture(t);
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);

  const value = result.stdout.trimEnd();
  const envFile = join(fixture.root, "github_env");
  writeFileSync(envFile, `TXIKI_BIN=${value}\n`);
  const contents = readFileSync(envFile, "utf8");

  assert.equal(contents, `TXIKI_BIN=${fixture.expected}\n`);
  assert.equal(
    contents.split("\n").length,
    2,
    "one entry and the trailing newline",
  );
  assert.doesNotMatch(
    contents,
    /\r|\n\S/,
    "no embedded newline or second entry",
  );
});

test(
  "a temporary path with spaces still produces one valid env line",
  { skip },
  (t) => {
    const fixture = makeFixture(t);
    const spaced = join(fixture.root, "tmp with space");
    mkdirSync(spaced);
    const result = fixture.run({ TMPDIR: spaced });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      result.stdout,
      `${join(spaced, `neotales-txiki-${version}`, "build", "tjs")}\n`,
    );
    assert.equal(result.stdout.trimEnd().split("\n").length, 1);
  },
);

test("a second run reuses the binary and invokes neither git nor cmake", {
  skip,
}, (t) => {
  const fixture = makeFixture(t);
  const first = fixture.run();
  assert.equal(first.status, 0, first.stderr);

  writeExecutable(join(fixture.fakebin, "git"), ["exit 99"]);
  writeExecutable(join(fixture.fakebin, "cmake"), ["exit 99"]);
  const second = fixture.run();

  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout, first.stdout);
  assert.doesNotMatch(second.stderr, /fake git/);
  assert.doesNotMatch(second.stderr, /fake cmake/);
  assert.match(second.stderr, /tjs 26\.11\.0/);
});

test("every build failure exits non-zero with empty stdout", { skip }, (t) => {
  for (
    const mode of ["fail", "missing", "notexec", "badversion", "directory"]
  ) {
    const fixture = makeFixture(t);
    const result = fixture.run({ FAKE_TXIKI_BUILD: mode });
    assert.notEqual(result.status, 0, `${mode}: expected a non-zero exit`);
    assert.equal(
      result.stdout,
      "",
      `${mode}: a failed build must not print a path`,
    );
    assert.ok(
      result.stderr.length > 0,
      `${mode}: expected a diagnostic on stderr`,
    );
  }
});

test("rejects a temporary path that cannot become a GITHUB_ENV or PATH entry", {
  skip,
}, (t) => {
  const fixture = makeFixture(t);
  const cases = [
    ["newline", join(fixture.root, "tmp\nline"), /newline or carriage return/],
    [
      "carriage return",
      join(fixture.root, "tmp\rline"),
      /newline or carriage return/,
    ],
    ["colon", join(fixture.root, "tmp:line"), /contains a colon/],
  ];
  for (const [label, tmp, diagnostic] of cases) {
    mkdirSync(tmp);
    const result = fixture.run({ TMPDIR: tmp });
    assert.notEqual(result.status, 0, `${label}: expected a non-zero exit`);
    assert.equal(
      result.stdout,
      "",
      `${label}: an unsafe path must not print a path`,
    );
    assert.match(result.stderr, diagnostic, `${label}: missing diagnostic`);
  }

  const relative = fixture.run({ TMPDIR: "relative-tmp" });
  assert.notEqual(relative.status, 0);
  assert.equal(relative.stdout, "");
  assert.match(relative.stderr, /is not absolute/);
});
