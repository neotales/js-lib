/**
 * The `export` module provides a way to export all the functions from the `core` module.
 *
 * ```ts
 * import { env } from "@neotales/env/export";
 *
 * env.get("KEY"); // Get the value of the environment variable
 * env.set("KEY"); // Set the value of the environment variable
 * ```
 *
 * @module
 */
export * as env from "./core.ts";
