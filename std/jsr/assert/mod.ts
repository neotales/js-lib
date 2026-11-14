// Asserts the published tests already call. No node: and no process: Ende has neither.

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

export function fail(message?: string): never {
  throw new AssertionError(message ?? "failed");
}

export function ok(value: unknown, message?: string): void {
  if (!value) fail(message ?? `expected truthy, got ${seen(value)}`);
}

export function strictEqual(actual: unknown, expected: unknown, message?: string): void {
  if (!Object.is(actual, expected)) {
    fail(message ?? `expected ${seen(expected)}, got ${seen(actual)}`);
  }
}

// Strict. The published tests import this name from node:assert/strict.
export function equal(actual: unknown, expected: unknown, message?: string): void {
  strictEqual(actual, expected, message);
}

export function deepStrictEqual(actual: unknown, expected: unknown, message?: string): void {
  if (!same(actual, expected)) {
    fail(message ?? `expected ${seen(expected)}, got ${seen(actual)}`);
  }
}

export function notDeepStrictEqual(actual: unknown, expected: unknown, message?: string): void {
  if (same(actual, expected)) fail(message ?? "expected values to differ");
}

export function deepEqual(actual: unknown, expected: unknown, message?: string): void {
  deepStrictEqual(actual, expected, message);
}

export function throws(fn: () => unknown, message?: string): void {
  try {
    fn();
  } catch {
    return;
  }
  fail(message ?? "expected a throw");
}

export function match(value: string, regexp: RegExp, message?: string): void {
  if (!regexp.test(value)) fail(message ?? `${seen(value)} did not match ${regexp}`);
}

// Returns a promise. The chars runner does not wait on one. A test that calls
// this and returns the promise fails closed until a lane can wait without
// top-level await.
export function rejects(fn: () => Promise<unknown>, message?: string): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(
      () => fail(message ?? "expected a rejection"),
      () => undefined,
    );
}

function same(actual: unknown, expected: unknown): boolean {
  if (Object.is(actual, expected)) return true;
  if (typeof actual !== "object" || typeof expected !== "object") return false;
  if (actual === null || expected === null) return false;
  if (actual.constructor !== expected.constructor) return false;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) {
      return false;
    }
    for (let i = 0; i < actual.length; i++) {
      if (!same(actual[i], expected[i])) return false;
    }
    return true;
  }
  if (ArrayBuffer.isView(actual) || ArrayBuffer.isView(expected)) {
    if (!ArrayBuffer.isView(actual) || !ArrayBuffer.isView(expected)) return false;
    if (actual.constructor !== expected.constructor || actual.byteLength !== expected.byteLength) {
      return false;
    }
    const left = new Uint8Array(actual.buffer, actual.byteOffset, actual.byteLength);
    const right = new Uint8Array(expected.buffer, expected.byteOffset, expected.byteLength);
    for (let i = 0; i < left.length; i++) {
      if (left[i] !== right[i]) return false;
    }
    return true;
  }
  const leftKeys = Object.keys(actual as object);
  const rightKeys = Object.keys(expected as object);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (!Object.hasOwn(expected as object, key)) return false;
    if (!same((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key])) {
      return false;
    }
  }
  return true;
}

function seen(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "symbol") return value.toString();
  if (value === undefined) return "undefined";
  if (typeof value === "function") return "[function]";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
