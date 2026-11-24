/** Bun FFI backend for Windows Credential Manager. */

import type { RawCredential, WinCredentials } from "./types.ts";
import { stringToWide } from "./types.ts";
import { WIN_CRED_ERROR_NOT_FOUND, win32Failure } from "./win32.ts";

const specifier = "bun:ffi";
let ffi: any;

try {
  ffi = await import(/* @vite-ignore */ specifier);
} catch (cause) {
  throw new Error(`Unable to load ${specifier}. Run this backend in Bun.`, { cause });
}

const advapi32 = ffi.dlopen("advapi32.dll", {
  CredWriteW: { args: ["ptr", "u32"], returns: "i32" },
  CredReadW: { args: ["ptr", "u32", "u32", "ptr"], returns: "i32" },
  CredDeleteW: { args: ["ptr", "u32", "u32"], returns: "i32" },
  CredEnumerateW: { args: ["ptr", "u32", "ptr", "ptr"], returns: "i32" },
  CredFree: { args: ["ptr"], returns: "void" },
});
const kernel32 = ffi.dlopen("kernel32.dll", {
  GetLastError: { args: [], returns: "u32" },
});

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

function readWideString(pointer: number): string {
  if (pointer === 0)
    return "";

  const characters: number[] = [];
  for (let offset = 0;; offset += 2) {
    const low = ffi.read.u8(pointer, offset);
    const high = ffi.read.u8(pointer, offset + 1);
    if (low === 0 && high === 0)
      break;
    characters.push(low | (high << 8));
  }
  return String.fromCharCode(...characters);
}

function readBytes(pointer: number, length: number): Uint8Array {
  if (pointer === 0 || length === 0)
    return new Uint8Array();
  return new Uint8Array(ffi.toArrayBuffer(pointer, 0, length));
}

function parseCredential(pointer: number): RawCredential {
  const credentialBlobSize = ffi.read.u32(pointer, OFF_BLOB_SIZE);
  return {
    flags: ffi.read.u32(pointer, OFF_FLAGS),
    type: ffi.read.u32(pointer, OFF_TYPE),
    targetName: readWideString(Number(ffi.read.ptr(pointer, OFF_TARGET_NAME))),
    comment: readWideString(Number(ffi.read.ptr(pointer, OFF_COMMENT))),
    lastWritten: ffi.read.u64(pointer, OFF_LAST_WRITTEN),
    credentialBlobSize,
    credentialBlob: readBytes(Number(ffi.read.ptr(pointer, OFF_BLOB)), credentialBlobSize),
    persist: ffi.read.u32(pointer, OFF_PERSIST),
    attributeCount: ffi.read.u32(pointer, OFF_ATTR_COUNT),
    targetAlias: readWideString(Number(ffi.read.ptr(pointer, OFF_TARGET_ALIAS))),
    userName: readWideString(Number(ffi.read.ptr(pointer, OFF_USER_NAME))),
  };
}

function credentialBuffer(
  credential: RawCredential,
): { buffer: Uint8Array; references: Uint8Array[] } {
  const references: Uint8Array[] = [];
  const buffer = new Uint8Array(SIZEOF_CREDENTIALW);
  const view = new DataView(buffer.buffer);
  view.setUint32(OFF_FLAGS, credential.flags, true);
  view.setUint32(OFF_TYPE, credential.type, true);

  const targetName = stringToWide(credential.targetName);
  references.push(targetName);
  view.setBigUint64(OFF_TARGET_NAME, BigInt(ffi.ptr(targetName)), true);
  const comment = stringToWide(credential.comment);
  references.push(comment);
  view.setBigUint64(OFF_COMMENT, BigInt(ffi.ptr(comment)), true);
  view.setBigUint64(OFF_LAST_WRITTEN, credential.lastWritten, true);
  view.setUint32(OFF_BLOB_SIZE, credential.credentialBlob.length, true);
  references.push(credential.credentialBlob);
  if (credential.credentialBlob.length > 0)
    view.setBigUint64(OFF_BLOB, BigInt(ffi.ptr(credential.credentialBlob)), true);
  view.setUint32(OFF_PERSIST, credential.persist, true);
  view.setUint32(OFF_ATTR_COUNT, 0, true);

  const targetAlias = stringToWide(credential.targetAlias);
  references.push(targetAlias);
  if (credential.targetAlias)
    view.setBigUint64(OFF_TARGET_ALIAS, BigInt(ffi.ptr(targetAlias)), true);
  const userName = stringToWide(credential.userName);
  references.push(userName);
  if (credential.userName)
    view.setBigUint64(OFF_USER_NAME, BigInt(ffi.ptr(userName)), true);
  return { buffer, references };
}

/** Raw Credential Manager operations implemented through Bun FFI. */
export const backend: WinCredentials = {
  write(credential, flags): void {
    const native = credentialBuffer(credential);
    const success = advapi32.symbols.CredWriteW(ffi.ptr(native.buffer), flags);
    void native.references;
    if (!success)
      throw new Error(`CredWriteW failed with Win32 error ${kernel32.symbols.GetLastError()}`);
  },
  read(targetName, type): RawCredential | null {
    const target = stringToWide(targetName);
    const output = new Uint8Array(8);
    const success = advapi32.symbols.CredReadW(ffi.ptr(target), type, 0, ffi.ptr(output));
    if (!success) {
      const code = kernel32.symbols.GetLastError();
      if (code === WIN_CRED_ERROR_NOT_FOUND) return null;
      throw win32Failure("CredReadW", code);
    }
    const pointer = Number(new DataView(output.buffer).getBigUint64(0, true));
    try {
      return parseCredential(pointer);
    } finally {
      advapi32.symbols.CredFree(pointer);
    }
  },
  delete(targetName, type): boolean {
    if (advapi32.symbols.CredDeleteW(ffi.ptr(stringToWide(targetName)), type, 0)) return true;
    const code = kernel32.symbols.GetLastError();
    if (code === WIN_CRED_ERROR_NOT_FOUND) return false;
    throw win32Failure("CredDeleteW", code);
  },
  enumerate(filter, flags): RawCredential[] {
    const countBuffer = new Uint8Array(4);
    const output = new Uint8Array(8);
    const filterBuffer = filter === null ? null : stringToWide(filter);
    const success = advapi32.symbols.CredEnumerateW(
      filterBuffer === null ? null : ffi.ptr(filterBuffer),
      flags,
      ffi.ptr(countBuffer),
      ffi.ptr(output),
    );
    if (!success) {
      const code = kernel32.symbols.GetLastError();
      if (code === WIN_CRED_ERROR_NOT_FOUND) return [];
      throw win32Failure("CredEnumerateW", code);
    }
    const count = new DataView(countBuffer.buffer).getUint32(0, true);
    const pointers = Number(new DataView(output.buffer).getBigUint64(0, true));
    const credentials: RawCredential[] = [];
    try {
      for (let index = 0; index < count; index++)
        credentials.push(parseCredential(Number(ffi.read.ptr(pointers, index * 8))));
    } finally {
      advapi32.symbols.CredFree(pointers);
    }
    return credentials;
  },
};
