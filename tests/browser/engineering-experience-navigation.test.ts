import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

import { parseAutoAimCase } from "@/services/shared-memory-experience";
import { syntheticCase } from "@/tests/fixtures/experience-case";

const baseUrl = process.env.TEST_BASE_URL;

test("experience detail follows search navigation and browser history", {
  skip: !baseUrl || !process.env.DATABASE_URL,
}, async () => {
  assert.ok(baseUrl);
  const allowedId = process.env.ALLOWED_GITHUB_USER_ID;
  assert.ok(allowedId);
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: allowedId } });
  const sessionToken = randomUUID();
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  await db.account.create({ data: { userId: user.id, type: "oauth", provider: "github",
    providerAccountId: allowedId } });
  await db.session.create({ data: { userId: user.id, sessionToken,
    expires: new Date(Date.now() + 3600_000) } });
  const template = parseAutoAimCase(syntheticCase, workspace.id);
  const item = (key: "A" | "B") => ({ ...template, id: `browser-experience-${key}-${marker}`,
    title: `浏览器经验 ${key}`, sourceType: "manual", sourceId: undefined,
    experience: { ...template.experience, phenomenon: `浏览器现象 ${key}`,
      sourceKey: undefined, sourceRevision: undefined } });
  const a = item("A");
  const b = item("B");
  const headers = { cookie: `next-auth.session-token=${sessionToken}`, origin: baseUrl,
    "content-type": "application/json" };
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    for (const entry of [a, b]) {
      const response: Response = await fetch(`${baseUrl}/api/private/entities/knowledge`, {
        method: "POST", headers, body: JSON.stringify({ item: entry }),
      });
      assert.equal(response.status, 201, await response.text());
    }
    browser = await chromium.launch({ headless: true,
      channel: process.env.TEST_BROWSER_CHANNEL ?? undefined });
    const context = await browser.newContext({ viewport: { width: 1280, height: 844 } });
    await context.addCookies([{ name: "next-auth.session-token", value: sessionToken, url: baseUrl }]);
    const page = await context.newPage();
    const detailTitle = () => page.getByRole("dialog").getByRole("heading", { level: 2 });
    const search = async (title: string) => {
      await page.getByRole("textbox", { name: "全局搜索" }).fill(title);
      await page.getByRole("button", { name: new RegExp(title) }).click();
    };
    await page.goto(`${baseUrl}/experiences?record=${a.id}`);
    await detailTitle().getByText(a.title).waitFor();
    await page.evaluate((id) => window.history.pushState({}, "", `/experiences?record=${encodeURIComponent(id)}`), b.id);
    await page.getByRole("dialog").getByRole("heading", { name: b.title }).waitFor();
    await page.goBack();
    await page.getByRole("dialog").getByRole("heading", { name: a.title }).waitFor();
    await page.getByRole("dialog").getByRole("button", { name: "关闭", exact: true }).click();
    await search(b.title);
    await page.waitForURL(`**/experiences?record=${b.id}`);
    assert.equal(await detailTitle().textContent(), b.title,
      "URL points to B and detail must also display B");
    await page.goBack();
    assert.equal(new URL(page.url()).searchParams.get("record"), null);
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.goBack();
    assert.equal(await detailTitle().textContent(), a.title);
    await page.goForward();
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.goForward();
    assert.equal(await detailTitle().textContent(), b.title);
    await page.setViewportSize({ width: 390, height: 844 });
    // AppShell animates its desktop padding away when crossing the mobile breakpoint.
    await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
    await page.setViewportSize({ width: 1280, height: 844 });
    await page.getByRole("dialog").getByRole("button", { name: "关闭", exact: true }).click();
    await search(a.title);
    assert.equal(await detailTitle().textContent(), a.title);
    await page.goto(`${baseUrl}/experiences?record=missing-${marker}`);
    await page.getByRole("status").getByText("未找到这条工程经验").waitFor();
    assert.equal(await page.getByRole("dialog").count(), 0);
    await context.close();
  } finally {
    await browser?.close();
    await db.knowledge.deleteMany({ where: { workspaceId: workspace.id } });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
