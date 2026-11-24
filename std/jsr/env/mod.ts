/**
 * ## Overview
 *
 * The env provides a uniform way to work with environment variables and
 * the path variable across different runtimes such as bun, node, deno,
 * QuickJS-ng, cloudflare and the browser and different operating system differences.
 *
 * QuickJS-ng uses its `std` environment primitives when launched with `--std`.
 * Cloudflare and the browser currently use an in-memory store.
 *
 * Bash and Windows style variable expansion and command substitution is supported.
 *
 * Command substitution is only supported in runtimes that support it
 * such as deno, bun, and node.  Command substitution is primarily used
 * for getting secrets using a script or command that returns a value.
 *
 * Command substitution executes local commands and is risky. Enable it only
 * for trusted templates in environments controlled by the user.
 *
 * The browser and cloudflare do not support
 * command substitution. Command substitution is disabled by default
 * and must be enabled by passing the `commands` option to the
 * `expand` method.
 *
 * ![logo](https://raw.githubusercontent.com/neotales/js-libraries/refs/heads/dev/eng/assets/logo.png)
 *
 * [![JSR](https://jsr.io/badges/@neotales/env)](https://jsr.io/@neotales/env)
 * [![npm version](https://badge.fury.io/js/@neotales%2Fenv.svg)](https://badge.fury.io/js/@neotales%2Fenv)
 * [![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-std.svg)](https://badge.fury.io/gh/neotales%2Fjs-std)
 *
 * ## Documentation
 *
 * Documentation is available on [jsr.io](https://jsr.io/@neotales/env/doc)
 *
 * A list of other modules can be found at [github.com/neotales/js-libraries](https://github.com/neotales/js-libraries)
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@neotales/env
 *
 * # npm from jsr
 * npx jsr add @neotales/env
 *
 * # from npmjs.org
 * npm install @neotales/env
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import * as  env from "@neotales/env";
 *
 * // get values
 * console.log(env.get("USER") || env.get("USERNAME"));
 *
 * // set variable
 * env.set("MY_VAR", "test")
 * console.log(env.get("MY_VAR"))
 *
 * // expansion
 * console.log(env.expand("${MY_VAR}")); // test
 * console.log(env.expand("${NO_VALUE:-default}")); // default
 * console.log(env.get("NO_VALUE")); // undefined
 *
 * console.log(env.expand("${NO_VALUE:=default}")); // default
 * console.log(env.get("NO_VALUE")); // default
 *
 * try {
 *     env.expand("${REQUIRED_VAR:?Environment variable REQUIRED_VAR is missing}");
 * } catch(e) {
 *     console.log(e.message); // Environment variable REQUIRED_VAR is missing
 * }
 *
 * const o5 = env.expand(`use command substitution: $(echo "test")`, { commands: true })
 * console.log(o5); // use command substitution: test
 *
 * // proxy object to allow get/set/delete similar to process.env
 * console.log(env.proxy.MY_VAR);
 * env.proxy.MY_VAR = "test"
 * console.log(env.proxy.MY_VAR)
 *
 * // undefined will remove a value
 * env.merge({
 *     "VAR2": "VALUE",
 *     "MY_VAR2": undefined
 * });
 *
 * // union only sets values that are not undefined and does not already have a value
 * // in the example below only NEW will be set.
 * env.union({
 *     "VAR2": undefined,
 *     "NEW": "TEST",
 *     "MY_VAR": "A"
 * })
 *
 * env.set("MY_VAR", "test")
 * env.remove("MY_VAR");
 *
 * // append to the end of the environment path variables
 * env.appendPath("/opt/test/bin");
 *
 * // prepends the path
 * env.prependPath("/opt/test2/bin");
 * env.hasPath("/opt/test2/bin");
 *
 * // removes the path. on windows this is case insensitive.
 * env.removePath("/opt/test2/bin");
 *
 * // replaces the path.
 * env.replacePath("/opt/test/bin", "/opt/test2/bin")
 *
 * console.log(env.splitPath());
 * console.log(env.getPath()) // the full path string
 *
 * const path = env.getPath();
 * // overwrites the environment's PATH variable
 * env.setPath(`${path}:/opt/test4/bin`)
 * ```
 *
 * ## Variables
 *
 * - `proxy` - A proxy object that lets you interact with environment
 *   variables the way you would with `process.env`.
 *
 * ## Functions
 *
 * - `appendPath` - Appends a path to the PATH environment variable.
 * - `expand` - Expands string template with environment variables.
 * - `get` - Gets an environment variable.
 * - `getPath` - Gets the environment PATH value.
 * - `has` - Determines if an environment variable is set.
 * - `hasPath` - Determines if the PATH variable contains a path.
 * - `home` - Gets the home environment variable value.
 * - `hostname` - Gets the hostname environment variable value.
 * - `joinPath` - Joins paths into a single string.
 * - `merge` - Merges the values from an object into the environment variables.
 * - `prependPath` - Prepends a path to the PATH variable.
 * - `set` - Sets an environment variable.
 * - `setPath` - Sets the environment's PATH value.
 * - `remove` - Deletes an environment variable.
 * - `removePath` - Removes a path from the environment PATH value.
 * - `replacePath` - Replaces a path from the environment PATH value.
 * - `splitPath` - Splits the PATH variable into a string array.
 * - `shell` - Gets the shell environment variable value.
 * - `os` - Gets the os environment variable value.
 * - `toObject` - Clones and returns a copy of all environment values.
 * - `union` - Unions the vlaues from an object into the environment variables.
 * - `user` - Gets the user environment variable value.
 *
 * ## License
 *
 * [MIT License](./LICENSE.md)
 *
 * @module
 */
export * from "./core.ts";
