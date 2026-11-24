import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import * as dotenv from "./mod.ts";

test("dotenv::mod exports the public API", () => {
  equal(Object.keys(dotenv).sort(), [
    "DotEnvDocument",
    "expand",
    "load",
    "parse",
    "parseDocument",
    "stringify",
    "stringifyDocument",
  ]);
});
