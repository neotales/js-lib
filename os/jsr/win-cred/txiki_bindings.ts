/**
 * txiki.js `tjs:ffi` bindings for Windows Credential Manager.
 *
 * The native symbol table and backend implementation are separate from the
 * `tjs:ffi` loader so the bindings can be tested on a host without the
 * txiki.js binary. Credential structures stay in the 64-bit Windows ABI used
 * by the published txiki.js Windows build; pointer fields are rebuilt with
 * `createPointer`, and wide strings use the `buffer` argument type.
 *
 * @module
 * @internal
 */

import type { RawCredential, WinCredentials } from "./types.ts";
import { stringToWide } from "./types.ts";
import { WIN_CRED_ERROR_NOT_FOUND, win32Failure } from "./win32.ts";

/** An opened `tjs:ffi` library. */
export interface TxikiLibrary {
  /** The resolved FFI entry points, keyed by symbol name. */
  symbols: Record<string, (...args: unknown[]) => unknown>;
  /** Unloads the library. */
  close(): void;
}

/** A native pointer as exposed by `tjs:ffi` 26.11.0. */
export interface TxikiPointer {
  /** The raw address. */
  readonly value: bigint;
  /** A zero-copy view of native memory. */
  toUint8Array(byteLength: number, byteOffset?: number): Uint8Array;
}

/** The subset of the `tjs:ffi` module surface used by this backend. */
export interface TxikiFfiModule {
  /** Rebuilds a native pointer from a BigInt address. */
  createPointer(value: bigint): TxikiPointer | null;
  /** Returns a pointer to a JavaScript buffer's backing memory. */
  bufferToPointer(buffer: Uint8Array): TxikiPointer | null;
  /** Opens a shared library and binds its symbols. */
  dlopen(
    name: string,
    symbols: Record<string, { args?: string[]; returns?: string }>,
  ): TxikiLibrary;
  /** Direct native memory reads. */
  read: {
    u8(pointer: TxikiPointer, offset?: number): number;
    u32(pointer: TxikiPointer, offset?: number): number;
    ptr(pointer: TxikiPointer, offset?: number): TxikiPointer | null;
  };
}

/**
 * The `advapi32.dll` symbol table requested from `tjs:ffi`.
 *
 * `buffer` passes a pointer to a `Uint8Array`; `ptr` accepts a `NativePointer`
 * or `null`. All strings are null-terminated UTF-16LE buffers.
 */
export const TXIKI_SYMBOLS: Record<string, { args?: string[]; returns?: string }> = {
  CredWriteW: { args: ["buffer", "u32"], returns: "i32" },
  CredReadW: { args: ["buffer", "u32", "u32", "buffer"], returns: "i32" },
  CredDeleteW: { args: ["buffer", "u32", "u32"], returns: "i32" },
  CredEnumerateW: { args: ["ptr", "u32", "buffer", "buffer"], returns: "i32" },
  CredFree: { args: ["ptr"], returns: "void" },
};

/** The `kernel32.dll` symbol table requested from `tjs:ffi`. */
export const TXIKI_KERNEL32_SYMBOLS: Record<string, { args?: string[]; returns?: string }> = {
  GetLastError: { args: [], returns: "u32" },
};

// CREDENTIALW on the 64-bit Windows ABI. The published txiki.js Windows build
// is x86_64 only, so the 32-bit layout is not selected here.
const SIZEOF_CREDENTIALW = 80;
const OFF_FLAGS = 0;
const OFF_TYPE = 4;
const OFF_TARGET_NAME = 8;
const OFF_COMMENT = 16;
const OFF_LAST_WRITTEN = 24;
const OFF_BLOB_SIZE = 32;
const OFF_BLOB = 40;
const OFF_PERSIST = 48;
const OFF_ATTR_COUNT = 52;
const OFF_TARGET_ALIAS = 64;
const OFF_USER_NAME = 72;

function pointerAddress(pointer: TxikiPointer | null): bigint {
  return pointer === null ? 0n : pointer.value;
}

