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
export declare function pointerWidth(arch: string | undefined): PointerWidth;
/**
 * Reports whether a value is one of the six predefined registry roots.
 *
 * Opened key handles are left untouched even if their numeric value happens
 * to fall in the predefined range.
 *
 * @param hkey The candidate handle.
 * @returns `true` for a predefined root.
 */
export declare function isPredefinedHkey(hkey: bigint): boolean;
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
export declare function hkeyToNative(hkey: bigint, width: PointerWidth): bigint;
