import assert from "node:assert/strict";
import test from "node:test";

import { isAllowedGithubId } from "@/services/server/github-allowlist";

test("only the configured stable numeric GitHub ID is allowed", () => {
  assert.equal(isAllowedGithubId("248133835", "248133835"), true);
  assert.equal(isAllowedGithubId("248133836", "248133835"), false);
  assert.equal(isAllowedGithubId("CDC666-666", "248133835"), false);
  assert.equal(isAllowedGithubId("248133835", ""), false);
  assert.equal(isAllowedGithubId(undefined, "248133835"), false);
  assert.equal(isAllowedGithubId("248133835", "CDC666-666"), false);
});
