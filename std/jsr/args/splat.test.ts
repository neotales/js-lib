import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { splat, type SplatOptions, SplatSymbols } from "./splat.ts";
const getGlobal = (path: string): unknown => {
  try {
    return path
      .split(".")
      .reduce<unknown>(
        (value, key) =>
          value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined,
        globalThis,
      );
  } catch {
    // Reading process.env needs a permission on Deno and Ende.
    return undefined;
  }
};

const DEBUG = getGlobal("process.env.DEBUG") === "true";

test("args::splat", () => {
  const args = splat({
    version: true,
    splat: {
      prefix: "--",
    } as SplatOptions,
  });

  equal(args.length, 1);
  equal(args[0], "--version");
});

test("args::splat with assign", () => {
  const args = splat({
    foo: "bar",
    splat: {
      assign: "=",
    } as SplatOptions,
  });

  equal(args.length, 1);
  equal(args[0], "--foo=bar");
});

test("args::splat with preserveCase", () => {
  const args = splat({
    fooBar: "baz",
    splat: {
      preserveCase: true,
    } as SplatOptions,
  });

  equal(args.length, 2);
  equal(args[0], "--fooBar");
  equal(args[1], "baz");
});

test("args::splat with shortFlag", () => {
  const args = splat({
    f: "bar",
    splat: {
      shortFlag: true,
    } as SplatOptions,
  });

  equal(args.length, 2);
  equal(args[0], "-f");
  equal(args[1], "bar");
});

test("args::splat with shortFlag and prefix", () => {
  const args = splat({
    f: "bar",
    splat: {
      shortFlag: true,
    } as SplatOptions,
  });

  equal(args.length, 2);
  equal(args[0], "-f");
  equal(args[1], "bar");
});

test("args::splat with boolean short flag", () => {
  const args = splat({
    f: true,
    splat: {
      shortFlag: true,
    } as SplatOptions,
  });

  equal(args.length, 1);
  equal(args[0], "-f");
});

test("args::splat with command array", () => {
  const args = splat({
    foo: "bar",
    splat: {
      command: ["git", "clone"],
    } as SplatOptions,
  });

  if (DEBUG) {
    console.log(args);
  }

  equal(args.length, 4);
  equal(args[0], "git");
  equal(args[1], "clone");
  equal(args[2], "--foo");
  equal(args[3], "bar");
});

test("args::splat with command string", () => {
  const args = splat({
    foo: "bar",
    splat: {
      command: "git clone",
    } as SplatOptions,
  });

  if (DEBUG) {
    console.log(args);
  }

  equal(args.length, 4);
  equal(args[0], "git");
  equal(args[1], "clone");
  equal(args[2], "--foo");
  equal(args[3], "bar");
});

test("args::splat with command symbol string", () => {
  const args = splat({
    foo: "bar",
    [SplatSymbols.command]: "git clone",
  });

  if (DEBUG) {
    console.log(args);
  }

  equal(args.length, 4);
  equal(args[0], "git");
  equal(args[1], "clone");
  equal(args[2], "--foo");
  equal(args[3], "bar");
});

test("args::splat with command symbol array", () => {
  const args = splat({
    foo: "bar",
    [SplatSymbols.command]: ["git", "clone"],
  });

  if (DEBUG) {
    console.log(args);
  }

  equal(args.length, 4);
  equal(args[0], "git");
  equal(args[1], "clone");
  equal(args[2], "--foo");
  equal(args[3], "bar");
});

test("args::splat with arguments", () => {
  const args = splat({
    foo: "bar",
    splat: {
      argumentNames: ["foo"],
    } as SplatOptions,
  });

  equal(args.length, 1);
  equal(args[0], "bar");
});

test("args::splat with symbol argument names", () => {
  const args = splat({
    foo: "bar",
    [SplatSymbols.argNames]: ["foo"],
  });

  equal(args.length, 1);
  equal(args[0], "bar");
});

test("args::splat with symbol arguments", () => {
  const args = splat({
    [SplatSymbols.args]: ["foo", "bar"],
    foo: "bar",
  });

  equal(args.length, 4);
  equal(args[0], "foo");
  equal(args[1], "bar");
  equal(args[2], "--foo");
  equal(args[3], "bar");
});

test("args::splat with appended arguments", () => {
  const args = splat({
    foo: "bar",
    test: "baz",
    splat: {
      argumentNames: ["foo"],
      appendArguments: true,
    } as SplatOptions,
  });

  equal(args.length, 3);
  equal(args[0], "--test");
  equal(args[1], "baz");
  equal(args[2], "bar");
});

test("args::splat with symbol appended arguments", () => {
  const args = splat({
    [SplatSymbols.args]: ["bar"],
    test: "baz",
    splat: {
      appendArguments: true,
    } as SplatOptions,
  });

  equal(args.length, 3);
  equal(args[0], "--test");
  equal(args[1], "baz");
  equal(args[2], "bar");
});

