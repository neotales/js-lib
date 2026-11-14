// Fail unless this run is publishing the exact tag commit GitHub triggered.
//
// There is no manual dispatch path. A release is a tag push, and the checked
// out HEAD must be refs/tags/<tag> at github.sha. This prevents a branch/tag
// mix-up, a moved tag, and an OIDC identity that does not match the code.

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function checkReleaseRef({
  refType,
  refName,
  ref,
  expectedSha,
  headSha,
  tagSha,
}) {
  const errors = [];
  if (refType !== "tag") {
    errors.push(`trigger is not a tag (got ${refType})`);
  }
  if (ref !== `refs/tags/${refName}`) {
    errors.push(`trigger ref ${ref} is not refs/tags/${refName}`);
  }
  if (headSha !== expectedSha) {
    errors.push(`checked-out HEAD ${headSha} is not github.sha ${expectedSha}`);
  }
  if (tagSha !== expectedSha) {
    errors.push(`tag ${refName} points at ${tagSha}, not github.sha ${expectedSha}`);
  }
  return errors;
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

function main() {
  const env = process.env;
  if (env.GITHUB_REF_TYPE !== "tag") {
    console.error(`error: trigger is not a tag (got ${env.GITHUB_REF_TYPE})`);
    process.exit(1);
  }
  if (env.GITHUB_REF !== `refs/tags/${env.GITHUB_REF_NAME}`) {
    console.error(
      `error: trigger ref ${env.GITHUB_REF} is not refs/tags/${env.GITHUB_REF_NAME}`,
    );
    process.exit(1);
  }
  const errors = checkReleaseRef({
    refType: env.GITHUB_REF_TYPE,
    refName: env.GITHUB_REF_NAME,
    ref: env.GITHUB_REF,
    expectedSha: env.GITHUB_SHA,
    headSha: git(["rev-parse", "HEAD"]),
    tagSha: git(["rev-parse", `refs/tags/${env.GITHUB_REF_NAME}^{commit}`]),
  });
  if (errors.length > 0) {
    for (const error of errors) console.error(`error: ${error}`);
    process.exit(1);
  }
  console.log(`release ref ok: ${env.GITHUB_REF} at ${env.GITHUB_SHA}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(1);
  }
}