function readWideString(ffi: TxikiFfiModule, pointer: TxikiPointer | null): string {
  if (pointer === null) return "";
  const characters: number[] = [];
  for (let offset = 0;; offset += 2) {
    const low = ffi.read.u8(pointer, offset);
    const high = ffi.read.u8(pointer, offset + 1);
    if (low === 0 && high === 0) break;
    characters.push(low | (high << 8));
  }
  return String.fromCharCode(...characters);
}

function readBytes(
  ffi: TxikiFfiModule,
  pointer: TxikiPointer | null,
  length: number,
): Uint8Array {
  if (pointer === null || length === 0) return new Uint8Array(0);
  const view = pointer.toUint8Array(length);
  const copy = new Uint8Array(length);
  copy.set(view);
  const buffer = view.buffer as ArrayBuffer & { detach?: () => void };
  buffer.detach?.();
  return copy;
}

function readU64(ffi: TxikiFfiModule, pointer: TxikiPointer, offset: number): bigint {
  return BigInt(ffi.read.u32(pointer, offset)) |
    (BigInt(ffi.read.u32(pointer, offset + 4)) << 32n);
}

function parseCredential(ffi: TxikiFfiModule, pointer: TxikiPointer): RawCredential {
  const credentialBlobSize = ffi.read.u32(pointer, OFF_BLOB_SIZE);
  return {
    flags: ffi.read.u32(pointer, OFF_FLAGS),
    type: ffi.read.u32(pointer, OFF_TYPE),
    targetName: readWideString(ffi, ffi.read.ptr(pointer, OFF_TARGET_NAME)),
    comment: readWideString(ffi, ffi.read.ptr(pointer, OFF_COMMENT)),
    lastWritten: readU64(ffi, pointer, OFF_LAST_WRITTEN),
    credentialBlobSize,
    credentialBlob: readBytes(ffi, ffi.read.ptr(pointer, OFF_BLOB), credentialBlobSize),
    persist: ffi.read.u32(pointer, OFF_PERSIST),
    attributeCount: ffi.read.u32(pointer, OFF_ATTR_COUNT),
    targetAlias: readWideString(ffi, ffi.read.ptr(pointer, OFF_TARGET_ALIAS)),
    userName: readWideString(ffi, ffi.read.ptr(pointer, OFF_USER_NAME)),
  };
}

function credentialBuffer(
  ffi: TxikiFfiModule,
  credential: RawCredential,
): { buffer: Uint8Array; references: Uint8Array[] } {
  const references: Uint8Array[] = [];
  const buffer = new Uint8Array(SIZEOF_CREDENTIALW);
  const view = new DataView(buffer.buffer);
  view.setUint32(OFF_FLAGS, credential.flags, true);
  view.setUint32(OFF_TYPE, credential.type, true);

  const targetName = stringToWide(credential.targetName);
  references.push(targetName);
  view.setBigUint64(
    OFF_TARGET_NAME,
    pointerAddress(ffi.bufferToPointer(targetName)),
    true,
  );
  const comment = stringToWide(credential.comment);
  references.push(comment);
  view.setBigUint64(OFF_COMMENT, pointerAddress(ffi.bufferToPointer(comment)), true);
  view.setBigUint64(OFF_LAST_WRITTEN, credential.lastWritten, true);
  view.setUint32(OFF_BLOB_SIZE, credential.credentialBlob.length, true);
  references.push(credential.credentialBlob);
  if (credential.credentialBlob.length > 0) {
    view.setBigUint64(
      OFF_BLOB,
      pointerAddress(ffi.bufferToPointer(credential.credentialBlob)),
      true,
    );
  }
  view.setUint32(OFF_PERSIST, credential.persist, true);
  view.setUint32(OFF_ATTR_COUNT, 0, true);

  const targetAlias = stringToWide(credential.targetAlias);
  references.push(targetAlias);
  if (credential.targetAlias) {
    view.setBigUint64(
      OFF_TARGET_ALIAS,
      pointerAddress(ffi.bufferToPointer(targetAlias)),
      true,
    );
  }
  const userName = stringToWide(credential.userName);
  references.push(userName);
  if (credential.userName) {
    view.setBigUint64(
      OFF_USER_NAME,
      pointerAddress(ffi.bufferToPointer(userName)),
      true,
    );
  }
  return { buffer, references };
}

