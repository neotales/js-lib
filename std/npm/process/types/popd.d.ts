import "./_dnt.polyfills.js";
/**
 * Pops the last directory from the directory stack and
 * changes the current working directory to that directory.
 * Browser environments leave the directory stack unchanged.
 *
 * @returns The last directory in the stack.
 * @throws Error if pop is not implemented.
 *
 * @example
 * ```ts
 * import { popd } from "@neotales/process/popd.ts";
 *
 * const previousDir = popd();
 * console.log(`Changed directory to: ${previousDir}`);
 * ```
 */
export declare function popd(): string | undefined;
