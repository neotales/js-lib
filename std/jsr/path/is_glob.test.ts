// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "@neotales/test";
import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { isGlob } from "./is_glob.ts";

test("path::isGlob()", () => {
  // should be true if valid glob pattern
  ok(isGlob("!foo.js"));
  ok(isGlob("*.js"));
  ok(isGlob("f?o.js"));
  ok(isGlob("!*.js"));
  ok(isGlob("!foo"));
  ok(isGlob("!foo.js"));
  ok(isGlob("**/abc.js"));
  ok(isGlob("abc/*.js"));
  ok(isGlob("@.(?:abc)"));
  ok(isGlob("@.(?!abc)"));

  // should be false if invalid glob pattern
  ok(!isGlob(""));
  ok(!isGlob("~/abc"));
  ok(!isGlob("~/abc"));
  ok(!isGlob("~/(abc)"));
  ok(!isGlob("+~(abc)"));
  ok(!isGlob("."));
  ok(!isGlob("@.(abc)"));
  ok(!isGlob("aa"));
  ok(!isGlob("abc!/def/!ghi.js"));
  ok(!isGlob("abc.js"));
  ok(!isGlob("abc/def/!ghi.js"));
  ok(!isGlob("abc/def/ghi.js"));

  // Should be true if path has regex capture group
  ok(isGlob("abc/(?!foo).js"));
  ok(isGlob("abc/(?:foo).js"));
  ok(isGlob("abc/(?=foo).js"));
  ok(isGlob("abc/(a|b).js"));
  ok(isGlob("abc/(a|b|c).js"));
  ok(isGlob("abc/(foo bar)/*.js"));

  // Should be false if the path has parens but is not a valid capture group
  ok(!isGlob("abc/(a b c).js"));
  ok(!isGlob("abc/(ab).js"));
  ok(!isGlob("abc/(abc).js"));
  ok(!isGlob("abc/(foo bar).js"));

  // should be false if the capture group is imbalanced
  ok(!isGlob("abc/(ab.js"));
  ok(!isGlob("abc/(a|b.js"));
  ok(!isGlob("abc/(a|b|c.js"));

  // should be true if the path has a regex character class
  ok(isGlob("abc/[abc].js"));
  ok(isGlob("abc/[^abc].js"));
  ok(isGlob("abc/[1-3].js"));

  // should be false if the character class is not balanced
  ok(!isGlob("abc/[abc.js"));
  ok(!isGlob("abc/[^abc.js"));
  ok(!isGlob("abc/[1-3.js"));

  // should be false if the character class is escaped
  ok(!isGlob("abc/\\[abc].js"));
  ok(!isGlob("abc/\\[^abc].js"));
  ok(!isGlob("abc/\\[1-3].js"));

  // should be true if the path has brace characters
  ok(isGlob("abc/{a,b}.js"));
  ok(isGlob("abc/{a}.js"));
  ok(isGlob("abc/@(a).js"));
  ok(isGlob("abc/@(a|b).js"));
  ok(isGlob("abc/{a..z}.js"));
  ok(isGlob("abc/{a..z..2}.js"));

  // should be false if (basic) braces are not balanced
  ok(!isGlob("abc/\\{a,b}.js"));
  ok(!isGlob("abc/\\{a..z}.js"));
  ok(!isGlob("abc/\\{a..z..2}.js"));

  // should be true if the path has regex characters
  ok(isGlob("!&(abc)"));
  ok(isGlob("!*.js"));
  ok(isGlob("!foo"));
  ok(isGlob("!foo.js"));
  ok(isGlob("**/abc.js"));
  ok(isGlob("*.js"));
  ok(isGlob("*z(abc)"));
  ok(isGlob("[1-10].js"));
  ok(isGlob("[^abc].js"));
  ok(isGlob("[a-j]*[^c]b/c"));
  ok(isGlob("[abc].js"));
  ok(isGlob("a/b/c/[a-z].js"));
  ok(isGlob("abc/(aaa|bbb).js"));
  ok(isGlob("abc/*.js"));
  ok(isGlob("abc/{a,b}.js"));
  ok(isGlob("abc/{a..z..2}.js"));
  ok(isGlob("abc/{a..z}.js"));

  ok(!isGlob("$(abc)"));
  ok(!isGlob("&(abc)"));

  // should be false if regex characters are escaped
  ok(!isGlob("\\?.js"));
  ok(!isGlob("\\[1-10\\].js"));
  ok(!isGlob("\\[^abc\\].js"));
  ok(!isGlob("\\[a-j\\]\\*\\[^c\\]b/c"));
  ok(!isGlob("\\[abc\\].js"));
  ok(!isGlob("\\a/b/c/\\[a-z\\].js"));
  ok(!isGlob("abc/\\(aaa|bbb).js"));
  ok(!isGlob("abc/\\?.js"));
});

test("path::isGlob() handles large malformed patterns", (t) => {
  if (
    (globalThis as { __NEOTALES_LANE__?: string }).__NEOTALES_LANE__ === "jerry"
  ) {
    t.skip("JerryScript aborts on a million-character pattern");
  }
  equal(
    ["[", "{", "("].map((character) => isGlob(character.repeat(1_000_000) + "x")),
    [false, false, false],
  );
});
