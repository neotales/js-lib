import "./_dnt.polyfills.js";
/**
 * The current process ID. The process ID is a unique identifier for the
 * current process. In a browser environment, the process ID is always 0.
 *
 * @example
 * ```typescript
 * import { pid } from "@neotales/process/pid";
 *
 * console.log(`Running as process ID: ${pid}`);
 *
 * // Use for unique identifiers
 * const logPrefix = `[PID:${pid}]`;
 * console.log(`${logPrefix} Application started`);
 * ```
 */
export declare const pid: number;
