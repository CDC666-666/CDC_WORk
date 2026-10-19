import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_BASE_URL;

test("legacy migration route redirects to settings without changing browser storage", {
  skip: !baseUrl || !process.env.DATABASE_URL || !process.env.ALLOWED_GITHUB_USER_ID,
}, async () => {
  assert.ok(baseUrl);
  const db = new PrismaClient();
  const user = await db.user.create({ data: { githubId: process.env.ALLOWED_GITHUB_USER_ID } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const token = randomUUID();
  await db.account.create({ data: { userId: user.id, type: "oauth", provider: "github",
    providerAccountId: process.env.ALLOWED_GITHUB_USER_ID! } });
  await db.session.create({ data: { userId: user.id, sessionToken: token,
    expires: new Date(Date.now() + 3600_000) } });
  const browser = await chromium.launch({ headless: true, channel: process.env.TEST_BROWSER_CHANNEL ?? undefined });
  try {
    const context = await browser.newContext();
    await context.addCookies([{ name: "next-auth.session-token", value: token, url: baseUrl }]);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/settings`);
    await page.evaluate(() => localStorage.setItem("migration-route-sentinel", "preserve"));
    await page.goto(`${baseUrl}/migration`);
    await page.waitForURL(`${baseUrl}/settings`);
    assert.equal(await page.evaluate(() => localStorage.getItem("migration-route-sentinel")), "preserve");
    assert.equal(await page.getByText("旧浏览器数据管理").count(), 0);
  } finally {
    await browser.close();
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
