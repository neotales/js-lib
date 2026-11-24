import { deepStrictEqual as equal, ok } from "@neotales/assert";
import { test } from "@neotales/test";
import { DotEnvDocument } from "./document.ts";
import { stringifyDocument } from "./stringify_document.ts";
import { WINDOWS } from "./globals.ts";

test("dotenv::stringifyDocument basic", () => {
  const doc = new DotEnvDocument();
  doc.comment("comment=1");
  doc.newline();
  doc.item("FOO", "bar");
  doc.item("BAR", "baz\n");
  doc.newline();

  const source = stringifyDocument(doc);
  let expected = `#comment=1

FOO='bar'
BAR="baz
"
`;
  if (WINDOWS) {
    expected = `#comment=1\r\n\r\nFOO='bar'\r\nBAR="baz\n"\r\n`;
  }

  equal(source, expected);
});

test("dotenv::stringifyDocument with onlyLineFeed", () => {
  const doc = new DotEnvDocument();
  doc.item("KEY1", "value1");
  doc.newline();
  doc.item("KEY2", "value2");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "KEY1='value1'\n\nKEY2='value2'");
});

test("dotenv::stringifyDocument empty document", () => {
  const doc = new DotEnvDocument();
  const result = stringifyDocument(doc);
  equal(result, "");
});

test("dotenv::stringifyDocument single item", () => {
  const doc = new DotEnvDocument();
  doc.item("KEY", "value");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "KEY='value'");
});

test("dotenv::stringifyDocument only comments", () => {
  const doc = new DotEnvDocument();
  doc.comment("First comment");
  doc.comment("Second comment");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "#First comment\n#Second comment");
});

test("dotenv::stringifyDocument only newlines", () => {
  const doc = new DotEnvDocument();
  doc.newline();
  doc.newline();
  doc.newline();
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "\n\n\n");
});

test("dotenv::stringifyDocument preserves comment text", () => {
  const doc = new DotEnvDocument();
  doc.comment("Configuration settings for the application");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "#Configuration settings for the application");
});

test("dotenv::stringifyDocument with single quotes in value", () => {
  const doc = new DotEnvDocument();
  doc.item("KEY", "it's a test");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, 'KEY="it\'s a test"');
});

test("dotenv::stringifyDocument with double quotes in value", () => {
  const doc = new DotEnvDocument();
  doc.item("KEY", 'say "hello"');
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "KEY='say \"hello\"'");
});

test("dotenv::stringifyDocument with multiline value", () => {
  const doc = new DotEnvDocument();
  doc.item("KEY", "line1\nline2\nline3");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, `KEY="line1\nline2\nline3"`);
});

test("dotenv::stringifyDocument with unicode value", () => {
  const doc = new DotEnvDocument();
  doc.item("GREETING", "こんにちは");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "GREETING='こんにちは'");
});

test("dotenv::stringifyDocument with emoji value", () => {
  const doc = new DotEnvDocument();
  doc.item("EMOJI", "\u{1F389}\u{1F680}"); // 🎉🚀
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  ok(result.startsWith("EMOJI='"));
  ok(result.endsWith("'"));
});

test("dotenv::stringifyDocument complex document", () => {
  const doc = new DotEnvDocument();
  doc.comment("Database configuration");
  doc.newline();
  doc.item("DATABASE_URL", "postgres://localhost/mydb");
  doc.item("DATABASE_POOL", "10");
  doc.newline();
  doc.comment("API settings");
  doc.item("API_KEY", "secret123");
  const result = stringifyDocument(doc, { onlyLineFeed: true });

  ok(result.includes("#Database configuration"));
  ok(result.includes("DATABASE_URL='postgres://localhost/mydb'"));
  ok(result.includes("DATABASE_POOL='10'"));
  ok(result.includes("#API settings"));
  ok(result.includes("API_KEY='secret123'"));
});

test("dotenv::stringifyDocument with empty value", () => {
  const doc = new DotEnvDocument();
  doc.item("EMPTY", "");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "EMPTY=''");
});

test("dotenv::stringifyDocument with URL value", () => {
  const doc = new DotEnvDocument();
  doc.item("URL", "https://example.com:8080/path?query=1");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "URL='https://example.com:8080/path?query=1'");
});

test("dotenv::stringifyDocument with special characters in comment", () => {
  const doc = new DotEnvDocument();
  doc.comment("Setting: key=value (important!)");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "#Setting: key=value (important!)");
});

test("dotenv::stringifyDocument chaining", () => {
  const doc = new DotEnvDocument().comment("Header").newline().item("A", "1").item("B", "2");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, "#Header\n\nA='1'\nB='2'");
});

test("dotenv::stringifyDocument with both newline and single quote", () => {
  const doc = new DotEnvDocument();
  doc.item("KEY", "it's\nmultiline");
  const result = stringifyDocument(doc, { onlyLineFeed: true });
  equal(result, 'KEY="it\'s\nmultiline"');
});
