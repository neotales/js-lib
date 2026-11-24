import { deepStrictEqual as equal, ok } from "@neotales/assert";
const nope = (value: unknown, message?: string) => ok(!value, message);
import { test } from "@neotales/test";
import { load } from "./load.ts";
import * as env from "@neotales/env";

test("dotenv::load basic", () => {
  const source = { LOAD_TEST_VAR1: "value1", LOAD_TEST_VAR2: "value2" };
  load(source);
  equal(env.get("LOAD_TEST_VAR1"), "value1");
  equal(env.get("LOAD_TEST_VAR2"), "value2");
  // Cleanup
  env.remove("LOAD_TEST_VAR1");
  env.remove("LOAD_TEST_VAR2");
});

test("dotenv::load with variable expansion", () => {
  env.set("LOAD_TEST_BASE", "/home");
  const source = { LOAD_TEST_PATH: "${LOAD_TEST_BASE}/user" };
  load(source);
  equal(env.get("LOAD_TEST_PATH"), "/home/user");
  // Cleanup
  env.remove("LOAD_TEST_BASE");
  env.remove("LOAD_TEST_PATH");
});

test("dotenv::load with skipExpansion", () => {
  env.set("LOAD_TEST_BASE2", "/home");
  const source = { LOAD_TEST_PATH2: "${LOAD_TEST_BASE2}/user" };
  load(source, { skipExpansion: true });
  equal(env.get("LOAD_TEST_PATH2"), "${LOAD_TEST_BASE2}/user");
  // Cleanup
  env.remove("LOAD_TEST_BASE2");
  env.remove("LOAD_TEST_PATH2");
});

test("dotenv::load with skipExisting overwrites by default", () => {
  env.set("LOAD_TEST_EXISTING", "original");
  const source = { LOAD_TEST_EXISTING: "new" };
  load(source);
  equal(env.get("LOAD_TEST_EXISTING"), "new");
  // Cleanup
  env.remove("LOAD_TEST_EXISTING");
});

test("dotenv::load with skipExisting=true preserves existing", () => {
  env.set("LOAD_TEST_EXISTING2", "original");
  const source = { LOAD_TEST_EXISTING2: "new" };
  load(source, { skipExisting: true });
  equal(env.get("LOAD_TEST_EXISTING2"), "original");
  // Cleanup
  env.remove("LOAD_TEST_EXISTING2");
});

test("dotenv::load with skipExisting=true sets new variables", () => {
  env.remove("LOAD_TEST_NEW");
  nope(env.has("LOAD_TEST_NEW"));
  const source = { LOAD_TEST_NEW: "value" };
  load(source, { skipExisting: true });
  ok(env.has("LOAD_TEST_NEW"));
  equal(env.get("LOAD_TEST_NEW"), "value");
  // Cleanup
  env.remove("LOAD_TEST_NEW");
});

test("dotenv::load empty source", () => {
  const source = {};
  load(source); // Should not throw
});

test("dotenv::load with default value expansion", () => {
  env.remove("LOAD_TEST_UNSET");
  const source = { LOAD_TEST_RESULT: "${LOAD_TEST_UNSET:-default_value}" };
  load(source);
  equal(env.get("LOAD_TEST_RESULT"), "default_value");
  // Cleanup
  env.remove("LOAD_TEST_RESULT");
});

test("dotenv::load with self-referencing variables", () => {
  const source = {
    LOAD_TEST_A: "first",
    LOAD_TEST_B: "${LOAD_TEST_A}/second",
  };
  load(source);
  equal(env.get("LOAD_TEST_A"), "first");
  equal(env.get("LOAD_TEST_B"), "first/second");
  // Cleanup
  env.remove("LOAD_TEST_A");
  env.remove("LOAD_TEST_B");
});