/**
 * Creates the txiki.js Credential Manager backend and lifecycle helpers around
 * an already loaded `tjs:ffi` module.
 *
 * The returned functions share lazily opened `advapi32.dll` and `kernel32.dll`
 * handles. {@link close} unloads both, and a later call reopens them.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export function createTxikiBackend(ffi: TxikiFfiModule): {
  backend: WinCredentials;
  open(): void;
  isOpened(): boolean;
  close(): void;
} {
  let advapi32: TxikiLibrary | null = null;
  let kernel32: TxikiLibrary | null = null;

  function ensure(): { advapi32: TxikiLibrary; kernel32: TxikiLibrary } {
    if (advapi32 === null) advapi32 = ffi.dlopen("advapi32.dll", TXIKI_SYMBOLS);
    if (kernel32 === null) kernel32 = ffi.dlopen("kernel32.dll", TXIKI_KERNEL32_SYMBOLS);
    return { advapi32, kernel32 };
  }

  const backend: WinCredentials = {
    write(credential, flags): void {
      const libs = ensure();
      const native = credentialBuffer(ffi, credential);
      const success = libs.advapi32.symbols.CredWriteW(native.buffer, flags);
      void native.references;
      if (!success) {
        throw new Error(
          `CredWriteW failed with Win32 error ${libs.kernel32.symbols.GetLastError()}`,
        );
      }
    },
    read(targetName, type): RawCredential | null {
      const libs = ensure();
      const out = new Uint8Array(8);
      const success = libs.advapi32.symbols.CredReadW(
        stringToWide(targetName),
        type,
        0,
        out,
      );
      if (!success) {
        const code = libs.kernel32.symbols.GetLastError() as number;
        if (code === WIN_CRED_ERROR_NOT_FOUND) return null;
        throw win32Failure("CredReadW", code);
      }
      const pointer = ffi.read.ptr(ffi.bufferToPointer(out)!, 0);
      if (pointer === null) return null;
      try {
        return parseCredential(ffi, pointer);
      } finally {
        libs.advapi32.symbols.CredFree(pointer);
      }
    },
    delete(targetName, type): boolean {
      const libs = ensure();
      if (libs.advapi32.symbols.CredDeleteW(stringToWide(targetName), type, 0)) return true;
      const code = libs.kernel32.symbols.GetLastError() as number;
      if (code === WIN_CRED_ERROR_NOT_FOUND) return false;
      throw win32Failure("CredDeleteW", code);
    },
    enumerate(filter, flags): RawCredential[] {
      const libs = ensure();
      const countBuffer = new Uint8Array(4);
      const out = new Uint8Array(8);
      const filterBuffer = filter === null ? null : stringToWide(filter);
      const success = libs.advapi32.symbols.CredEnumerateW(
        filterBuffer === null ? null : ffi.bufferToPointer(filterBuffer),
        flags,
        countBuffer,
        out,
      );
      if (!success) {
        const code = libs.kernel32.symbols.GetLastError() as number;
        if (code === WIN_CRED_ERROR_NOT_FOUND) return [];
        throw win32Failure("CredEnumerateW", code);
      }
      const count = new DataView(countBuffer.buffer).getUint32(0, true);
      const arrayPointer = ffi.read.ptr(ffi.bufferToPointer(out)!, 0);
      if (arrayPointer === null) return [];
      const credentials: RawCredential[] = [];
      try {
        for (let index = 0; index < count; index++) {
          const pointer = ffi.read.ptr(arrayPointer, index * 8);
          if (pointer !== null) credentials.push(parseCredential(ffi, pointer));
        }
      } finally {
        libs.advapi32.symbols.CredFree(arrayPointer);
      }
      return credentials;
    },
  };

  return {
    backend,
    open(): void {
      ensure();
    },
    isOpened(): boolean {
      return advapi32 !== null && kernel32 !== null;
    },
    close(): void {
      advapi32?.close();
      kernel32?.close();
      advapi32 = null;
      kernel32 = null;
    },
  };
}
