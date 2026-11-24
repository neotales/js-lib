import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { parseDocument } from "./parse_document.ts";

test("dotnev::parseDocument", () => {
  const source = `# comment

FOO=bar`;

  const document = parseDocument(source);
  equal(document.length, 3);
  const [comment, empty, variable] = document.toArray();
  equal(comment.kind, "comment");
  equal(empty.kind, "newline");
  equal(variable.kind, "item");
  equal(variable.key, "FOO");
  equal(variable.value, "bar");
});

test("dotenv::parseDocument - multiline using escape character", () => {
  const source = `FOO="bar\\nbaz"`;
  const document = parseDocument(source);
  equal(document.length, 1);

  const [variable] = document.toArray();
  equal(variable.kind, "item");
  equal(variable.key, "FOO");
  equal(variable.value, "bar\nbaz");
});

test("dotenv::parseDocument - multiline with new line", () => {
  const source = `FOO="bar
baz"`;
  const document = parseDocument(source);
  equal(document.length, 1);

  const [variable] = document.toArray();
  equal(variable.kind, "item");
  equal(variable.key, "FOO");
  equal(variable.value, "bar\nbaz");
});

test("dotenv::parseDocument - spacing around key", () => {
  let source = ` FOO  ="bar"`;
  let document = parseDocument(source);

  equal(document.length, 1);

  const [variable] = document.toArray();
  equal(variable.kind, "item");
  equal(variable.key, "FOO");
  equal(variable.value, "bar");

  source = `FOO   ="bar"`;
  document = parseDocument(source);
  equal(document.length, 1);
  const [variable2] = document.toArray();
  equal(variable2.kind, "item");
  equal(variable2.key, "FOO");
  equal(variable2.value, "bar");

  source = `   FOO=bar`;
  document = parseDocument(source);
  equal(document.length, 1);
  const [variable3] = document.toArray();
  equal(variable3.kind, "item");
  equal(variable3.key, "FOO");
  equal(variable3.value, "bar");
});

test("dotenv::parseDocument - spacing around unquoted value", () => {
  let source = `FOO=  bar`;
  let document = parseDocument(source);
  equal(document.length, 1);
  const [variable] = document.toArray();
  equal(variable.kind, "item");
  equal(variable.key, "FOO");
  equal(variable.value, "bar");

  source = `FOO=bar  `;
  document = parseDocument(source);
  equal(document.length, 1);
  const [variable2] = document.toArray();
  equal(variable2.kind, "item");
  equal(variable2.key, "FOO");
  equal(variable2.value, "bar");

  source = `FOO=   bar  `;
  document = parseDocument(source);
  equal(document.length, 1);
  const [variable3] = document.toArray();
  equal(variable3.kind, "item");
  equal(variable3.key, "FOO");
  equal(variable3.value, "bar");

  source = `FOO=   bar\u0020\u0020

  `;
  document = parseDocument(source);
  equal(document.length, 3);
  const [variable4] = document.toArray();
  equal(variable4.kind, "item");
  equal(variable4.key, "FOO");
  equal(variable4.value, "bar");
});

test("dotenv::parseDocument - spacing around quoted value", () => {
  let source = `FOO="  bar"`;
  let document = parseDocument(source);
  equal(document.length, 1);
  const [variable] = document.toArray();
  equal(variable.kind, "item");
  equal(variable.key, "FOO");
  equal(variable.value, "  bar");

  source = `FOO="bar  "`;
  document = parseDocument(source);
  equal(document.length, 1);
  const [variable2] = document.toArray();
  equal(variable2.kind, "item");
  equal(variable2.key, "FOO");
  equal(variable2.value, "bar  ");

  source = `FOO="   bar  "`;
  document = parseDocument(source);
  equal(document.length, 1);
  const [variable3] = document.toArray();
  equal(variable3.kind, "item");
  equal(variable3.key, "FOO");
  equal(variable3.value, "   bar  ");

  source = `FOO="   bar  "

  `;
  document = parseDocument(source);
  equal(document.length, 3);
  const [variable4] = document.toArray();
  equal(variable4.kind, "item");
  equal(variable4.key, "FOO");
  equal(variable4.value, "   bar  ");
});

