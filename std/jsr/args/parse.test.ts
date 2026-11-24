import { deepStrictEqual as equal, strictEqual } from "@neotales/assert";
import { test } from "@neotales/test";
import { parse } from "./parse.ts";

test("args::parse parses options and positionals", () => {
  equal(parse(["--name", "neo", "--count=2", "-v", "input.txt"], { boolean: ["v"] }), {
    _: ["input.txt"],
    count: 2,
    name: "neo",
    v: true,
  });
});

test("args::parse supports aliases and defaults", () => {
  equal(parse(["-n", "neo"], { alias: { name: "n" }, default: { color: "blue" } }), {
    _: [],
    color: "blue",
    n: "neo",
    name: "neo",
  });
});

test("args::parse supports booleans, no flags, and repeated values", () => {
  equal(parse(["--watch", "--no-color", "--tag", "a", "--tag", "b"], { boolean: ["watch"] }), {
    _: [],
    color: false,
    tag: ["a", "b"],
    watch: true,
  });
});

test("args::parse preserves strings and stores the -- tail", () => {
  equal(parse(["--id", "001", "--", "--not-parsed"], { "--": true, string: ["id"] }), {
    "--": ["--not-parsed"],
    _: [],
    id: "001",
  });
});

test("args::parse defaults to current runtime args", () => {
  strictEqual(Array.isArray(parse()._), true);
});
