import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { parse } from "./parse.ts";

test("dotenv::parse basic key=value", () => {
  const result = parse("KEY=value");
  equal(result.KEY, "value");
});

test("dotenv::parse multiple key=value pairs", () => {
  const result = parse(`KEY1=value1
KEY2=value2
KEY3=value3`);
  equal(result.KEY1, "value1");
  equal(result.KEY2, "value2");
  equal(result.KEY3, "value3");
});

test("dotenv::parse with double quotes", () => {
  const result = parse('KEY="quoted value"');
  equal(result.KEY, "quoted value");
});

test("dotenv::parse with single quotes", () => {
  const result = parse("KEY='quoted value'");
  equal(result.KEY, "quoted value");
});

test("dotenv::parse with backticks", () => {
  const result = parse("KEY=`command output`");
  equal(result.KEY, "command output");
});

test("dotenv::parse empty value", () => {
  const result = parse("KEY=");
  equal(result.KEY, "");
});

test("dotenv::parse skips comments", () => {
  const result = parse(`# This is a comment
KEY=value`);
  equal(result.KEY, "value");
  equal(Object.keys(result).length, 1);
});

test("dotenv::parse skips empty lines", () => {
  const result = parse(`KEY1=value1

KEY2=value2`);
  equal(result.KEY1, "value1");
  equal(result.KEY2, "value2");
  equal(Object.keys(result).length, 2);
});

test("dotenv::parse with spaces around key", () => {
  const result = parse("  KEY  =value");
  equal(result.KEY, "value");
});

test("dotenv::parse with spaces around value", () => {
  const result = parse("KEY=  value  ");
  equal(result.KEY, "value");
});

test("dotenv::parse preserves spaces in quoted values", () => {
  const result = parse('KEY="  value  "');
  equal(result.KEY, "  value  ");
});

test("dotenv::parse with newline in double quotes", () => {
  const result = parse(`KEY="line1
line2"`);
  equal(result.KEY, "line1\nline2");
});

test("dotenv::parse with escaped newline", () => {
  const result = parse('KEY="line1\\nline2"');
  equal(result.KEY, "line1\nline2");
});

test("dotenv::parse with escaped tab", () => {
  const result = parse('KEY="col1\\tcol2"');
  equal(result.KEY, "col1\tcol2");
});

test("dotenv::parse with escaped backslash", () => {
  const result = parse('KEY="path\\\\to\\\\file"');
  equal(result.KEY, "path\\to\\file");
});

test("dotenv::parse with escaped double quotes", () => {
  const result = parse('KEY="say \\"hello\\""');
  equal(result.KEY, 'say "hello"');
});

test("dotenv::parse with unicode escape \\u", () => {
  const result = parse('KEY="snowman: \\u2603"');
  equal(result.KEY, "snowman: ☃");
});

test("dotenv::parse with unicode escape \\U", () => {
  const result = parse('KEY="cowboy: \\U0001F920"');
  equal(result.KEY, "cowboy: 🤠");
});

test("dotenv::parse single quotes preserve backslashes", () => {
  const result = parse("KEY='value \\n literal'");
  equal(result.KEY, "value \\n literal");
});

test("dotenv::parse inline comment after unquoted value", () => {
  const result = parse("KEY=value # this is a comment");
  equal(result.KEY, "value");
});

test("dotenv::parse inline comment after quoted value", () => {
  const result = parse('KEY="value" # this is a comment');
  equal(result.KEY, "value");
});

test("dotenv::parse with underscore in key", () => {
  const result = parse("MY_KEY_NAME=value");
  equal(result.MY_KEY_NAME, "value");
});

test("dotenv::parse with lowercase key", () => {
  const result = parse("lowercase=value");
  equal(result.lowercase, "value");
});

test("dotenv::parse with mixed case key", () => {
  const result = parse("MixedCase=value");
  equal(result.MixedCase, "value");
});

test("dotenv::parse with number in key", () => {
  const result = parse("KEY123=value");
  equal(result.KEY123, "value");
});

test("dotenv::parse unicode value", () => {
  const result = parse("KEY=日本語");
  equal(result.KEY, "日本語");
});

test("dotenv::parse emoji value", () => {
  const result = parse("KEY=🎉🚀");
  equal(result.KEY, "🎉🚀");
});

test("dotenv::parse with special characters", () => {
  const result = parse("KEY=value@!%");
  equal(result.KEY, "value@!%");
});

test("dotenv::parse with URL value", () => {
  const result = parse("URL=https://example.com:8080/path?query=1");
  equal(result.URL, "https://example.com:8080/path?query=1");
});

test("dotenv::parse with equals in value", () => {
  const result = parse('KEY="a=b=c"');
  equal(result.KEY, "a=b=c");
});

test("dotenv::parse Windows line endings (CRLF)", () => {
  const result = parse("KEY1=value1\r\nKEY2=value2");
  equal(result.KEY1, "value1");
  equal(result.KEY2, "value2");
});

test("dotenv::parse command substitution preserved", () => {
  const result = parse('KEY="$(echo hello)"');
  equal(result.KEY, "$(echo hello)");
});

test("dotenv::parse with carriage return escape", () => {
  const result = parse('KEY="line1\\rline2"');
  equal(result.KEY, "line1\rline2");
});

test("dotenv::parse with backspace escape", () => {
  const result = parse('KEY="text\\bhere"');
  equal(result.KEY, "text\bhere");
});

test("dotenv::parse empty string", () => {
  const result = parse("");
  equal(Object.keys(result).length, 0);
});

test("dotenv::parse only whitespace", () => {
  const result = parse("   \n   \n   ");
  equal(Object.keys(result).length, 0);
});

test("dotenv::parse only comments", () => {
  const result = parse(`# comment 1
# comment 2
# comment 3`);
  equal(Object.keys(result).length, 0);
});

test("dotenv::parse complex document", () => {
  const source = `# Database configuration
DATABASE_URL="postgres://localhost/myapp"
DATABASE_POOL=10

# API settings
API_KEY='secret123'
API_TIMEOUT=30

# Feature flags
FEATURE_NEW_UI=true
FEATURE_BETA=false`;

  const result = parse(source);
  equal(result.DATABASE_URL, "postgres://localhost/myapp");
  equal(result.DATABASE_POOL, "10");
  equal(result.API_KEY, "secret123");
  equal(result.API_TIMEOUT, "30");
  equal(result.FEATURE_NEW_UI, "true");
  equal(result.FEATURE_BETA, "false");
});

test("dotenv::parse multiline value with multiple newlines", () => {
  const result = parse(`KEY="line1
line2
line3
line4"`);
  equal(result.KEY, "line1\nline2\nline3\nline4");
});

test("dotenv::parse supports optional export prefixes", () => {
  const result = parse("export KEY=value\nOTHER=value");
  equal(result.KEY, "value");
  equal(result.OTHER, "value");
});

test("dotenv::parse quoted empty string", () => {
  const result = parse('KEY=""');
  equal(result.KEY, "");
});

test("dotenv::parse single quoted empty string", () => {
  const result = parse("KEY=''");
  equal(result.KEY, "");
});

test("dotenv::parse backtick empty string", () => {
  const result = parse("KEY=``");
  equal(result.KEY, "");
});
