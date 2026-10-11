import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { prisma } from "@/lib/server/prisma";

test("anonymous public analytics persist, deduplicate by event and aggregate without leaking visitor IDs", async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || (!process.env.CI && new URL(databaseUrl).pathname !== "/portfolio_preview")) throw new Error("portfolio analytics DB test requires the isolated portfolio_preview database");
  process.env.PORTFOLIO_ANALYTICS_SECRET = "portfolio-test-only-secret-32-bytes-minimum";
  const { recordPortfolioVisit, readPortfolioAnalytics, visitorDigest } = await import("@/lib/portfolio/analytics-server");
  const cookie = randomUUID().replaceAll("-", "");
  const visitorId = visitorDigest(cookie);
  const initial = await readPortfolioAnalytics(7);
  assert.equal(initial.status, "ok");
  if (initial.status !== "ok") return;
  const eventId = randomUUID();
  try {
    assert.equal(await recordPortfolioVisit({ eventId, cookie, path: "/portfolio", device: "桌面", browser: "Chrome", source: "直接访问" }), "recorded");
    assert.equal(await recordPortfolioVisit({ eventId, cookie, path: "/portfolio", device: "桌面", browser: "Chrome", source: "直接访问" }), "duplicate");
    assert.equal(await recordPortfolioVisit({ eventId: randomUUID(), cookie, path: "/portfolio/projects", device: "桌面", browser: "Chrome", source: "站内导航" }), "recorded");
    await prisma.portfolioPageView.create({ data: { eventId: randomUUID(), visitorId, path: "/portfolio", device: "桌面", browser: "Chrome", source: "直接访问", occurredAt: new Date(Date.now() - 86_400_000) } });
    const after = await readPortfolioAnalytics(7);
    assert.equal(after.status, "ok");
    if (after.status !== "ok") return;
    assert.equal(after.totals.visitors, initial.totals.visitors + 1);
    assert.equal(after.totals.views, initial.totals.views + 3);
    assert.equal(after.trend.reduce((sum, day) => sum + day.visitors, 0), initial.trend.reduce((sum, day) => sum + day.visitors, 0) + 2);
    assert.ok(after.popular.some((item) => item.path === "/portfolio"));
    assert.ok(!JSON.stringify(after).includes(visitorId));
    assert.equal(await prisma.portfolioPageView.count({ where: { visitorId } }), 3);
    for (let index = 0; index < 18; index++) {
      assert.equal(await recordPortfolioVisit({ eventId: randomUUID(), cookie, path: "/portfolio", device: "桌面", browser: "Chrome", source: "直接访问" }), "recorded");
    }
    assert.equal(await recordPortfolioVisit({ eventId: randomUUID(), cookie, path: "/portfolio", device: "桌面", browser: "Chrome", source: "直接访问" }), "limited");
    assert.equal(await prisma.portfolioPageView.count({ where: { visitorId } }), 21);
  } finally {
    await prisma.portfolioVisitor.deleteMany({ where: { id: visitorId } });
    await prisma.$disconnect();
  }
});