test("dotenv::parseDocument - allow lowercase keys", () => {
  const source = `foo=bar
BAR=baz
MiXeD=case`;
  const document = parseDocument(source);
  const set = document.toObject();
  equal(document.length, 3);
  equal(set.foo, "bar");
  equal(set.BAR, "baz");
  equal(set.MiXeD, "case");
});

test("dotenv::parseDocument - complex", () => {
  const source = `# comment
FOO1=\`echo bar\`
FOO2="bar"

# comment=2
    # comment=3\u0020
FOO3=bar
FOO4="new
line"
FOO5="new\\nline"
FOO6='new
line'`;

  const document = parseDocument(source);
  const nl = "new\nline";
  const vars = document.toObject();
  equal(document.length, 10);
  equal(vars.FOO1, "echo bar");
  equal(vars.FOO2, "bar");
  equal(vars.FOO3, "bar");
  equal(vars.FOO4, nl);
  equal(vars.FOO5, "new\nline");
  equal(vars.FOO6, nl);
});

// Tests from parse.go / mod_test.go

test("dotenv::parseDocument - empty value", () => {
  const source = `KEY=`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "");
});

test("dotenv::parseDocument - key with underscore", () => {
  const source = `KEY_WITH_UNDERSCORE=value`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_UNDERSCORE, "value");
});

test("dotenv::parseDocument - values with spaces", () => {
  const source = `KEY_WITH_SPACES=value with spaces`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_SPACES, "value with spaces");
});

test("dotenv::parseDocument - values with special characters", () => {
  const source = `KEY_WITH_SPECIAL_CHARS=value@!%`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_SPECIAL_CHARS, "value@!%");
});

test("dotenv::parseDocument - quoted values with escaped newlines", () => {
  const source = `KEY_WITH_NEWLINES="value\\nwith\\nnewlines"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_NEWLINES, "value\nwith\nnewlines");
});

test("dotenv::parseDocument - quoted values with literal newlines", () => {
  const source = `KEY_WITH_QUOTED_NEWLINES="value
with
newlines"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_QUOTED_NEWLINES, "value\nwith\nnewlines");
});

test("dotenv::parseDocument - escaped tabs", () => {
  const source = `KEY_WITH_TABS="value\\twith\\ttabs"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_TABS, "value\twith\ttabs");
});

test("dotenv::parseDocument - escaped quotes in double quotes", () => {
  const source = `KEY_WITH_ESCAPED_QUOTES="value with \\"escaped quotes\\""`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_ESCAPED_QUOTES, `value with "escaped quotes"`);
});

test("dotenv::parseDocument - unicode characters", () => {
  const source = `KEY_WITH_UNICODE=こんにちは`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_UNICODE, "こんにちは");
});

test("dotenv::parseDocument - unicode emojis", () => {
  const source = `KEY_WITH_EMOJI=😊`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_EMOJI, "😊");
});

test("dotenv::parseDocument - escaped unicode \\U (8 hex)", () => {
  const source = `KEY_WITH_ESCAPED_UNICODE="value with \\U0001F920"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_ESCAPED_UNICODE, "value with 🤠");
});

test("dotenv::parseDocument - escaped unicode \\u (4 hex)", () => {
  const source = `KEY_WITH_ESCAPED_UNICODE="value with \\u2603"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_ESCAPED_UNICODE, "value with ☃");
});

test("dotenv::parseDocument - single quote does not escape", () => {
  const source = `KEY_WITH_SINGLE_QUOTE='value with single quote \\n'`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY_WITH_SINGLE_QUOTE, "value with single quote \\n");
});

test("dotenv::parseDocument - escaped single quote in single quotes", () => {
  const source = `KEY="a value with \\'single quotes\\'"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "a value with 'single quotes'");
});

test("dotenv::parseDocument - escaped backslash", () => {
  const source = `KEY="value with \\\\backslash"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "value with \\backslash");
});

test("dotenv::parseDocument - escaped backspace", () => {
  const source = `KEY="value with \\bbackspace"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "value with \bbackspace");
});

test("dotenv::parseDocument - escaped carriage return", () => {
  const source = `KEY="value with \\rcarriage return"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "value with \rcarriage return");
});

test("dotenv::parseDocument - inline comment after unquoted value", () => {
  const source = `KEY=value # this is a comment`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "value");
});

test("dotenv::parseDocument - inline comment after quoted value", () => {
  const source = `KEY="value" # this is a comment`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "value");
});

