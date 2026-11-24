/**
 * txiki.js `tjs:ffi` bindings for Linux libsecret.
 *
 * The native symbol table and backend implementation are separate from the
 * `tjs:ffi` loader so the bindings can be tested on a host without the
 * txiki.js binary. C strings use the `buffer` argument type, nullable handles
 * use `ptr`, and returned `GError` values are read from the caller's pointer
 * buffer and freed with `g_error_free`.
 *
 * @module
 * @internal
 */

import {
  GCancellableHandle,
  type LibsecretBindings,
  LibsecretErrorHandle,
  prepareGCancellable,
  prepareLibsecretError,
  releaseGCancellable,
  SecretPasswordHandle,
  type SecretRecord,
  SecretSchemaHandle,
  setLibsecretError,
} from "./types.ts";
import {
  copyExactBytes,
  detectEndianness,
  type Endianness,
  readGSize,
  requireLibsecretAbi,
  widthFromByteSize,
} from "./abi.ts";
import { decodeUtf8 } from "./encoding.ts";

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
}

/** The subset of the `tjs:ffi` module surface used by this backend. */
export interface TxikiFfiModule {
  /** Runtime FFI type descriptors; pointer.size and size.size are process ABI. */
  types?: {
    pointer?: { size?: number };
    size?: { size?: number };
  };
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
    ptr(pointer: TxikiPointer, offset?: number): TxikiPointer | null;
  };
}

/** The `libsecret-1.so.0` symbol table requested from `tjs:ffi`. */
export const TXIKI_LIBSECRET_SYMBOLS: Record<string, { args?: string[]; returns?: string }> = {
  secret_schema_new: {
    args: ["buffer", "u32", "buffer", "u32", "buffer", "u32", "ptr"],
    returns: "ptr",
  },
  secret_password_lookup_sync: {
    args: ["ptr", "ptr", "buffer", "buffer", "buffer", "buffer", "buffer", "ptr"],
    returns: "ptr",
  },
  secret_password_store_sync: {
    args: [
      "ptr",
      "buffer",
      "buffer",
      "buffer",
      "ptr",
      "buffer",
      "buffer",
      "buffer",
      "buffer",
      "buffer",
      "ptr",
    ],
    returns: "i32",
  },
  secret_password_clear_sync: {
    args: ["ptr", "ptr", "buffer", "buffer", "buffer", "buffer", "buffer", "ptr"],
    returns: "i32",
  },
  secret_password_search_sync: {
    args: ["ptr", "u32", "ptr", "buffer", "buffer", "buffer", "ptr"],
    returns: "ptr",
  },
  secret_retrievable_get_attributes: { args: ["ptr"], returns: "ptr" },
  secret_retrievable_retrieve_secret_sync: { args: ["ptr", "ptr", "buffer"], returns: "ptr" },
  secret_value_get: { args: ["ptr", "buffer"], returns: "ptr" },
  secret_value_unref: { args: ["ptr"], returns: "void" },
  secret_password_free: { args: ["ptr"], returns: "void" },
};

/** The `libglib-2.0.so.0` symbol table requested from `tjs:ffi`. */
export const TXIKI_GLIB_SYMBOLS: Record<string, { args?: string[]; returns?: string }> = {
  g_error_free: { args: ["ptr"], returns: "void" },
  g_hash_table_lookup: { args: ["ptr", "buffer"], returns: "ptr" },
  g_hash_table_unref: { args: ["ptr"], returns: "void" },
  g_list_free: { args: ["ptr"], returns: "void" },
};

/** The optional `libgio-2.0.so.0` symbol table requested from `tjs:ffi`. */
export const TXIKI_GIO_SYMBOLS: Record<string, { args?: string[]; returns?: string }> = {
  g_cancellable_new: { args: [], returns: "ptr" },
  g_cancellable_cancel: { args: ["ptr"], returns: "void" },
};

/** The `libgobject-2.0.so.0` symbol table requested from `tjs:ffi`. */
export const TXIKI_GOBJECT_SYMBOLS: Record<string, { args?: string[]; returns?: string }> = {
  g_object_unref: { args: ["ptr"], returns: "void" },
};


function pointerFromBuffer(ffi: TxikiFfiModule, buffer: Uint8Array): TxikiPointer | null {
  return ffi.read.ptr(ffi.bufferToPointer(buffer)!, 0);
}

function cstr(value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  const result = new Uint8Array(bytes.length + 1);
  result.set(bytes);
  return result;
}

/**
 * Creates the txiki.js libsecret backend and lifecycle helpers around an
 * already loaded `tjs:ffi` module.
 *
 * @param ffi The loaded `tjs:ffi` module.
 * @returns The backend plus `open`, `isOpened`, and `close`.
 */
