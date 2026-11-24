/**
 * Win32 error policy shared by the Credential Manager backends.
 *
 * A missing credential is `ERROR_NOT_FOUND`. Every other failure is a real
 * error and must not be reported as a missing secret.
 *
 * @module
 * @internal
 */
/** `ERROR_NOT_FOUND`, returned when a target name does not exist. */
export declare const WIN_CRED_ERROR_NOT_FOUND = 1168;
/**
 * Builds the error used for a failed native call.
 *
 * The target name and credential data are deliberately absent from the
 * message.
 *
 * @param operation The native function name.
 * @param code The Win32 error code from `GetLastError`.
 * @returns An error naming the operation and code.
 */
export declare function win32Failure(operation: string, code: number): Error;
