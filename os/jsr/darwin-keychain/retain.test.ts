import { equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { retaining } from "./retain.ts";

test("darwin-keychain retaining keeps owners alive during a forced GC", (t) => {
  const bun = (globalThis as { Bun?: { gc?: (force: boolean) => void } }).Bun;
  const gc = bun?.gc ?? (globalThis as { gc?: (force: boolean) => void }).gc;
  if (!gc) t.skip("forced GC is only available on Bun or Node --expose-gc");
  const owners = [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])];
  const weak = owners.map((owner) => new WeakRef(owner));
  retaining(owners, () => {
    gc(true);
    equal(weak.every((ref) => ref.deref() !== undefined), true);
  });
});
