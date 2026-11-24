import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import * as args from "./mod.ts";

test("args::mod exports the public API", () => {
  equal(Object.keys(args).sort(), [
    "SplatSymbols",
    "join",
    "parse",
    "splat",
    "split",
    "unixJoin",
    "windowsJoin",
  ]);
});
