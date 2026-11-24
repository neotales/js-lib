# @neotales/env

## Overview

The env provides a uniform way to work with environment variables and
the path variable across different runtimes such as bun, node, deno, QuickJS-ng,
cloudflare and the browser and different operating system differences.

QuickJS-ng uses its `std` environment primitives when the interpreter is launched with
`--std`. Cloudflare and the browser currently use an in-memory store; a Worker-specific
adapter can be added for the live, read-only `import { env } from "cloudflare:workers"`
binding object.

Bash and Windows style variable expansion and command substitution is supported.

Command substitution is only supported in runtimes that support it
such as deno, bun, and node. Command substitution is primarily used
for getting secrets using a script or command that returns a value.

Command substitution executes local commands. It is risky and must only be
enabled for templates controlled by a trusted user in an environment that user
controls. Never enable it for untrusted application input.

The browser and cloudflare do not support
command substitution. Command substitution is disabled by default
and must be enabled by passing the `commands` option to the
`expand` method.

![logo](https://raw.githubusercontent.com/neotales/js-lib/refs/heads/dev/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/env)](https://jsr.io/@neotales/env)
[![npm version](https://badge.fury.io/js/@neotales%2Fenv.svg)](https://badge.fury.io/js/@neotales%2Fenv)

## Runtime support

The module README table is the support claim. Environment storage works on every
lane; the parenthesised limit is command substitution.

| Runtime | Supported | Generated from the TypeScript |
| --- | --- | --- |
| Deno | ✅ | source; command substitution uses `Deno.Command` |
| Node.js | ✅ | published npm ESM twin (node >= 22) |
| Bun | ✅ | source; command substitution uses `Bun.spawnSync` |
| Ende | ✅ | source; command substitution uses `Deno.Command` |
| QuickJS-ng | ✅ (no commands) | one ESM bundle; uses the `std` primitives when launched with `--std`, otherwise an in-memory store |
| workerd | ✅ (no commands) | one ESM bundle; in-memory store |
| txiki.js | ✅ (no commands) | one ESM bundle; in-memory store |
| ClearScript | ✅ (no commands) | TypeScript graph; in-memory store |
| browsers | ✅ (no commands) | one ESM bundle; in-memory store |
| JerryScript | ✅ (no commands) | IIFE bundle; in-memory store |

Command substitution executes local commands and is disabled by default. A lane
without synchronous command execution skips those scenarios explicitly.

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/env/doc)

A list of other modules can be found at [github.com/neotales/js-lib](https://github.com/neotales/js-lib)

## Installation

```bash
# Deno
deno add jsr:@neotales/env

# npm from jsr
npx jsr add @neotales/env

# from npmjs.org
npm install @neotales/env
```

## Usage

```typescript
import * as env from "@neotales/env";

// get values
console.log(env.get("USER") || env.get("USERNAME"));

// set variable
env.set("MY_VAR", "test");
console.log(env.get("MY_VAR"));

// expansion
console.log(env.expand("${MY_VAR}")); // test
console.log(env.expand("${NO_VALUE:-default}")); // default
console.log(env.get("NO_VALUE")); // undefined

console.log(env.expand("${NO_VALUE:=default}")); // default
console.log(env.get("NO_VALUE")); // default

try {
  env.expand("${REQUIRED_VAR:?Environment variable REQUIRED_VAR is missing}");
} catch (e) {
  console.log(e.message); // Environment variable REQUIRED_VAR is missing
}

const o5 = env.expand(`use command substitution: $(echo "test")`, { commands: true });
console.log(o5); // use command substitution: test

// proxy object to allow get/set/delete similar to process.env
console.log(env.proxy.MY_VAR);
env.proxy.MY_VAR = "test";
console.log(env.proxy.MY_VAR);

// undefined will remove a value
env.merge({
  VAR2: "VALUE",
  MY_VAR2: undefined,
});

// union only sets values that are not undefined and does not already have a value
// in the example below only NEW will be set.
env.union({
  VAR2: undefined,
  NEW: "TEST",
  MY_VAR: "A",
});

env.set("MY_VAR", "test");
env.remove("MY_VAR");

// append to the end of the environment path variables
env.appendPath("/opt/test/bin");

// prepends the path
env.prependPath("/opt/test2/bin");
env.hasPath("/opt/test2/bin");

// removes the path. on windows this is case insensitive.
env.removePath("/opt/test2/bin");

// replaces the path.
env.replacePath("/opt/test/bin", "/opt/test2/bin");

console.log(env.splitPath());
console.log(env.path()); // the full path string

const path = env.path();
// overwrites the environment's PATH variable
env.setPath(`${path}:/opt/test4/bin`);
```

## Variables

- `proxy` - A proxy object that lets you interact with environment
  variables the way you would with `process.env`.

## Functions

- `appendPath` - Appends a path to the PATH environment variable.
- `expand` - Expands string template with environment variables.
- `expandAsync` - Expands templates with optional async URL protocol resolution.
- `get` - Gets an environment variable.
- `getPath` - Gets the environment PATH value.
- `path` - Gets the environment PATH value.
- `has` - Determines if an environment variable is set.
- `hasPath` - Determines if the PATH variable contains a path.
- `home` - Gets the home environment variable value.
- `hostname` - Gets the hostname environment variable value.
- `joinPath` - Joins paths into a single string.
- `merge` - Merges the values from an object into the environment variables.
- `prependPath` - Prepends a path to the PATH variable.
- `set` - Sets an environment variable.
- `setPath` - Sets the environment's PATH value.
- `remove` - Deletes an environment variable.
- `removePath` - Removes a path from the environment PATH value.
- `replacePath` - Replaces a path from the environment PATH value.
- `splitPath` - Splits the PATH variable into a string array.
- `shell` - Gets the shell environment variable value.
- `os` - Gets the os environment variable value.
- `toObject` - Clones and returns a copy of all environment values.
- `union` - Unions the vlaues from an object into the environment variables.
- `user` - Gets the user environment variable value.

## Async Expansion

`expandAsync` resolves URL-like expanded values with a protocol handler. This is useful for application integrations
that retrieve secrets without executing a shell command.

```ts
import { expandAsync } from "@neotales/env/expand";

const value = await expandAsync("token=${SECRET_URL}", {
  get: () => "keepass:///vault.kdbx?key=api/token",
  protocolHandler: async () => "resolved-secret",
});
// token=resolved-secret
```

## Command Substitution Safety

Command substitution is disabled by default. Enabling `{ commands: true }`
allows the template to execute local commands, so it must only be used with
trusted templates in an environment controlled by the user. It must not be
enabled for untrusted input. Prefer `expandAsync` with a `protocolHandler` for
application-managed secret retrieval.

An allowlist for approved commands should be considered before using command
substitution in broader automation scenarios.

Use `allowed` to restrict substitutions. A string permits an executable; an
array permits a command only when its initial tokens match every array entry.
`allowed` is only enforced when `enabled` is `true`; an allowlist without
`enabled` leaves command substitution off.

```ts
import { expand } from "@neotales/env";

expand("version=$(node --version)", {
  commands: {
    enabled: true,
    allowed: [["node", "--version"]],
    maxSize: 1024,
    timeout: 5_000,
  },
});
```

If no entry matches, `expand` throws `UnpermittedCommandError`. Its message does
not repeat the command, because a rejected command can contain a secret; do not
log the `command` property either.

`allowed` is an argument-vector policy. It cannot be combined with `shell: true`,
because a shell string can chain commands after the permitted first token. That
combination throws `TypeError` before any process starts.

A command that exits nonzero throws `Error("Command substitution failed with exit
code N.")` on every backend, even when the command wrote to stdout first. Output
is never returned for a failed command.

## License

[MIT License](./LICENSE.md)
