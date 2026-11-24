import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { join, unixJoin, windowsJoin } from "./join.ts";

// windowsJoin Tests

test("args::windowsJoin joins simple args without special chars", () => {
  equal(windowsJoin(["foo", "bar", "baz"]), "foo bar baz");
});

test("args::windowsJoin joins single arg", () => {
  equal(windowsJoin(["hello"]), "hello");
});

test("args::windowsJoin joins empty array", () => {
  equal(windowsJoin([]), "");
});

test("args::windowsJoin joins args with spaces", () => {
  equal(windowsJoin(["foo", "bar baz"]), 'foo "bar baz"');
});

test("args::windowsJoin joins args with double quotes", () => {
  equal(windowsJoin(["foo", 'bar"baz']), 'foo "bar\\"baz"');
});

test("args::windowsJoin joins args with backslashes", () => {
  equal(windowsJoin(["foo", "bar\\baz"]), "foo bar\\baz");
});

test("args::windowsJoin joins args with multiple backslashes before quote", () => {
  equal(windowsJoin(["foo", 'bar\\\\\\"baz']), 'foo "bar\\\\\\\\\\\\\\"baz"');
});

test("args::windowsJoin joins args with multiple spaces", () => {
  equal(windowsJoin(["foo", "bar  baz"]), 'foo "bar  baz"');
});

test("args::windowsJoin joins command with path", () => {
  equal(windowsJoin(["cmd", "C:\\Program Files\\app.exe"]), 'cmd "C:\\Program Files\\app.exe"');
});

test("args::windowsJoin joins args with only spaces", () => {
  equal(windowsJoin(["foo", "   "]), 'foo "   "');
});

test("args::windowsJoin with accented characters", () => {
  equal(windowsJoin(["echo", "café"]), "echo café");
});

test("args::windowsJoin with German umlauts", () => {
  equal(windowsJoin(["echo", "Größe"]), "echo Größe");
});

test("args::windowsJoin with Greek letters", () => {
  equal(windowsJoin(["echo", "αβγ"]), "echo αβγ");
});

test("args::windowsJoin with Cyrillic letters", () => {
  equal(windowsJoin(["echo", "привет"]), "echo привет");
});

test("args::windowsJoin with emoji", () => {
  equal(windowsJoin(["echo", "🎉"]), "echo 🎉");
});

test("args::windowsJoin with CJK characters", () => {
  equal(windowsJoin(["echo", "你好"]), "echo 你好");
});

test("args::windowsJoin with Unicode and spaces", () => {
  equal(windowsJoin(["echo", "café latte"]), 'echo "café latte"');
});

// unixJoin Tests

test("args::unixJoin joins simple args without special chars", () => {
  equal(unixJoin(["foo", "bar", "baz"]), "foo bar baz");
});

test("args::unixJoin joins single arg", () => {
  equal(unixJoin(["hello"]), "hello");
});

test("args::unixJoin joins empty array", () => {
  equal(unixJoin([]), "");
});

test("args::unixJoin joins args with spaces", () => {
  equal(unixJoin(["foo", "bar baz"]), 'foo "bar baz"');
});

test("args::unixJoin joins args with double quotes", () => {
  equal(unixJoin(["foo", 'bar"baz']), 'foo "bar\\"baz"');
});

test("args::unixJoin joins args with dollar sign", () => {
  equal(unixJoin(["echo", "$HOME"]), 'echo "\\$HOME"');
});

test("args::unixJoin joins args with backtick", () => {
  equal(unixJoin(["echo", "`date`"]), 'echo "\\`date\\`"');
});

test("args::unixJoin joins args with dollar sign and backtick", () => {
  equal(unixJoin(["foo", "bar$`baz"]), 'foo "bar\\$\\`baz"');
});

test("args::unixJoin joins args with backslashes", () => {
  equal(unixJoin(["foo", "bar\\baz"]), 'foo "bar\\\\baz"');
});

test("args::unixJoin joins args with single quotes", () => {
  equal(unixJoin(["echo", "it's"]), 'echo "it\'s"');
});

test("args::unixJoin joins args with multiple special chars", () => {
  equal(unixJoin(["echo", '$HOME `date` "test"']), 'echo "\\$HOME \\`date\\` \\"test\\""');
});

test("args::unixJoin with accented characters", () => {
  equal(unixJoin(["echo", "café"]), "echo café");
});

test("args::unixJoin with German umlauts", () => {
  equal(unixJoin(["echo", "Größe"]), "echo Größe");
});

test("args::unixJoin with Greek letters", () => {
  equal(unixJoin(["echo", "αβγ"]), "echo αβγ");
});

test("args::unixJoin with Cyrillic letters", () => {
  equal(unixJoin(["echo", "привет"]), "echo привет");
});

test("args::unixJoin with emoji", () => {
  equal(unixJoin(["echo", "🎉"]), "echo 🎉");
});

test("args::unixJoin with CJK characters", () => {
  equal(unixJoin(["echo", "你好"]), "echo 你好");
});

test("args::unixJoin with Unicode and spaces", () => {
  equal(unixJoin(["echo", "café latte"]), 'echo "café latte"');
});

test("args::unixJoin with tabs", () => {
  equal(unixJoin(["echo", "hello\tworld"]), 'echo "hello\tworld"');
});

test("args::unixJoin with newlines", () => {
  equal(unixJoin(["echo", "line1\nline2"]), 'echo "line1\nline2"');
});

// join Tests (platform-dependent, but behavior is consistent)

test("args::join joins simple args without special chars", () => {
  equal(join(["foo", "bar", "baz"]), "foo bar baz");
});

test("args::join joins single arg", () => {
  equal(join(["hello"]), "hello");
});

test("args::join joins empty array", () => {
  equal(join([]), "");
});

test("args::join joins args with spaces", () => {
  equal(join(["foo", "bar baz"]), 'foo "bar baz"');
});

test("args::join with accented characters", () => {
  equal(join(["echo", "café"]), "echo café");
});
test("args::join with emoji", () => {
  equal(join(["echo", "🎉", "🚀"]), "echo 🎉 🚀");
});
test("args::join with CJK characters", () => {
  equal(join(["echo", "你好", "世界"]), "echo 你好 世界");
});

// Real-world command tests

test("args::join with git command", () => {
  equal(join(["git", "commit", "-m", "Initial commit"]), 'git commit -m "Initial commit"');
});

test("args::join with docker command", () => {
  equal(join(["docker", "run", "-d", "-p", "8080:80", "nginx"]), "docker run -d -p 8080:80 nginx");
});

test("args::join with npm command", () => {
  equal(join(["npm", "install", "--save-dev", "typescript"]), "npm install --save-dev typescript");
});

test("args::join with path containing spaces", () => {
  const result = join(["cat", "my documents/file.txt"]);
  equal(result, 'cat "my documents/file.txt"');
});

test("args::join with multiple quoted args", () => {
  equal(join(["echo", "hello world", "foo bar"]), 'echo "hello world" "foo bar"');
});