export function createTxikiBackend(
  ffi: TxikiFfiModule,
  options: { endianness?: Endianness | null } = {},
): {
  backend: LibsecretBindings;
  open(): void;
  isOpened(): boolean;
  close(): void;
} {
  let libsecret: TxikiLibrary | null = null;
  let glib: TxikiLibrary | null = null;
  let gobject: TxikiLibrary | null = null;
  let gio: TxikiLibrary | null | undefined;
  const runtime = "tjs" as const;

  const pointerSize = ffi.types?.pointer?.size;
  const sizeSize = ffi.types?.size?.size;
  const detectedWidth = pointerSize !== undefined && pointerSize === sizeSize
    ? widthFromByteSize(pointerSize)
    : null;
  let abiError: Error | null = null;
  let abiWidth: 64 | null = null;
  try {
    abiWidth = requireLibsecretAbi(
      detectedWidth,
      options.endianness !== undefined ? options.endianness : detectEndianness(),
    );
  } catch (error) {
    abiError = error instanceof Error ? error : new Error(String(error));
  }

  function assertAbi(): void {
    if (abiError !== null) throw abiError;
  }

  function verifiedWidth(): 64 {
    assertAbi();
    return abiWidth!;
  }

  function ensureGio(): TxikiLibrary | null {
    if (gio === undefined) {
      try {
        gio = ffi.dlopen("libgio-2.0.so.0", TXIKI_GIO_SYMBOLS);
      } catch {
        gio = null;
      }
    }
    return gio;
  }

  function ensure(): {
    libsecret: TxikiLibrary;
    glib: TxikiLibrary;
    gobject: TxikiLibrary;
  } {
    if (libsecret === null) {
      libsecret = ffi.dlopen("libsecret-1.so.0", TXIKI_LIBSECRET_SYMBOLS);
    }
    if (glib === null) glib = ffi.dlopen("libglib-2.0.so.0", TXIKI_GLIB_SYMBOLS);
    if (gobject === null) {
      gobject = ffi.dlopen("libgobject-2.0.so.0", TXIKI_GOBJECT_SYMBOLS);
    }
    return { libsecret, glib, gobject };
  }

  function readCString(pointer: TxikiPointer): Uint8Array {
    const bytes: number[] = [];
    for (let index = 0; ; index++) {
      const value = ffi.read.u8(pointer, index);
      if (value === 0) return new Uint8Array(bytes);
      bytes.push(value);
    }
  }

  function schemaPointer(handle: SecretSchemaHandle): TxikiPointer {
    const pointer = handle.valueOf();
    if (handle.runtime !== runtime || typeof pointer !== "object" || pointer === null) {
      throw new TypeError("Secret schema handle belongs to a different runtime.");
    }
    return pointer as TxikiPointer;
  }

  function passwordPointer(handle: SecretPasswordHandle): TxikiPointer {
    const pointer = handle.valueOf();
    if (handle.runtime !== runtime || typeof pointer !== "object" || pointer === null) {
      throw new TypeError("Secret password handle belongs to a different runtime.");
    }
    return pointer as TxikiPointer;
  }

  function cancellablePointer(handle: GCancellableHandle): TxikiPointer {
    prepareGCancellable(handle, runtime);
    const pointer = handle.valueOf();
    if (typeof pointer !== "object" || pointer === null) {
      throw new TypeError("GCancellable handle belongs to a different runtime.");
    }
    return pointer as TxikiPointer;
  }

  function captureError(
    errorOut: LibsecretErrorHandle,
    errorStorage: Uint8Array,
  ): void {
    const { glib } = ensure();
    const pointer = pointerFromBuffer(ffi, errorStorage);
    if (pointer === null) return;
    let message = "Unknown libsecret error";
    try {
      const messagePointer = ffi.read.ptr(pointer, 8);
      message = messagePointer === null
        ? message
        : new TextDecoder().decode(readCString(messagePointer));
    } finally {
      glib.symbols.g_error_free(pointer);
    }
    setLibsecretError(errorOut, new Error(message || "Unknown libsecret error"));
  }

  function secretSchemaNew(
    name: string,
    flags: number,
    attributeName1: string,
    attributeType1: number,
    attributeName2: string,
    attributeType2: number,
    terminator: null,
  ): SecretSchemaHandle | null {
    assertAbi();
    const { libsecret } = ensure();
    if (terminator !== null) {
      throw new TypeError("The libsecret attribute terminator must be null.");
    }
    const owners = [cstr(name), cstr(attributeName1), cstr(attributeName2)];
    const pointer = libsecret.symbols.secret_schema_new(
      owners[0],
      flags,
      owners[1],
      attributeType1,
      owners[2],
      attributeType2,
      null,
    ) as TxikiPointer | null;
    void owners;
    return pointer === null ? null : new SecretSchemaHandle(runtime, pointer);
  }

  function secretPasswordLookupSync(
    schema: SecretSchemaHandle,
    cancellable: GCancellableHandle | null,
    errorOut: LibsecretErrorHandle,
    attributeName1: string,
    attributeValue1: string,
    attributeName2: string,
    attributeValue2: string,
    terminator: null,
  ): SecretPasswordHandle | null {
    assertAbi();
    const { libsecret } = ensure();
    if (terminator !== null) {
      throw new TypeError("The libsecret attribute terminator must be null.");
    }
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const owners = [
      cstr(attributeName1),
      cstr(attributeValue1),
      cstr(attributeName2),
      cstr(attributeValue2),
    ];
    const pointer = libsecret.symbols.secret_password_lookup_sync(
      schemaPointer(schema),
      cancellable === null ? null : cancellablePointer(cancellable),
      errorStorage,
      owners[0],
      owners[1],
      owners[2],
      owners[3],
      null,
    ) as TxikiPointer | null;
    void owners;
    captureError(errorOut, errorStorage);
    if (pointer === null) return null;
    let text: string;
    try {
      text = decodeUtf8(readCString(pointer), "secret");
    } catch (error) {
      libsecret.symbols.secret_password_free(pointer);
      throw error;
    }
    return new SecretPasswordHandle(runtime, pointer, text);
  }

  function secretPasswordStoreSync(
    schema: SecretSchemaHandle,
    collection: string,
    label: string,
    password: string,
    cancellable: GCancellableHandle | null,
    errorOut: LibsecretErrorHandle,
    attributeName1: string,
    attributeValue1: string,
    attributeName2: string,
    attributeValue2: string,
    terminator: null,
  ): boolean {
    assertAbi();
    const { libsecret } = ensure();
    if (terminator !== null) {
      throw new TypeError("The libsecret attribute terminator must be null.");
    }
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const owners = [
      cstr(collection),
      cstr(label),
      cstr(password),
      cstr(attributeName1),
      cstr(attributeValue1),
      cstr(attributeName2),
      cstr(attributeValue2),
    ];
    const stored = libsecret.symbols.secret_password_store_sync(
      schemaPointer(schema),
      owners[0],
      owners[1],
      owners[2],
      cancellable === null ? null : cancellablePointer(cancellable),
      errorStorage,
      owners[3],
      owners[4],
      owners[5],
      owners[6],
      null,
    ) as number;
    void owners;
    captureError(errorOut, errorStorage);
    return Boolean(stored);
  }

  function secretPasswordClearSync(
    schema: SecretSchemaHandle,
    cancellable: GCancellableHandle | null,
    errorOut: LibsecretErrorHandle,
    attributeName1: string,
    attributeValue1: string,
    attributeName2: string,
    attributeValue2: string,
    terminator: null,
  ): boolean {
    assertAbi();
    const { libsecret } = ensure();
    if (terminator !== null) {
      throw new TypeError("The libsecret attribute terminator must be null.");
    }
    prepareLibsecretError(errorOut, runtime);
    const errorStorage = new Uint8Array(8);
    const owners = [
      cstr(attributeName1),
      cstr(attributeValue1),
      cstr(attributeName2),
      cstr(attributeValue2),
    ];
    const cleared = libsecret.symbols.secret_password_clear_sync(
      schemaPointer(schema),
      cancellable === null ? null : cancellablePointer(cancellable),
      errorStorage,
      owners[0],
      owners[1],
      owners[2],
      owners[3],
      null,
    ) as number;
    void owners;
    captureError(errorOut, errorStorage);
    return Boolean(cleared);
  }

  function secretPasswordFree(password: SecretPasswordHandle): void {
    assertAbi();
    assertAbi();
    const { libsecret } = ensure();
    libsecret.symbols.secret_password_free(passwordPointer(password));
  }

  function cancellableNew(): GCancellableHandle {
    assertAbi();
    assertAbi();
    const gioLibrary = ensureGio();
    if (gioLibrary === null) {
      throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    }
    const pointer = gioLibrary.symbols.g_cancellable_new() as TxikiPointer | null;
    if (pointer === null) throw new Error("Failed to create GCancellable.");
    return new GCancellableHandle(runtime, pointer);
  }

  function cancellableCancel(cancellable: GCancellableHandle): void {
    assertAbi();
    assertAbi();
    const gioLibrary = ensureGio();
    if (gioLibrary === null) {
      throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    }
    gioLibrary.symbols.g_cancellable_cancel(cancellablePointer(cancellable));
  }

  function cancellableRelease(cancellable: GCancellableHandle): void {
    assertAbi();
    assertAbi();
    const gioLibrary = ensureGio();
    if (gioLibrary === null) {
      throw new Error("GIO is unavailable; install libgio-2.0 to use GCancellable operations.");
    }
    const { gobject } = ensure();
    const pointer = cancellablePointer(cancellable);
    releaseGCancellable(cancellable, runtime);
    gobject.symbols.g_object_unref(pointer);
  }

  let listSchema: SecretSchemaHandle | null = null;

  function getListSchema(): SecretSchemaHandle {
    if (listSchema === null) {
      const value = secretSchemaNew(
        "org.freedesktop.Secret.Generic",
        0,
        "service",
        0,
        "account",
        0,
        null,
      );
      if (value === null) throw new Error("Failed to create libsecret schema.");
      listSchema = value;
    }
    return listSchema;
  }

  function listDataPointer(node: TxikiPointer): TxikiPointer | null {
    return ffi.read.ptr(node, 0);
  }

  function listNextPointer(node: TxikiPointer): TxikiPointer | null {
    return ffi.read.ptr(node, 8);
  }

  function listSecretRecords(service: string): SecretRecord[] {
    assertAbi();
    const width = verifiedWidth();
    const { libsecret, glib, gobject } = ensure();
    const errorStorage = new Uint8Array(8);
    const owners = [cstr("service"), cstr(service)];
    const list = libsecret.symbols.secret_password_search_sync(
      schemaPointer(getListSchema()),
      2,
      null,
      errorStorage,
      owners[0],
      owners[1],
      null,
    ) as TxikiPointer | null;
    void owners;
    const error = new LibsecretErrorHandle();
    prepareLibsecretError(error, runtime);
    captureError(error, errorStorage);
    const failure = error.error();
    if (failure !== null) throw failure;
    if (list === null) return [];
    const records: SecretRecord[] = [];
    try {
      for (let node: TxikiPointer | null = list; node !== null; node = listNextPointer(node)) {
        const retrievable = listDataPointer(node);
        if (retrievable === null) continue;
        const attributes = libsecret.symbols.secret_retrievable_get_attributes(
          retrievable,
        ) as TxikiPointer | null;
        if (attributes === null) continue;
        try {
          const name = cstr("account");
          const account = glib.symbols.g_hash_table_lookup(attributes, name) as TxikiPointer | null;
          void name;
          if (account === null) continue;
          const secretStorage = new Uint8Array(8);
          const value = libsecret.symbols.secret_retrievable_retrieve_secret_sync(
            retrievable,
            null,
            secretStorage,
          ) as TxikiPointer | null;
          const secretError = new LibsecretErrorHandle();
          prepareLibsecretError(secretError, runtime);
          captureError(secretError, secretStorage);
          const secretFailure = secretError.error();
          if (secretFailure !== null) throw secretFailure;
          if (value === null) continue;
          try {
            const lengthBuffer = new Uint8Array(width / 8);
            const secret = libsecret.symbols.secret_value_get(
              value,
              lengthBuffer,
            ) as TxikiPointer | null;
            const length = readGSize(lengthBuffer, 64);
            if (secret === null) {
              if (length !== 0)
                throw new Error("secret_value_get returned a null pointer with a non-zero length");
              records.push({
                service,
                account: decodeUtf8(readCString(account), "account"),
                secret: new Uint8Array(0),
              });
            } else {
              records.push({
                service,
                account: decodeUtf8(readCString(account), "account"),
                secret: copyExactBytes(length, (index) => ffi.read.u8(secret, index)),
              });
            }
          } finally {
            libsecret.symbols.secret_value_unref(value);
          }
        } finally {
          glib.symbols.g_hash_table_unref(attributes);
        }
      }
    } finally {
      for (let node: TxikiPointer | null = list; node !== null; node = listNextPointer(node)) {
        const retrievable = listDataPointer(node);
        if (retrievable !== null) gobject.symbols.g_object_unref(retrievable);
      }
      glib.symbols.g_list_free(list);
    }
    return records;
  }

  const gioReady = abiError === null ? ensureGio() : null;
  const backend: LibsecretBindings = {
    runtime,
    listSecretRecords,
    secretSchemaNew,
    secretPasswordLookupSync,
    secretPasswordStoreSync,
    secretPasswordClearSync,
    secretPasswordFree,
    ...(gioReady === null ? {} : {
      gio: { cancellableNew, cancellableCancel, cancellableRelease },
    }),
  };

  return {
    backend,
    open(): void {
      assertAbi();
      ensure();
      ensureGio();
    },
    isOpened(): boolean {
      return libsecret !== null && glib !== null && gobject !== null;
    },
    close(): void {
      libsecret?.close();
      glib?.close();
      gobject?.close();
      gio?.close();
      libsecret = null;
      glib = null;
      gobject = null;
      gio = undefined;
    },
  };
}

export const LIBRARY_NAMES: readonly string[] = [
  "libsecret-1.so.0",
  "libglib-2.0.so.0",
  "libgio-2.0.so.0",
  "libgobject-2.0.so.0",
];