test("args::splat with symbol remaining args", () => {
  const args = splat({
    [SplatSymbols.remainingArgs]: ["bar"],
    test: "baz",
  });

  equal(args.length, 3);
  equal(args[0], "--test");
  equal(args[1], "baz");
  equal(args[2], "bar");
});

test("args::splat with remaining args", () => {
  const args = splat({
    ["_"]: ["bar"],
    test: "baz",
  });

  equal(args.length, 3);
  equal(args[0], "--test");
  equal(args[1], "baz");
  equal(args[2], "bar");
});

test("args::splat: noargs", () => {
  const args = splat({
    force: true,
    other: true,
    splat: {
      noargs: ["force"],
    } as SplatOptions,
  });

  equal(args.length, 3);
  equal(args[0], "--force");
  equal(args[1], "true");
  equal(args[2], "--other");
});

test("args::splat: noargsValues", () => {
  const args = splat({
    force: false,
    other: true,
    splat: {
      noargs: ["force"],
      noFlagValues: { t: "1", f: "2" },
    } as SplatOptions,
  });

  equal(args.length, 3);
  equal(args[0], "--force");
  equal(args[1], "2");
  equal(args[2], "--other");
});

test("args::splat with symbol extra args", () => {
  const args = splat({
    [SplatSymbols.extraArgs]: ["bar", "--flag"],
    test: "baz",
  });

  equal(args.length, 5);
  equal(args[0], "--test");
  equal(args[1], "baz");
  equal(args[2], "--");
  equal(args[3], "bar");
  equal(args[4], "--flag");
});

test("args::splat with extra args", () => {
  const args = splat({
    ["--"]: ["bar", "--flag"],
    test: "baz",
  });

  equal(args.length, 5);
  equal(args[0], "--test");
  equal(args[1], "baz");
  equal(args[2], "--");
  equal(args[3], "bar");
  equal(args[4], "--flag");
});

test("args::splat with positional args", () => {
  const args = splat({
    "*": ["one", "two"],
    test: "baz",
  });

  equal(args.length, 4);
  equal(args[0], "one");
  equal(args[1], "two");
  equal(args[2], "--test");
  equal(args[3], "baz");
});

// Additional Tests

test("args::splat with false boolean", () => {
  const args = splat({
    verbose: false,
  });

  equal(args.length, 1);
  equal(args[0], "--no-verbose");
});

test("args::splat with ignoreFalse", () => {
  const args = splat({
    verbose: false,
    debug: true,
    splat: {
      ignoreFalse: true,
    } as SplatOptions,
  });

  equal(args.length, 1);
  equal(args[0], "--debug");
});

test("args::splat with ignoreTrue", () => {
  const args = splat({
    verbose: true,
    output: "file.txt",
    splat: {
      ignoreTrue: true,
    } as SplatOptions,
  });

  equal(args.length, 2);
  equal(args[0], "--output");
  equal(args[1], "file.txt");
});

test("args::splat with number value", () => {
  const args = splat({
    count: 42,
    timeout: 1000,
  });

  equal(args.length, 4);
  equal(args[0], "--count");
  equal(args[1], "42");
  equal(args[2], "--timeout");
  equal(args[3], "1000");
});

test("args::splat with bigint value", () => {
  const args = splat({
    id: BigInt(9007199254740991),
  });

  equal(args.length, 2);
  equal(args[0], "--id");
  equal(args[1], "9007199254740991");
});

test("args::splat with array value", () => {
  const args = splat({
    include: ["src", "lib", "test"],
  });

  equal(args.length, 6);
  equal(args[0], "--include");
  equal(args[1], "src");
  equal(args[2], "--include");
  equal(args[3], "lib");
  equal(args[4], "--include");
  equal(args[5], "test");
});

test("args::splat with excludes", () => {
  const args = splat({
    foo: "bar",
    secret: "password",
    debug: true,
    splat: {
      excludes: ["secret"],
    } as SplatOptions,
  });

  equal(args.length, 3);
  equal(args[0], "--foo");
  equal(args[1], "bar");
  equal(args[2], "--debug");
});

test("args::splat with includes", () => {
  const args = splat({
    foo: "bar",
    baz: "qux",
    debug: true,
    splat: {
      includes: ["foo", "debug"],
    } as SplatOptions,
  });

  equal(args.length, 3);
  equal(args[0], "--foo");
  equal(args[1], "bar");
  equal(args[2], "--debug");
});

test("args::splat with regex excludes", () => {
  const args = splat({
    foo: "bar",
    secretKey: "password",
    secretToken: "token123",
    splat: {
      excludes: [/^secret/],
    } as SplatOptions,
  });

  equal(args.length, 2);
  equal(args[0], "--foo");
  equal(args[1], "bar");
});