test("dotenv::parseDocument - comment trims leading spaces", () => {
  const source = `#    This is a comment with leading spaces`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const [comment] = document.toArray();
  equal(comment.kind, "comment");
  equal(comment.value, "This is a comment with leading spaces");
});

// Command substitution tests

test("dotenv::parseDocument - command substitution basic", () => {
  const source = `KEY="$(echo hello)"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "$(echo hello)");
});

test("dotenv::parseDocument - command substitution with single quotes inside", () => {
  const source = `KEY="$(echo 'hello world')"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "$(echo 'hello world')");
});

test("dotenv::parseDocument - command substitution with double quotes inside", () => {
  const source = `KEY="$(echo "hello world")"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, `$(echo "hello world")`);
});

test("dotenv::parseDocument - command substitution nested", () => {
  const source = `KEY="$(echo $(whoami))"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "$(echo $(whoami))");
});

test("dotenv::parseDocument - command substitution with escaped quotes inside", () => {
  const source = `KEY="$(echo "test")"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, `$(echo "test")`);
});

test("dotenv::parseDocument - command substitution with text before and after", () => {
  const source = `KEY="prefix $(echo 'test') suffix"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "prefix $(echo 'test') suffix");
});

test("dotenv::parseDocument - mixed quoted and command substitution", () => {
  const source = `KEY1="value1"
KEY2="$(cat '/path/to/file')"
KEY3=unquoted`;
  const document = parseDocument(source);
  equal(document.length, 3);
  const vars = document.toObject();
  equal(vars.KEY1, "value1");
  equal(vars.KEY2, "$(cat '/path/to/file')");
  equal(vars.KEY3, "unquoted");
});

test("dotenv::parseDocument - emoji in double quotes", () => {
  const source = `KEY="😈"`;
  const document = parseDocument(source);
  equal(document.length, 1);
  const vars = document.toObject();
  equal(vars.KEY, "😈");
});

test("dotenv::parseDocument - complex mixed content", () => {
  const source = `
KEY1="value1"

KEY2='value2'
Key3=value3
Key4=a value with spaces
# This is a comment
Key5="a value with \\"escaped quotes\\""
Key6='a value with \\'single quotes\\''
Key7="line1
line2
line3
"
Key8="value with \\nnewlines"
Key9="value with \\t tabs"
Key11="😈"`;

  const document = parseDocument(source);
  const arr = document.toArray();

  // First token is a newline
  equal(arr[0].kind, "newline");

  // KEY1 with double quotes
  equal(arr[1].kind, "item");
  equal(arr[1].key, "KEY1");
  equal(arr[1].value, "value1");

  // Empty line
  equal(arr[2].kind, "newline");

  // KEY2 with single quotes
  equal(arr[3].kind, "item");
  equal(arr[3].key, "KEY2");
  equal(arr[3].value, "value2");

  // Key3 unquoted
  equal(arr[4].kind, "item");
  equal(arr[4].key, "Key3");
  equal(arr[4].value, "value3");

  // Key4 with spaces
  equal(arr[5].kind, "item");
  equal(arr[5].key, "Key4");
  equal(arr[5].value, "a value with spaces");

  // Comment
  equal(arr[6].kind, "comment");
  equal(arr[6].value, "This is a comment");

  // Key5 with escaped quotes
  equal(arr[7].kind, "item");
  equal(arr[7].key, "Key5");
  equal(arr[7].value, `a value with "escaped quotes"`);

  // Key6 with single quotes (escaped single quote)
  equal(arr[8].kind, "item");
  equal(arr[8].key, "Key6");
  equal(arr[8].value, "a value with 'single quotes'");

  // Key7 with multiline
  equal(arr[9].kind, "item");
  equal(arr[9].key, "Key7");
  equal(arr[9].value, "line1\nline2\nline3\n");

  // Key8 with escaped newlines
  equal(arr[10].kind, "item");
  equal(arr[10].key, "Key8");
  equal(arr[10].value, "value with \nnewlines");

  // Key9 with escaped tabs
  equal(arr[11].kind, "item");
  equal(arr[11].key, "Key9");
  equal(arr[11].value, "value with \t tabs");

  // Key11 with emoji
  equal(arr[12].kind, "item");
  equal(arr[12].key, "Key11");
  equal(arr[12].value, "😈");
});
