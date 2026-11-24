# Process TODO

- Add an in-memory browser working directory and directory stack. Browser
  `chdir`, `pushd`, and `popd` are currently no-ops; `exit` should continue to
  throw explicitly because browser hosts cannot terminate the process.
- Evaluate a portable process-title API, including platform behavior and its
  relationship to the planned environment module.
- Consider a separate `process_metrics` module only if it can provide a
  portable, user-friendly superset of runtime memory metrics.