test("args::splat with aliases", () => {
  const args = splat({
    yes: true,
    output: "file.txt",
    splat: {
      aliases: { yes: "-y", output: "-o" },
    } as SplatOptions,
  });

  equal(args.length, 3);
  equal(args[0], "-y");
  equal(args[1], "-o");
  equal(args[2], "file.txt");
});

test("args::splat dasherizes camelCase keys", () => {
  const args = splat({
    myOption: "value",
    anotherFlag: true,
  });

  equal(args.length, 3);
  equal(args[0], "--my-option");
  equal(args[1], "value");
  equal(args[2], "--another-flag");
});

test("args::splat with custom prefix", () => {
  const args = splat({
    foo: "bar",
    splat: {
      prefix: "/",
    } as SplatOptions,
  });

  equal(args.length, 2);
  equal(args[0], "/foo");
  equal(args[1], "bar");
});

test("args::splat with noargs true for all", () => {
  const args = splat({
    force: true,
    verbose: false,
    splat: {
      noargs: true,
    } as SplatOptions,
  });

  equal(args.length, 4);
  equal(args[0], "--force");
  equal(args[1], "true");
  equal(args[2], "--verbose");
  equal(args[3], "false");
});

// Unicode Tests

test("args::splat with accented characters", () => {
  const args = splat({
    message: "café résumé",
  });

  equal(args.length, 2);
  equal(args[0], "--message");
  equal(args[1], "café résumé");
});

test("args::splat with German umlauts", () => {
  const args = splat({
    name: "Größe",
  });

  equal(args.length, 2);
  equal(args[0], "--name");
  equal(args[1], "Größe");
});

test("args::splat with Greek letters", () => {
  const args = splat({
    text: "αβγδ",
  });

  equal(args.length, 2);
  equal(args[0], "--text");
  equal(args[1], "αβγδ");
});

test("args::splat with Cyrillic letters", () => {
  const args = splat({
    greeting: "привет",
  });

  equal(args.length, 2);
  equal(args[0], "--greeting");
  equal(args[1], "привет");
});

test("args::splat with emoji", () => {
  const args = splat({
    icon: "🎉",
  });

  equal(args.length, 2);
  equal(args[0], "--icon");
  equal(args[1], "🎉");
});

test("args::splat with CJK characters", () => {
  const args = splat({
    title: "你好世界",
  });

  equal(args.length, 2);
  equal(args[0], "--title");
  equal(args[1], "你好世界");
});

// Complex Combination Tests

test("args::splat with all features combined", () => {
  const args = splat({
    [SplatSymbols.command]: "git",
    [SplatSymbols.args]: ["status"],
    verbose: true,
    porcelain: true,
    [SplatSymbols.remainingArgs]: ["--"],
    [SplatSymbols.extraArgs]: ["--help"],
  });

  equal(args[0], "git");
  equal(args[1], "status");
  equal(args.includes("--verbose"), true);
  equal(args.includes("--porcelain"), true);
});

test("args::splat with mixed positional and options", () => {
  const args = splat({
    "*": ["file1.txt", "file2.txt"],
    recursive: true,
    force: true,
    _: ["extra"],
  });

  equal(args[0], "file1.txt");
  equal(args[1], "file2.txt");
  equal(args.includes("--recursive"), true);
  equal(args.includes("--force"), true);
  equal(args[args.length - 1], "extra");
});

test("args::splat with empty object", () => {
  const args = splat({});
  equal(args.length, 0);
});

test("args::splat ignores undefined values", () => {
  const args = splat({
    foo: "bar",
    baz: undefined,
  });

  equal(args.length, 2);
  equal(args[0], "--foo");
  equal(args[1], "bar");
});

test("args::splat ignores null values", () => {
  const args = splat({
    foo: "bar",
    baz: null,
  });

  equal(args.length, 2);
  equal(args[0], "--foo");
  equal(args[1], "bar");
});

test("args::splat with assign and preserveCase", () => {
  const args = splat({
    myOption: "value",
    splat: {
      assign: "=",
      preserveCase: true,
    } as SplatOptions,
  });

  equal(args.length, 1);
  equal(args[0], "--myOption=value");
});

test("args::splat with remaining args string", () => {
  const args = splat({
    _: "single",
    test: "value",
  });

  equal(args.length, 3);
  equal(args[0], "--test");
  equal(args[1], "value");
  equal(args[2], "single");
});

test("args::splat with positional string", () => {
  const args = splat({
    "*": "single-arg",
    test: "value",
  });

  equal(args.length, 3);
  equal(args[0], "single-arg");
  equal(args[1], "--test");
  equal(args[2], "value");
});
