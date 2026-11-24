import { globals } from "./_globals.ts";

let a: Array<string> = [];

if (globals.Deno) {
  a = globals.Deno.args;
} else if (globals.process) {
  const isEval = globals.process.execArgv.some(
    (argument) =>
      argument === "-e" ||
      argument === "-p" ||
      argument === "--eval" ||
      argument === "--print" ||
      argument.startsWith("--eval=") ||
      argument.startsWith("--print="),
  );
  a = globals.process.argv.slice(isEval ? 1 : 2);
} else if (globals.tjs) {
  // txiki.js includes its executable, `run` command, and script path.
  a = globals.tjs.args.slice(3);
} else if (Array.isArray(globals.scriptArgs)) {
  a = globals.scriptArgs.slice(1);
}

/**
 * The current process arguments. The arguments do not include the
 * executable path or the script path.
 * @example
 * ```typescript
 * import { args } from '@neotales/process/args';
 *
 * console.log(args);
 * ```
 */
export const args: ReadonlyArray<string> = a;
