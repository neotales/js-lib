/** Native Windows Credential Manager types and helpers. @module @neotales/win-cred/ffi */

/** Windows Credential Manager credential types. */
export enum CredType {
  /** Generic application credential. */
  GENERIC = 1,
  /** Domain password credential. */
  DOMAIN_PASSWORD = 2,
  /** Domain certificate credential. */
  DOMAIN_CERTIFICATE = 3,
  /** Domain credential visible to the user. */
  DOMAIN_VISIBLE_PASSWORD = 4,
  /** Generic certificate credential. */
  GENERIC_CERTIFICATE = 5,
  /** Extended domain credential. */
  DOMAIN_EXTENDED = 6,
  /** Highest defined standard credential type. */
  MAXIMUM = 7,
  /** Reserved range beginning after standard types. */
  MAXIMUM_EX = MAXIMUM + 1000,
}

/** Credential persistence scopes. */
export enum CredPersist {
  /** Retain the credential for the current logon session only. */
  SESSION = 1,
  /** Retain the credential on the local computer. */
  LOCAL_MACHINE = 2,
  /** Retain the credential for the user across domain computers. */
  ENTERPRISE = 3,
}

/** Flags accepted by Credential Manager writes. */
export enum CredWriteFlags {
  /** Write all supplied fields. */
  NONE = 0,
  /** Preserve the existing credential blob. */
  PRESERVE_CREDENTIAL_BLOB = 1,
}

/** Flags accepted by Credential Manager enumeration. */
export enum CredEnumerateFlags {
  /** Interpret the filter as a target-name pattern. */
  NONE = 0,
  /** Enumerate every credential, ignoring the filter. */
  ALL_CREDENTIALS = 1,
}

/** Native credential data returned by {@link WinCred}. */
export interface Credential {
  /** Credential target name. */ targetName: string;
  /** Credential type. */ type: CredType;
  /** Application comment. */ comment: string;
  /** Opaque credential bytes. */ credentialBlob: Uint8Array;
  /** Credential persistence scope. */ persist: CredPersist;
  /** Target alias. */ targetAlias: string;
  /** Associated user name. */ userName: string;
  /** Windows FILETIME write timestamp. */ lastWritten: bigint;
  /** Native credential flags. */ flags: number;
  /** Number of native attributes. */ attributeCount: number;
}

/** A root-API secret record. */
export interface SecretRecord {
  /** Service namespace. */ service: string;
  /** Account identifier. */ account: string;
  /** Opaque secret bytes. */ secret: Uint8Array;
}

/** Whether the current runtime is Windows. */
export const WINDOWS = (typeof globalThis.Deno !== "undefined" && Deno.build.os === "windows") ||
  (typeof globalThis.process !== "undefined" && process.platform === "win32") ||
  (globalThis as { navigator?: { userAgentData?: { platform?: string } } })
    .navigator?.userAgentData?.platform === "Windows";

/**
 * Encodes a string as a null-terminated UTF-16LE buffer.
 * @param value String to encode.
 * @returns Null-terminated UTF-16LE bytes.
 * @example
 * ```ts
 * import { stringToWide } from "@neotales/win-cred/ffi";
 *
 * const buffer = stringToWide("credential");
 * ```
 */
export function stringToWide(value: string): Uint8Array {
  const buffer = new Uint8Array((value.length + 1) * 2);
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    buffer[index * 2] = code & 0xff;
    buffer[index * 2 + 1] = code >> 8;
  }
  return buffer;
}

/**
 * Decodes UTF-16LE bytes through their first null terminator.
 * @param buffer UTF-16LE bytes.
 * @param byteLength Optional number of bytes to inspect.
 * @returns Decoded string.
 * @example
 * ```ts
 * import { stringToWide, wideToString } from "@neotales/win-cred/ffi";
 *
 * console.log(wideToString(stringToWide("credential")));
 * ```
 */
export function wideToString(buffer: Uint8Array, byteLength = buffer.length): string {
  let end = byteLength;
  for (let index = 0; index < byteLength - 1; index += 2) {
    if (buffer[index] === 0 && buffer[index + 1] === 0) {
      end = index;
      break;
    }
  }
  return new TextDecoder("utf-16le").decode(buffer.subarray(0, end));
}

/** Raw `CREDENTIALW` data used by runtime-specific FFI backends. */
export interface RawCredential extends Credential {
  /** Size of {@link credentialBlob} in bytes. */ credentialBlobSize: number;
  /** Numeric persistence value returned by Windows. */ persist: number;
  /** Numeric credential type returned by Windows. */ type: number;
}

/** Native Credential Manager operations. */
export interface WinCredentials {
  /**
   * Writes or updates a credential.
   * @param credential Raw credential data.
   * @param flags Native write flags.
   * @returns Nothing.
   * @throws {Error} If Windows rejects the write.
   * @example
   * ```ts
   * import { CredType, WinCred } from "@neotales/win-cred/ffi";
   *
   * WinCred.write({ targetName: "target", type: CredType.GENERIC } as never, 0);
   * ```
   */
  write(credential: RawCredential, flags: number): void;
  /**
   * Reads a credential by target and type.
   * @param targetName Credential target name.
   * @param type Credential type.
   * @returns The credential, or `null` when missing.
   * @example
   * ```ts
   * import { CredType, WinCred } from "@neotales/win-cred/ffi";
   *
   * const credential = WinCred.read("target", CredType.GENERIC);
   * ```
   */
  read(targetName: string, type: number): RawCredential | null;
  /**
   * Deletes a credential.
   * @param targetName Credential target name.
   * @param type Credential type.
   * @returns Whether a credential was deleted.
   * @example
   * ```ts
   * import { CredType, WinCred } from "@neotales/win-cred/ffi";
   *
   * WinCred.delete("target", CredType.GENERIC);
   * ```
   */
  delete(targetName: string, type: number): boolean;
  /**
   * Enumerates credentials.
   * @param filter Target-name pattern, or `null`.
   * @param flags Native enumeration flags.
   * @returns Matching credentials.
   * @example
   * ```ts
   * import { CredEnumerateFlags, WinCred } from "@neotales/win-cred/ffi";
   *
   * const credentials = WinCred.enumerate(null, CredEnumerateFlags.ALL_CREDENTIALS);
   * ```
   */
  enumerate(filter: string | null, flags: number): RawCredential[];
}
