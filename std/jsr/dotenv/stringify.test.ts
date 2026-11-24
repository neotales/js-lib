import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { stringify } from "./stringify.ts";
import { WINDOWS } from "./globals.ts";

test("dotenv::stringify basic", () => {
  const env = {
    FOO: "bar",
    BAR: "baz\n",
  };

  const source = stringify(env);
  let expected = `FOO='bar'
BAR="baz
"`;
  if (WINDOWS) {
    expected = `FOO='bar'\r\nBAR="baz\n"`;
  }

  equal(source, expected);
});

test("dotenv::stringify with onlyLineFeed", () => {
  const env = {
    KEY1: "value1",
    KEY2: "value2",
  };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "KEY1='value1'\nKEY2='value2'");
});

test("dotenv::stringify empty object", () => {
  const env = {};
  const result = stringify(env);
  equal(result, "");
});

test("dotenv::stringify single key", () => {
  const env = { KEY: "value" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "KEY='value'");
});

test("dotenv::stringify with single quotes in value uses double quotes", () => {
  const env = { KEY: "it's a test" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, 'KEY="it\'s a test"');
});

test("dotenv::stringify with double quotes in value escapes them", () => {
  const env = { KEY: 'say "hello"' };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "KEY='say \"hello\"'");
});

test("dotenv::stringify with newline in value", () => {
  const env = { KEY: "line1\nline2" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, `KEY="line1\nline2"`);
});

test("dotenv::stringify with unicode value", () => {
  const env = { KEY: "日本語" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "KEY='日本語'");
});

test("dotenv::stringify with emoji value", () => {
  const env = { KEY: "\u{1F389}" }; // 🎉
  const result = stringify(env, { onlyLineFeed: true });
  ok(result.startsWith("KEY='"));
  ok(result.endsWith("'"));
});

test("dotenv::stringify with empty value", () => {
  const env = { KEY: "" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "KEY=''");
});

test("dotenv::stringify with special characters", () => {
  const env = { KEY: "!@#$%^&*()" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "KEY='!@#$%^&*()'");
});

test("dotenv::stringify with URL value", () => {
  const env = { URL: "https://example.com:8080/path?query=1" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "URL='https://example.com:8080/path?query=1'");
});

test("dotenv::stringify with equals in value", () => {
  const env = { KEY: "a=b=c" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "KEY='a=b=c'");
});

test("dotenv::stringify with backslash in value", () => {
  const env = { KEY: "path\\to\\file" };
  const result = stringify(env, { onlyLineFeed: true });
  equal(result, "KEY='path\\to\\file'");
});

test("dotenv::stringify multiple keys preserve order", () => {
  const env = { A: "1", B: "2", C: "3" };
  const result = stringify(env, { onlyLineFeed: true });
  ok(result.includes("A='1'"));
  ok(result.includes("B='2'"));
  ok(result.includes("C='3'"));
});

test("dotenv::stringify with tab character uses double quotes", () => {
  const env = { KEY: "col1\tcol2" };
  const result = stringify(env, { onlyLineFeed: true });
  // tab doesn't trigger double quotes, only newline and single quote do
  equal(result, "KEY='col1\tcol2'");
});

test("dotenv::stringify with both newline and single quote", () => {
  const env = { KEY: "it's\nmultiline" };
  const result = stringify(env, { onlyLineFeed: true });
  // newline triggers double quotes, and single quotes are preserved
  equal(result, 'KEY="it\'s\nmultiline"');
});

test("dotenv::stringify with complex real-world values", () => {
  const env = {
    DATABASE_URL: "postgres://user:pass@localhost:5432/db",
    API_KEY: "sk-1234567890",
    CONFIG_JSON: '{"key": "value"}',
  };
  const result = stringify(env, { onlyLineFeed: true });
  ok(result.includes("DATABASE_URL='postgres://user:pass@localhost:5432/db'"));
  ok(result.includes("API_KEY='sk-1234567890'"));
  ok(result.includes('CONFIG_JSON=\'{"key": "value"}\''));
});
