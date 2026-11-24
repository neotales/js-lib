/**
 * Pointer-width handling for predefined Windows registry handles.
 *
 * Windows declares the predefined roots as `((HKEY)(ULONG_PTR)((LONG)0x8000000x))`.
 * The cast sign-extends the 32-bit constant to the host pointer width: 32-bit
 * hosts pass `0x80000001`, 64-bit hosts pass `0xffffffff80000001`. Passing the
 * zero-extended `0x80000001` to a 64-bit API is wrong.
 *
 * @module
 * @internal
 */

import {
  HKEY_CLASSES_ROOT,
  HKEY_CURRENT_CONFIG,
  HKEY_CURRENT_USER,
  HKEY_LOCAL_MACHINE,
  HKEY_PERFORMANCE_DATA,
  HKEY_USERS,
} from "./types.ts";

/** A host pointer width in bits. */
export type PointerWidth = 32 | 64;

/**
 * Maps a runtime architecture name to its pointer width.
 *
 * Node, Bun, and Deno use different names for the same architectures. An
 * unknown name defaults to 64-bit, which is the only width the supported
 * Windows FFI runtimes currently ship.
 *
 * @param arch The runtime architecture string, such as `"x64"` or `"x86_64"`.
 * @returns The matching pointer width.
 */
export function pointerWidth(arch: string | undefined): PointerWidth {
  switch (arch) {
    case "ia32":
    case "x86":
    case "arm":
    case "armv7":
    case "mips":
    case "mipsel":
    case "ppc":
      return 32;
    default:
      return 64;
  }
}

/**
 * Reports whether a value is one of the six predefined registry roots.
 *
 * Opened key handles are left untouched even if their numeric value happens
 * to fall in the predefined range.
 *
 * @param hkey The candidate handle.
 * @returns `true` for a predefined root.
 */
export function isPredefinedHkey(hkey: bigint): boolean {
  switch (hkey) {
    case HKEY_CLASSES_ROOT:
    case HKEY_CURRENT_USER:
    case HKEY_LOCAL_MACHINE:
    case HKEY_USERS:
    case HKEY_PERFORMANCE_DATA:
    case HKEY_CURRENT_CONFIG:
      return true;
    default:
      return false;
  }
}

/**
 * Sign-extends a predefined 32-bit registry root to the host pointer width.
 *
 * Non-predefined values, including handles returned by `RegOpenKeyExW`, are
 * returned unchanged.
 *
 * @param hkey The registry handle.
 * @param width The host pointer width.
 * @returns The pointer-sized handle.
 */
export function hkeyToNative(hkey: bigint, width: PointerWidth): bigint {
  if (!isPredefinedHkey(hkey)) return hkey;
  // Avoid BigInt.asIntN/asUintN here: JerryScript 3.0.0 returns wrong values
  // for those builtins. The bitwise form is the same sign extension.
  const value = hkey & 0xffffffffn;
  if (width === 32) return value;
  return (value & 0x80000000n) === 0n
    ? value
    : value | 0xffffffff00000000n;
}
