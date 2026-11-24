import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { expand } from "./expand.ts";
import * as env from "@neotales/env";

test("dotenv::expand basic variable", () => {
  env.set("EXPAND_TEST_VAR", "value");
  const source = { RESULT: "${EXPAND_TEST_VAR}" };
  const expanded = expand(source);
  equal(expanded.RESULT, "value");
  env.remove("EXPAND_TEST_VAR");
});

test("dotenv::expand with default value", () => {
  env.remove("EXPAND_TEST_UNSET");
  const source = { RESULT: "${EXPAND_TEST_UNSET:-default}" };
  const expanded = expand(source);
  equal(expanded.RESULT, "default");
});

test("dotenv::expand self-referencing", () => {
  const source = {
    BASE: "/home",
    PATH: "${BASE}/user",
  };
  const expanded = expand(source);
  equal(expanded.BASE, "/home");
  equal(expanded.PATH, "/home/user");
});

test("dotenv::expand chain of references", () => {
  const source = {
    A: "start",
    B: "${A}/middle",
    C: "${B}/end",
  };
  const expanded = expand(source);
  equal(expanded.A, "start");
  equal(expanded.B, "start/middle");
  equal(expanded.C, "start/middle/end");
});

test("dotenv::expand from environment", () => {
  env.set("EXPAND_TEST_ENV", "from_env");
  const source = {
    LOCAL: "local_value",
    COMBINED: "${EXPAND_TEST_ENV}/${LOCAL}",
  };
  const expanded = expand(source);
  equal(expanded.LOCAL, "local_value");
  equal(expanded.COMBINED, "from_env/local_value");
  env.remove("EXPAND_TEST_ENV");
});

test("dotenv::expand no variables", () => {
  const source = { KEY: "plain value" };
  const expanded = expand(source);
  equal(expanded.KEY, "plain value");
});

test("dotenv::expand empty source", () => {
  const source = {};
  const expanded = expand(source);
  equal(Object.keys(expanded).length, 0);
});

test("dotenv::expand multiple variables in one value", () => {
  env.set("EXPAND_TEST_FIRST", "Hello");
  env.set("EXPAND_TEST_SECOND", "World");
  const source = { GREETING: "${EXPAND_TEST_FIRST}, ${EXPAND_TEST_SECOND}!" };
  const expanded = expand(source);
  equal(expanded.GREETING, "Hello, World!");
  env.remove("EXPAND_TEST_FIRST");
  env.remove("EXPAND_TEST_SECOND");
});

test("dotenv::expand with assignment operator", () => {
  env.remove("EXPAND_TEST_ASSIGN");
  const source = { RESULT: "${EXPAND_TEST_ASSIGN:=assigned_value}" };
  const expanded = expand(source);
  equal(expanded.RESULT, "assigned_value");
  // Note: the assignment happens in the local map, not the global env
});

test("dotenv::expand preserves order", () => {
  const source = {
    FIRST: "1",
    SECOND: "${FIRST}2",
    THIRD: "${SECOND}3",
  };
  const expanded = expand(source);
  equal(expanded.FIRST, "1");
  equal(expanded.SECOND, "12");
  equal(expanded.THIRD, "123");
});

test("dotenv::expand with windows expansion option", () => {
  env.set("EXPAND_TEST_WIN", "windows_value");
  const source = { RESULT: "%EXPAND_TEST_WIN%" };
  const expanded = expand(source, { windowsExpansion: true });
  equal(expanded.RESULT, "windows_value");
  env.remove("EXPAND_TEST_WIN");
});

test("dotenv::expand with unicode values", () => {
  const source = {
    UNICODE: "日本語",
    COMBINED: "Text: ${UNICODE}",
  };
  const expanded = expand(source);
  equal(expanded.UNICODE, "日本語");
  equal(expanded.COMBINED, "Text: 日本語");
});

test("dotenv::expand with emoji values", () => {
  const source = {
    EMOJI: "🎉",
    MESSAGE: "Party ${EMOJI}!",
  };
  const expanded = expand(source);
  equal(expanded.EMOJI, "🎉");
  equal(expanded.MESSAGE, "Party 🎉!");
});

test("dotenv::expand with escaped dollar", () => {
  const source = { PRICE: "\\$100" };
  const expanded = expand(source);
  equal(expanded.PRICE, "$100");
});

test("dotenv::expand complex real-world example", () => {
  const originalHome = env.get("HOME");
  try {
    env.set("HOME", "/home/user");
    const source = {
      APP_NAME: "myapp",
      APP_ENV: "production",
      APP_ROOT: "${HOME}/apps/${APP_NAME}",
      LOG_PATH: "${APP_ROOT}/logs",
      CONFIG_PATH: "${APP_ROOT}/config/${APP_ENV}.json",
      DATABASE_URL: "postgres://localhost/${APP_NAME}_${APP_ENV}",
    };
    const expanded = expand(source);
    equal(expanded.APP_NAME, "myapp");
    equal(expanded.APP_ENV, "production");
    equal(expanded.APP_ROOT, "/home/user/apps/myapp");
    equal(expanded.LOG_PATH, "/home/user/apps/myapp/logs");
    equal(expanded.CONFIG_PATH, "/home/user/apps/myapp/config/production.json");
    equal(expanded.DATABASE_URL, "postgres://localhost/myapp_production");
  } finally {
    if (originalHome !== undefined) {
      env.set("HOME", originalHome);
    } else {
      env.remove("HOME");
    }
  }
});

test("dotenv::expand with custom get function", () => {
  const source = { RESULT: "${CUSTOM_VAR}" };
  const expanded = expand(source, {
    get: (key) => (key === "CUSTOM_VAR" ? "custom_value" : undefined),
  });
  equal(expanded.RESULT, "custom_value");
});

test("dotenv::expand does not mutate options", () => {
  const options = { windowsExpansion: true };
  expand({ VALUE: "test" }, options);
  equal(options, { windowsExpansion: true });
});

test("dotenv::expand with newlines in value", () => {
  const source = {
    MULTILINE: "line1\nline2",
    REF: "${MULTILINE}",
  };
  const expanded = expand(source);
  equal(expanded.MULTILINE, "line1\nline2");
  equal(expanded.REF, "line1\nline2");
});

test("dotenv::expand URL value", () => {
  const source = {
    HOST: "example.com",
    PORT: "8080",
    URL: "https://${HOST}:${PORT}/api",
  };
  const expanded = expand(source);
  equal(expanded.URL, "https://example.com:8080/api");
});

test("dotenv::expand with empty string value", () => {
  const source = {
    EMPTY: "",
    REF: "prefix${EMPTY}suffix",
  };
  const expanded = expand(source);
  equal(expanded.EMPTY, "");
  equal(expanded.REF, "prefixsuffix");
});

test("dotenv::expand preserves non-variable content", () => {
  const source = {
    JSON: '{"key": "value", "number": 123}',
  };
  const expanded = expand(source);
  equal(expanded.JSON, '{"key": "value", "number": 123}');
});
