import { deepStrictEqual as equal, ok } from "@neotales/assert";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "@neotales/test";
import { type GlobOptions, globToRegExp } from "./glob_to_regexp.ts";
import { globToRegExp as posixGlobToRegExp } from "./posix/glob_to_regexp.ts";
import { globToRegExp as windowsGlobToRegExp } from "./windows/glob_to_regexp.ts";

function posixMatch(glob: string, path: string, options?: GlobOptions) {
  const result = path.match(posixGlobToRegExp(glob, options));
  if (result) {
    equal(result.length, 1);
  }
  return !!result;
}

function windowsMatch(glob: string, path: string, options?: GlobOptions) {
  const result = path.match(windowsGlobToRegExp(glob, options));
  if (result) {
    equal(result.length, 1);
  }
  return !!result;
}

function match(glob: string, path: string, options?: GlobOptions) {
  return posixMatch(glob, path, options) && windowsMatch(glob, path, options);
}

function equalRegExp(actual: RegExp, expected: RegExp) {
  equal(actual.source, expected.source);
  equal(actual.flags, expected.flags);
}

test("path::globToRegExp() returns RegExp from a glob", () => {
  equalRegExp(posixGlobToRegExp("*.js"), /^[^/]*\.js\/*$/);
});

test("path::globToRegExp() returns RegExp from an empty glob", () => {
  equalRegExp(globToRegExp(""), /(?!)/);
  equalRegExp(posixGlobToRegExp("*.js"), /^[^/]*\.js\/*$/);
});

test(`path::globToRegExp() checks "*" (wildcard)`, () => {
  ok(match("*", "foo", { extended: false, globstar: false }));
  ok(match("*", "foo", { extended: false, globstar: false }));
  ok(match("f*", "foo", { extended: false, globstar: false }));
  ok(match("f*", "foo", { extended: false, globstar: false }));
  ok(match("*o", "foo", { extended: false, globstar: false }));
  ok(match("*o", "foo", { extended: false, globstar: false }));
  ok(match("u*orn", "unicorn", { extended: false, globstar: false }));
  ok(match("u*orn", "unicorn", { extended: false, globstar: false }));
  ok(!match("ico", "unicorn", { extended: false, globstar: false }));
  ok(match("u*nicorn", "unicorn", { extended: false, globstar: false }));
  ok(match("u*nicorn", "unicorn", { extended: false, globstar: false }));
});

test(`path::globToRegExp() checks "?" (match one character)`, () => {
  ok(match("f?o", "foo", { extended: false, globstar: false }));
  ok(match("f?o?", "fooo", { extended: false, globstar: false }));
  ok(!match("f?oo", "foo", { extended: false, globstar: false }));
  ok(!match("?fo", "fooo", { extended: false, globstar: false }));
  ok(!match("f?oo", "foo", { extended: false, globstar: false }));
  ok(!match("foo?", "foo", { extended: false, globstar: false }));
});

test("path::globToRegExp() checks [seq] (character range)", () => {
  ok(match("fo[oz]", "foo", { extended: false, globstar: false }));
  ok(match("fo[oz]", "foz", { extended: false, globstar: false }));
  ok(!match("fo[oz]", "fog", { extended: false, globstar: false }));
  ok(match("fo[a-z]", "fob", { extended: false, globstar: false }));
  ok(!match("fo[a-d]", "fot", { extended: false, globstar: false }));
  ok(!match("fo[!tz]", "fot", { extended: false, globstar: false }));
  ok(match("fo[!tz]", "fob", { extended: false, globstar: false }));
});

test("path::globToRegExp() checks [[:alnum:]] (character class in range)", () => {
  ok(match("[[:alnum:]]/bar.txt", "a/bar.txt", { extended: false, globstar: false }));
  ok(match("[[:alnum:]abc]/bar.txt", "1/bar.txt", { extended: false, globstar: false }));
  ok(!match("[[:alnum:]]/bar.txt", "!/bar.txt", { extended: false, globstar: false }));
  for (const c of "09AGZagz") {
    ok(match("[[:alnum:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "AGZagz") {
    ok(match("[[:alpha:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "\x00\x20\x7F") {
    ok(match("[[:ascii:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "\t ") {
    ok(match("[[:blank:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "\x00\x1F\x7F") {
    ok(match("[[:cntrl:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "09") {
    ok(match("[[:digit:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "\x21\x7E") {
    ok(match("[[:graph:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "az") {
    ok(match("[[:lower:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "\x20\x7E") {
    ok(match("[[:print:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "!\"#$%&'()*+,-./:;<=>?@[\\]^_‘{|}~") {
    ok(match("[[:punct:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "\t\n\v\f\r ") {
    ok(match("[[:space:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "AZ") {
    ok(match("[[:upper:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "09AZaz_") {
    ok(match("[[:word:]]", c, { extended: false, globstar: false }), c);
  }
  for (const c of "09AFaf") {
    ok(match("[[:xdigit:]]", c, { extended: false, globstar: false }), c);
  }
});

test(`path::globToRegExp() checks {} (brace expansion)`, () => {
  ok(match("foo{bar,baaz}", "foobaaz", { extended: false, globstar: false }));
  ok(match("foo{bar,baaz}", "foobar", { extended: false, globstar: false }));
  ok(!match("foo{bar,baaz}", "foobuzz", { extended: false, globstar: false }));
  ok(match("foo{bar,b*z}", "foobuzz", { extended: false, globstar: false }));
});

test("path::globToRegExp() checks complex matches", () => {
  ok(
    match("http://?o[oz].b*z.com/{*.js,*.html}", "http://foo.baaz.com/jquery.min.js", {
      extended: false,
      globstar: false,
    }),
  );
  ok(
    match("http://?o[oz].b*z.com/{*.js,*.html}", "http://moz.buzz.com/index.html", {
      extended: false,
      globstar: false,
    }),
  );
  ok(
    !match("http://?o[oz].b*z.com/{*.js,*.html}", "http://moz.buzz.com/index.htm", {
      extended: false,
      globstar: false,
    }),
  );
  ok(
    !match("http://?o[oz].b*z.com/{*.js,*.html}", "http://moz.bar.com/index.html", {
      extended: false,
      globstar: false,
    }),
  );
  ok(
    !match("http://?o[oz].b*z.com/{*.js,*.html}", "http://flozz.buzz.com/index.html", {
      extended: false,
      globstar: false,
    }),
  );
});

test(`path::globToRegExp() checks "**" (globstar)`, () => {
  ok(match("/foo/**", "/foo/bar.txt"));
  ok(match("/foo/**", "/foo/bar/baz.txt"));
  ok(!match("/foo/**", "/foo/bar/baz.txt", { globstar: false }));
  ok(match("/foo/**", "/foo/bar", { globstar: false }));
  ok(match("/foo/**/*.txt", "/foo/bar/baz.txt"));
  ok(match("/foo/**/*.txt", "/foo/bar/baz/qux.txt"));
  ok(match("/foo/**/bar.txt", "/foo/bar.txt"));
  ok(match("/foo/**/**/bar.txt", "/foo/bar.txt"));
  ok(match("/foo/**/*/baz.txt", "/foo/bar/baz.txt"));
  ok(match("/foo/**/*.txt", "/foo/bar.txt"));
  ok(match("/foo/**/**/*.txt", "/foo/bar.txt"));
  ok(match("/foo/**/*/*.txt", "/foo/bar/baz.txt"));
  ok(match("**/*.txt", "/foo/bar/baz/qux.txt"));
  ok(match("**/foo.txt", "foo.txt"));
  ok(match("**/*.txt", "foo.txt"));
  ok(!match("/foo/**.txt", "/foo/bar/baz/qux.txt"));
  ok(!match("/foo/bar**/*.txt", "/foo/bar/baz/qux.txt"));
  ok(!match("/foo/bar**", "/foo/bar/baz.txt"));
  ok(!match("**/.txt", "/foo/bar/baz/qux.txt"));
  ok(!match("http://foo.com/*", "http://foo.com/bar/baz/jquery.min.js"));
  ok(!match("http://foo.com/*", "http://foo.com/bar/baz/jquery.min.js"));
  ok(match("http://foo.com/**", "http://foo.com/bar/baz/jquery.min.js"));
  ok(match("http://foo.com/**/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js"));
  ok(!match("http://foo.com/*/jquery.min.js", "http://foo.com/bar/baz/jquery.min.js"));
});

test(`path::globToRegExp() checks "?" (pattern-list) (extended: match zero or one)`, () => {
  ok(match("?(foo).txt", "foo.txt"));
  ok(!match("?(foo).txt", "foo.txt", { extended: false }));
  ok(match("?(foo).txt", "a(foo).txt", { extended: false }));
  ok(match("?(foo).txt", ".txt"));
  ok(match("?(foo|bar)baz.txt", "foobaz.txt"));
  ok(match("?(ba[zr]|qux)baz.txt", "bazbaz.txt"));
  ok(match("?(ba[zr]|qux)baz.txt", "barbaz.txt"));
  ok(match("?(ba[zr]|qux)baz.txt", "quxbaz.txt"));
  ok(match("?(ba[!zr]|qux)baz.txt", "batbaz.txt"));
  ok(match("?(ba*|qux)baz.txt", "batbaz.txt"));
  ok(match("?(ba*|qux)baz.txt", "batttbaz.txt"));
  ok(match("?(ba*|qux)baz.txt", "quxbaz.txt"));
  ok(match("?(ba?(z|r)|qux)baz.txt", "bazbaz.txt"));
  ok(match("?(ba?(z|?(r))|qux)baz.txt", "bazbaz.txt"));
  ok(!match("?(foo|bar)baz.txt", "foobarbaz.txt"));
  ok(!match("?(ba[zr]|qux)baz.txt", "bazquxbaz.txt"));
  ok(!match("?(ba[!zr]|qux)baz.txt", "bazbaz.txt"));
});

test("path::globToRegExp() checks *(pattern-list) (extended: match zero or more)", () => {
  ok(match("*(foo).txt", "foo.txt"));
  ok(!match("*(foo).txt", "foo.txt", { extended: false }));
  ok(match("*(foo).txt", "bar(foo).txt", { extended: false }));
  ok(match("*(foo).txt", "foofoo.txt"));
  ok(match("*(foo).txt", ".txt"));
  ok(match("*(fooo).txt", ".txt"));
  ok(!match("*(fooo).txt", "foo.txt"));
  ok(match("*(foo|bar).txt", "foobar.txt"));
  ok(match("*(foo|bar).txt", "barbar.txt"));
  ok(match("*(foo|bar).txt", "barfoobar.txt"));
  ok(match("*(foo|bar).txt", ".txt"));
  ok(match("*(foo|ba[rt]).txt", "bat.txt"));
  ok(match("*(foo|b*[rt]).txt", "blat.txt"));
  ok(!match("*(foo|b*[rt]).txt", "tlat.txt"));
  ok(match("*(*).txt", "whatever.txt"));
  ok(match("*(foo|bar)/**/*.txt", "foo/hello/world/bar.txt"));
  ok(match("*(foo|bar)/**/*.txt", "foo/world/bar.txt"));
});

test("path::globToRegExp() checks +(pattern-list) (extended: match 1 or more)", () => {
  ok(match("+(foo).txt", "foo.txt"));
  ok(!match("+(foo).txt", "foo.txt", { extended: false }));
  ok(match("+(foo).txt", "+(foo).txt", { extended: false }));
  ok(!match("+(foo).txt", ".txt"));
  ok(match("+(foo|bar).txt", "foobar.txt"));
});

test("path::globToRegExp() checks @(pattern-list) (extended: match one)", () => {
  ok(match("@(foo).txt", "foo.txt"));
  ok(!match("@(foo).txt", "foo.txt", { extended: false }));
  ok(match("@(foo).txt", "@(foo).txt", { extended: false }));
  ok(match("@(foo|baz)bar.txt", "foobar.txt"));
  ok(!match("@(foo|baz)bar.txt", "foobazbar.txt"));
  ok(!match("@(foo|baz)bar.txt", "foofoobar.txt"));
  ok(!match("@(foo|baz)bar.txt", "toofoobar.txt"));
});

test("path::globToRegExp() checks !(pattern-list) (extended: match any except)", () => {
  ok(match("!(boo).txt", "foo.txt"));
  ok(!match("!(boo).txt", "foo.txt", { extended: false }));
  ok(match("!(boo).txt", "!(boo).txt", { extended: false }));
  ok(match("!(foo|baz)bar.txt", "buzbar.txt"));
  ok(match("!({foo,bar})baz.txt", "notbaz.txt"));
  ok(!match("!({foo,bar})baz.txt", "foobaz.txt"));
});

test("path::globToRegExp() matches special extended characters with themselves", () => {
  const glob = "\\/$^+.()=!|,.*";
  ok(match(glob, glob));
  ok(match(glob, glob, { extended: false }));
});

test("path::globToRegExp() matches special extended characters in range", () => {
  equalRegExp(posixGlobToRegExp("[?*+@!|]"), /^[?*+@!|]\/*$/);
  equalRegExp(posixGlobToRegExp("[!?*+@!|]"), /^[^?*+@!|]\/*$/);
});

test("path::globToRegExp() matches special RegExp characters in range", () => {
  // Excluding characters checked in the previous test.
  equalRegExp(posixGlobToRegExp("[\\\\$^.=]"), /^[\\$^.=]\/*$/);
  equalRegExp(posixGlobToRegExp("[!\\\\$^.=]"), /^[^\\$^.=]\/*$/);
  equalRegExp(posixGlobToRegExp("[^^]"), /^[\^^]\/*$/);
});

test("path::globToRegExp() checks repeating separators", () => {
  ok(match("foo/bar", "foo//bar"));
  ok(match("foo//bar", "foo/bar"));
  ok(match("foo//bar", "foo//bar"));
  ok(match("**/bar", "foo//bar"));
  ok(match("**//bar", "foo/bar"));
  ok(match("**//bar", "foo//bar"));
});

test("path::globToRegExp() checks trailing separators", () => {
  ok(match("foo", "foo/"));
  ok(match("foo/", "foo"));
  ok(match("foo/", "foo/"));
  ok(match("**", "foo/"));
  ok(match("**/", "foo"));
  ok(match("**/", "foo/"));
});

test("path::globToRegExp() checks backslashes on Windows", () => {
  ok(windowsMatch("foo/bar", "foo\\bar"));
  ok(windowsMatch("foo\\bar", "foo/bar"));
  ok(windowsMatch("foo\\bar", "foo\\bar"));
  ok(windowsMatch("**/bar", "foo\\bar"));
  ok(windowsMatch("**\\bar", "foo/bar"));
  ok(windowsMatch("**\\bar", "foo\\bar"));
});

test("path::globToRegExp() checks unclosed groups", () => {
  ok(match("{foo,bar}/[ab", "foo/[ab"));
  ok(match("{foo,bar}/{foo,bar", "foo/{foo,bar"));
  ok(match("{foo,bar}/?(foo|bar", "foo/?(foo|bar"));
  ok(match("{foo,bar}/@(foo|bar", "foo/@(foo|bar"));
  ok(match("{foo,bar}/*(foo|bar", "foo/*(foo|bar"));
  ok(match("{foo,bar}/+(foo|bar", "foo/+(foo|bar"));
  ok(match("{foo,bar}/!(foo|bar", "foo/!(foo|bar"));
  ok(match("{foo,bar}/?({)}", "foo/?({)}"));
  ok(match("{foo,bar}/{?(})", "foo/{?(})"));
});

test("path::globToRegExp() escapes glob characters", () => {
  ok(posixMatch("\\[ab]", "[ab]"));
  ok(windowsMatch("`[ab]", "[ab]"));
  ok(posixMatch("\\{foo,bar}", "{foo,bar}"));
  ok(windowsMatch("`{foo,bar}", "{foo,bar}"));
  ok(posixMatch("\\?(foo|bar)", "?(foo|bar)"));
  ok(windowsMatch("`?(foo|bar)", "?(foo|bar)"));
  ok(posixMatch("\\@(foo|bar)", "@(foo|bar)"));
  ok(windowsMatch("`@(foo|bar)", "@(foo|bar)"));
  ok(posixMatch("\\*(foo|bar)", "*(foo|bar)"));
  ok(windowsMatch("`*(foo|bar)", "*(foo|bar)"));
  ok(posixMatch("\\+(foo|bar)", "+(foo|bar)"));
  ok(windowsMatch("`+(foo|bar)", "+(foo|bar)"));
  ok(posixMatch("\\!(foo|bar)", "!(foo|bar)"));
  ok(windowsMatch("`!(foo|bar)", "!(foo|bar)"));
  ok(posixMatch("@\\(foo|bar)", "@(foo|bar)"));
  ok(windowsMatch("@`(foo|bar)", "@(foo|bar)"));
  ok(posixMatch("{foo,bar}/[ab]\\", "foo/[ab]\\"));
  ok(windowsMatch("{foo,bar}/[ab]`", "foo/[ab]`"));
});

test("path::globToRegExp() checks dangling escape prefix", () => {
  ok(posixMatch("{foo,bar}/[ab]\\", "foo/[ab]\\"));
  ok(windowsMatch("{foo,bar}/[ab]`", "foo/[ab]`"));
});

test("path::globToRegExp() checks options.extended", () => {
  const pattern1 = globToRegExp("?(foo|bar)");
  equal("foo".match(pattern1)?.[0], "foo");
  equal("bar".match(pattern1)?.[0], "bar");

  const pattern2 = globToRegExp("?(foo|bar)", { extended: false });
  equal("foo".match(pattern2)?.[0], undefined);
  equal("bar".match(pattern2)?.[0], undefined);
  equal("?(foo|bar)".match(pattern2)?.[0], "?(foo|bar)");
});

test("path::globToRegExp() checks options.globstar", () => {
  const pattern1 = globToRegExp("**/foo");
  equal("foo".match(pattern1)?.[0], "foo");
  equal("path/to/foo".match(pattern1)?.[0], "path/to/foo");

  const pattern2 = globToRegExp("**/foo", { globstar: false });
  equal("foo".match(pattern2)?.[0], undefined);
  equal("path/to/foo".match(pattern2)?.[0], undefined);
  equal("path-to/foo".match(pattern2)?.[0], "path-to/foo");
});

test("path::globToRegExp() checks options.caseInsensitive", () => {
  const pattern1 = globToRegExp("foo/bar", { caseInsensitive: false });
  equal("foo/bar".match(pattern1)?.[0], "foo/bar");
  equal("Foo/Bar".match(pattern1)?.[0], undefined);

  const pattern2 = globToRegExp("foo/bar", { caseInsensitive: true });
  equal("foo/bar".match(pattern2)?.[0], "foo/bar");
  equal("Foo/Bar".match(pattern2)?.[0], "Foo/Bar");
});

test("path::globToRegExp() handles separators in groups", () => {
  ok(match("**/{foo/*.json,*.txt}", "/c/Users/me/foo/bar.json"));
  ok(match("**/{foo/*.json,*.txt}", "/c/Users/me/file.txt"));
  ok(!match("!(foo/*.json|*.txt)", "/foo/bar.json"));
  ok(!match("!(foo/*.json|*.txt)", "/file.json"));
  ok(match("**/@(foo/*.json|*.txt)", "/c/Users/me/foo/bar.json"));
  ok(match("**/@(foo/*.json|*.txt)", "/c/Users/me/file.txt"));
  ok(match("**/+(foo/*.json|*.txt)", "/c/Users/me/foo/bar.json"));
  ok(match("**/+(foo/*.json|*.txt)", "/c/Users/me/file.txt"));
});
