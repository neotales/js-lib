export const globals = globalThis;
export const isBrowser = globals.window !== undefined &&
    globals.Deno === undefined &&
    globals.Bun === undefined &&
    !globals.process?.versions.node;
/**
 * Resolves a Node builtin module synchronously.
 *
 * Node exposes builtins through `process.getBuiltinModule`, which lets this module avoid
 * top-level `await import()` and stay loadable in engines that only support classic
 * scripts. Hosts that do not implement the accessor return `undefined`; callers handle that
 * as an unsupported capability.
 *
 * @template T The builtin module type.
 * @param name The builtin module specifier, for example `node:fs`.
 * @returns The builtin module, or `undefined` when the host cannot provide it.
 */
export function getBuiltinModule(name) {
    const accessor = globals.process
        ?.getBuiltinModule;
    if (typeof accessor !== "function")
        return undefined;
    return accessor.call(globals.process, name);
}
