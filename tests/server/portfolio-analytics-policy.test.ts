import assert from "node:assert/strict";
import test from "node:test";

import { browserCategory, deviceCategory, publicPortfolioPath, shanghaiParts, sourceCategory } from "@/lib/portfolio/analytics-policy";

test("only curated portfolio pages can be counted", () => {
  assert.equal(publicPortfolioPath("/portfolio/projects/robomaster-infantry"), "/portfolio/projects/robomaster-infantry");
  assert.equal(publicPortfolioPath("/portfolio/projects/robomaster-infantry/"), "/portfolio/projects/robomaster-infantry");
  assert.equal(publicPortfolioPath("/experiences"), null);
  assert.equal(publicPortfolioPath("/api/private/workspace"), null);
  assert.equal(publicPortfolioPath("/portfolio/timeline"), null);
  assert.equal(publicPortfolioPath("/portfolio/projects/fake"), null);
});

test("Shanghai day and weekday/hour boundaries are consistent", () => {
  assert.deepEqual(shanghaiParts(new Date("2026-10-11T15:59:59.000Z")), { date: "2026-10-11", weekday: 6, hour: 23 });
  assert.deepEqual(shanghaiParts(new Date("2026-10-11T16:00:00.000Z")), { date: "2026-10-12", weekday: 0, hour: 0 });
});

test("device, browser and source are categorical only", () => {
  assert.equal(deviceCategory("Mozilla iPhone Mobile"), "手机");
  assert.equal(browserCategory("Mozilla Chrome/122 Edg/122"), "Edge");
  assert.equal(sourceCategory("https://www.google.com/search?q=robot", "http://localhost:3100"), "搜索引擎");
  assert.equal(sourceCategory("https://github.com/CDC666-666", "http://localhost:3100"), "社交平台");
  assert.equal(sourceCategory("http://localhost:3100/portfolio", "http://localhost:3100"), "站内导航");
});
