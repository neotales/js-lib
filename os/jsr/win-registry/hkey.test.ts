import { deepStrictEqual as equal } from "@neotales/assert";
import { test } from "@neotales/test";
import { hkeyToNative, isPredefinedHkey, pointerWidth } from "./hkey.ts";
import {
  HKEY_CLASSES_ROOT,
  HKEY_CURRENT_CONFIG,
  HKEY_CURRENT_USER,
  HKEY_LOCAL_MACHINE,
  HKEY_PERFORMANCE_DATA,
  HKEY_USERS,
} from "./types.ts";

test("pointerWidth maps the known runtime architecture names", () => {
  equal(pointerWidth("x64"), 64);
  equal(pointerWidth("x86_64"), 64);
  equal(pointerWidth("aarch64"), 64);
  equal(pointerWidth("arm64"), 64);
  equal(pointerWidth("ia32"), 32);
  equal(pointerWidth("x86"), 32);
  equal(pointerWidth("arm"), 32);
  equal(pointerWidth(undefined), 64);
});

test("predefined HKEY handles sign extend to the pointer width", () => {
  const roots: Array<[bigint, bigint]> = [
    [HKEY_CLASSES_ROOT, 0xffffffff80000000n],
    [HKEY_CURRENT_USER, 0xffffffff80000001n],
    [HKEY_LOCAL_MACHINE, 0xffffffff80000002n],
    [HKEY_USERS, 0xffffffff80000003n],
    [HKEY_PERFORMANCE_DATA, 0xffffffff80000004n],
    [HKEY_CURRENT_CONFIG, 0xffffffff80000005n],
  ];
  for (const [root, wide] of roots) {
    equal(hkeyToNative(root, 64), wide);
    equal(hkeyToNative(root, 32), root);
    equal(isPredefinedHkey(root), true);
  }
});

test("opened handles and unrelated values are left unchanged", () => {
  equal(hkeyToNative(0x1234n, 64), 0x1234n);
  equal(hkeyToNative(0x8000000an, 64), 0x8000000an);
  equal(hkeyToNative(0xffffffff80000001n, 64), 0xffffffff80000001n);
  equal(isPredefinedHkey(0x1234n), false);
  equal(isPredefinedHkey(0x8000000an), false);
});
