import assert from "node:assert/strict";
import { test } from "node:test";

import { GET } from "@/app/api/public/site-metadata/route";

test("public site metadata exposes only reviewed legal and launch fields", async () => {
  const names = ["SITE_ICP_NUMBER", "SITE_ICP_NAME", "SITE_POLICE_NUMBER", "PORTFOLIO_LAUNCHED_AT", "NEXTAUTH_SECRET"] as const;
  const previous = new Map(names.map((name) => [name, process.env[name]] as const));
  try {
    process.env.SITE_ICP_NUMBER = "test-filing-number";
    process.env.SITE_ICP_NAME = "test-site-name";
    process.env.SITE_POLICE_NUMBER = "";
    process.env.PORTFOLIO_LAUNCHED_AT = "2026-10-16T14:00:00+08:00";
    process.env.NEXTAUTH_SECRET = "must-not-be-public";
    const response = GET();
    const body = await response.json();
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(body, {
      icpNumber: "test-filing-number",
      icpName: "test-site-name",
      policeNumber: null,
      launchedAt: "2026-10-16T14:00:00+08:00",
    });
    assert.ok(!JSON.stringify(body).includes("must-not-be-public"));
  } finally {
    for (const name of names) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