test("dotenv::load with multiple variables", () => {
  const source = {
    LOAD_TEST_M1: "value1",
    LOAD_TEST_M2: "value2",
    LOAD_TEST_M3: "value3",
    LOAD_TEST_M4: "value4",
  };
  load(source);
  equal(env.get("LOAD_TEST_M1"), "value1");
  equal(env.get("LOAD_TEST_M2"), "value2");
  equal(env.get("LOAD_TEST_M3"), "value3");
  equal(env.get("LOAD_TEST_M4"), "value4");
  // Cleanup
  env.remove("LOAD_TEST_M1");
  env.remove("LOAD_TEST_M2");
  env.remove("LOAD_TEST_M3");
  env.remove("LOAD_TEST_M4");
});

test("dotenv::load with special characters in value", () => {
  const source = {
    LOAD_TEST_SPECIAL: "value@#$%^&*()",
  };
  load(source, { skipExpansion: true });
  equal(env.get("LOAD_TEST_SPECIAL"), "value@#$%^&*()");
  // Cleanup
  env.remove("LOAD_TEST_SPECIAL");
});

test("dotenv::load with unicode values", () => {
  const source = {
    LOAD_TEST_UNICODE: "日本語テスト",
  };
  load(source, { skipExpansion: true });
  equal(env.get("LOAD_TEST_UNICODE"), "日本語テスト");
  // Cleanup
  env.remove("LOAD_TEST_UNICODE");
});

test("dotenv::load with emoji values", () => {
  const source = {
    LOAD_TEST_EMOJI: "🎉🚀✨",
  };
  load(source, { skipExpansion: true });
  equal(env.get("LOAD_TEST_EMOJI"), "🎉🚀✨");
  // Cleanup
  env.remove("LOAD_TEST_EMOJI");
});

test("dotenv::load with newlines in value", () => {
  const source = {
    LOAD_TEST_MULTILINE: "line1\nline2\nline3",
  };
  load(source, { skipExpansion: true });
  equal(env.get("LOAD_TEST_MULTILINE"), "line1\nline2\nline3");
  // Cleanup
  env.remove("LOAD_TEST_MULTILINE");
});

test("dotenv::load combined options", () => {
  env.set("LOAD_TEST_COMBINED", "original");
  const source = {
    LOAD_TEST_COMBINED: "new",
    LOAD_TEST_COMBINED_NEW: "${LOAD_TEST_COMBINED}",
  };
  load(source, { skipExisting: true, skipExpansion: true });
  equal(env.get("LOAD_TEST_COMBINED"), "original");
  equal(env.get("LOAD_TEST_COMBINED_NEW"), "${LOAD_TEST_COMBINED}");
  // Cleanup
  env.remove("LOAD_TEST_COMBINED");
  env.remove("LOAD_TEST_COMBINED_NEW");
});

test("dotenv::load with empty string value", () => {
  const source = {
    LOAD_TEST_EMPTY: "",
  };
  load(source);
  ok(env.has("LOAD_TEST_EMPTY"));
  equal(env.get("LOAD_TEST_EMPTY"), "");
  // Cleanup
  env.remove("LOAD_TEST_EMPTY");
});

test("dotenv::load with whitespace value", () => {
  const source = {
    LOAD_TEST_WHITESPACE: "   ",
  };
  load(source, { skipExpansion: true });
  equal(env.get("LOAD_TEST_WHITESPACE"), "   ");
  // Cleanup
  env.remove("LOAD_TEST_WHITESPACE");
});

test("dotenv::load with equals sign in value", () => {
  const source = {
    LOAD_TEST_EQUALS: "key=value",
  };
  load(source, { skipExpansion: true });
  equal(env.get("LOAD_TEST_EQUALS"), "key=value");
  // Cleanup
  env.remove("LOAD_TEST_EQUALS");
});

test("dotenv::load with URL value", () => {
  const source = {
    LOAD_TEST_URL: "https://example.com:8080/path?query=1",
  };
  load(source, { skipExpansion: true });
  equal(env.get("LOAD_TEST_URL"), "https://example.com:8080/path?query=1");
  // Cleanup
  env.remove("LOAD_TEST_URL");
});
