import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import test from "node:test";
import { Prisma, PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import { toBeijingDateKey } from "@/lib/date";
import type { FinanceTransaction } from "@/types/finance";

const baseUrl = process.env.TEST_BASE_URL;
const screenshots = process.env.ACCEPTANCE_SCREENSHOT_DIR;

test("isolated finance donut, editor and scroll-lock regression", {
  skip: !baseUrl || !process.env.DATABASE_URL || !process.env.ALLOWED_GITHUB_USER_ID,
  timeout: 180_000,
}, async () => {
  assert.ok(baseUrl);
  if (screenshots) await mkdir(screenshots, { recursive: true });
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: process.env.ALLOWED_GITHUB_USER_ID! } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const token = randomUUID();
  await db.account.create({ data: { userId: user.id, type: "oauth", provider: "github",
    providerAccountId: process.env.ALLOWED_GITHUB_USER_ID! } });
  await db.session.create({ data: { userId: user.id, sessionToken: token,
    expires: new Date(Date.now() + 3_600_000) } });
  const date = `${toBeijingDateKey().slice(0, 7)}-03`;
  const stamp = new Date().toISOString();
  const bill = (key: string, type: FinanceTransaction["type"], category: string,
    amount: number, tags: string[], primaryTag?: string): FinanceTransaction => ({
    id: `donut-${key}-${marker}`, type, category, amount, date, account: "隔离测试账户",
    description: `隔离测试 ${key}`, note: "仅用于隔离验收", tags, primaryTag,
    createdAt: stamp, updatedAt: stamp,
  });
  const fixture = [
    bill("meal", "支出", "餐饮", 150, ["正餐", "聚会"], "正餐"),
    bill("drink", "支出", "餐饮", 50, ["饮料"]),
    bill("food-other", "支出", "餐饮", 10, ["其他"]),
    bill("life-other", "支出", "生活", 5, ["其他"]),
    bill("life-unset", "支出", "生活", 20, []),
    bill("life-unassigned", "支出", "生活", 30, ["日用品", "临时"]),
    bill("income", "收入", "其他", 100, []),
    bill("transfer", "转账", "其他", 500, ["正餐"]),
  ];
  await db.financeTransaction.createMany({ data: fixture.map((item) => ({ id: item.id,
    workspaceId: workspace.id, payload: item as unknown as Prisma.InputJsonObject,
    amount: item.amount, date: new Date(`${item.date}T00:00:00Z`), type: item.type })) });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  const errors: string[] = [];
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.TEST_BROWSER_CHANNEL ?? "chrome" });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([{ name: "next-auth.session-token", value: token, url: baseUrl }]);
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => { if (response.url().includes("/api/private/") && response.status() >= 500)
      errors.push(`${response.status()} ${new URL(response.url()).pathname}`); });
    const open = async () => {
      await page.goto(`${baseUrl}/finance`);
      await page.getByRole("heading", { name: "消费类别与标签占比" }).waitFor();
      await page.getByLabel("类别与标签明细").getByText("餐饮", { exact: true }).waitFor();
    };
    const unlocked = async () => {
      const state = await page.evaluate(() => ({ root: document.documentElement.style.overflow,
        body: document.body.style.overflow, dialogs: document.querySelectorAll('[role="dialog"]').length,
        scrollHeight: document.documentElement.scrollHeight, viewport: innerHeight }));
      assert.equal(state.root, "");
      assert.equal(state.body, "");
      assert.equal(state.dialogs, 0);
      assert.ok(state.scrollHeight > state.viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.mouse.wheel(0, 650);
      await page.waitForFunction(() => window.scrollY > 0);
    };
    const closeEditor = async (mode: "cancel" | "escape" | "button" | "overlay") => {
      const dialog = page.getByRole("dialog", { name: "编辑账单" });
      await dialog.waitFor();
      await dialog.getByLabel("标签（逗号分隔）").fill("正餐, 聚会, 饮料");
      await dialog.getByLabel("用途或标题").fill("隔离测试 修改用途");
      await dialog.getByLabel("主要统计标签").selectOption("饮料");
      if (mode === "cancel") await dialog.getByRole("button", { name: "取消" }).click();
      if (mode === "escape") await page.keyboard.press("Escape");
      if (mode === "button") await dialog.getByRole("button", { name: "关闭对话框" }).click();
      if (mode === "overlay") await page.locator("[role=dialog]").locator("..").click({ position: { x: 5, y: 5 } });
      await dialog.waitFor({ state: "detached" });
      await unlocked();
    };

    await open();
    const response = await context.request.get(`${baseUrl}/api/private/finance?start=${date}&end=${date}`);
    assert.equal(response.status(), 200);
    const report = await response.json() as { composition: { expenseCents: number;
      categories: { key: string; amountCents: number; tags: { key: string; amountCents: number }[] }[] } };
    assert.equal(report.composition.expenseCents, 26500);
    assert.equal(report.composition.categories.reduce((sum, item) => sum + item.amountCents, 0), 26500);
    assert.ok(report.composition.categories.every((item) => item.tags.reduce((sum, tag) => sum + tag.amountCents, 0) === item.amountCents));
    const sectors = page.locator(".recharts-pie-sector");
    assert.equal(await sectors.count(), 8);
    await sectors.first().dispatchEvent("click");
    await page.getByText("当前账单筛选：餐饮", { exact: true }).waitFor();
    await page.getByText("匹配 3 笔 · 收入 ¥0.00 · 支出 ¥210.00").waitFor();
    await sectors.nth(2).dispatchEvent("click");
    await page.getByText("当前账单筛选：餐饮 / 正餐").waitFor();
    await page.getByText("匹配 1 笔 · 收入 ¥0.00 · 支出 ¥150.00").waitFor();
    await page.getByRole("button", { name: "返回全部类别与标签" }).click();
    await page.getByRole("button", { name: "展开餐饮标签" }).click();
    assert.equal(await page.getByText("当前账单筛选：").count(), 0);
    await page.getByRole("button", { name: "筛选标签 餐饮 / 正餐" }).click();
    await page.getByText("当前账单筛选：餐饮 / 正餐").waitFor();
    await page.getByText("匹配 1 笔 · 收入 ¥0.00 · 支出 ¥150.00").waitFor();
    await page.getByLabel("类别与标签明细").getByText("生活", { exact: true }).waitFor();
    if (screenshots) await page.screenshot({ path: `${screenshots}/finance-donut-desktop.png`, fullPage: true });
    await page.getByRole("button", { name: "返回全部类别与标签" }).click();
    await page.getByText("匹配 8 笔 · 收入 ¥100.00 · 支出 ¥265.00").waitFor();
    await page.getByRole("button", { name: "展开生活标签" }).click();
    await page.getByRole("button", { name: "筛选标签 生活 / 未指定主要标签" }).click();
    await page.getByText("匹配 1 笔 · 收入 ¥0.00 · 支出 ¥30.00").waitFor();
    await page.getByRole("button", { name: "返回全部类别与标签" }).click();

    await page.setViewportSize({ width: 390, height: 844 });

    for (const mode of ["cancel", "escape", "button", "overlay"] as const) {
      await page.goto(`${baseUrl}/finance?record=${fixture[0].id}`);
      await page.getByRole("dialog", { name: fixture[0].description }).getByRole("button", { name: "编辑账单" }).click();
      await closeEditor(mode);
    }
    await page.goto(`${baseUrl}/finance?record=${fixture[0].id}`);
    await page.getByRole("dialog", { name: fixture[0].description }).getByRole("button", { name: "编辑账单" }).click();
    const dialog = page.getByRole("dialog", { name: "编辑账单" });
    await dialog.getByLabel("标签（逗号分隔）").fill("正餐, 聚会, 饮料");
    await dialog.getByLabel("主要统计标签").selectOption("饮料");
    await dialog.getByLabel("用途或标题").fill("隔离测试 更新后用途");
    await dialog.getByRole("button", { name: "保存记录" }).click();
    await dialog.waitFor({ state: "detached" });
    await unlocked();
    await page.getByRole("button", { name: "展开餐饮标签" }).click();
    await page.getByRole("button", { name: "筛选标签 餐饮 / 饮料" }).click();
    await page.getByText("匹配 2 笔 · 收入 ¥0.00 · 支出 ¥200.00").waitFor();
    const stored = await db.financeTransaction.findUniqueOrThrow({ where: { id: fixture[0].id } });
    assert.deepEqual((stored.payload as { tags: string[] }).tags, ["正餐", "聚会", "饮料"]);
    assert.equal((stored.payload as { primaryTag: string }).primaryTag, "饮料");

    await page.getByRole("button", { name: "返回全部类别与标签" }).click();
    await page.getByRole("button", { name: "编辑隔离测试 drink" }).click();
    await page.getByRole("dialog", { name: "编辑账单" }).getByRole("button", { name: "取消" }).click();
    await unlocked();
    await page.getByRole("button", { name: "编辑隔离测试 更新后用途" }).click();
    const failed = page.getByRole("dialog", { name: "编辑账单" });
    await failed.getByLabel("用途或标题").fill("保存失败后仍保留输入");
    await page.route(`**/api/private/entities/financeTransactions/${fixture[0].id}`, async (route) => {
      if (route.request().method() === "PATCH") await route.fulfill({ status: 409,
        contentType: "application/json", body: JSON.stringify({ error: "隔离测试冲突" }) });
      else await route.continue();
    });
    await failed.getByRole("button", { name: "保存记录" }).click();
    await failed.getByText("隔离测试冲突").waitFor();
    assert.equal(await failed.getByLabel("用途或标题").inputValue(), "保存失败后仍保留输入");
    await failed.getByRole("button", { name: "关闭对话框" }).click();
    await failed.waitFor({ state: "detached" });
    await page.unroute(`**/api/private/entities/financeTransactions/${fixture[0].id}`);
    await unlocked();

    await page.getByRole("button", { name: "编辑隔离测试 更新后用途" }).click();
    const clearPrimary = page.getByRole("dialog", { name: "编辑账单" });
    await clearPrimary.getByLabel("主要统计标签").selectOption("");
    await clearPrimary.getByRole("button", { name: "保存记录" }).click();
    await clearPrimary.waitFor({ state: "detached" });
    await unlocked();
    const cleared = await db.financeTransaction.findUniqueOrThrow({ where: { id: fixture[0].id } });
    assert.equal((cleared.payload as { primaryTag: string }).primaryTag, "");
    await page.getByRole("button", { name: "展开餐饮标签" }).click();
    await page.getByRole("button", { name: "筛选标签 餐饮 / 未指定主要标签" }).click();
    await page.getByText("匹配 1 笔 · 收入 ¥0.00 · 支出 ¥150.00").waitFor();

    await page.goto(`${baseUrl}/finance`);
    await page.getByRole("heading", { name: "消费类别与标签占比" }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
    if (screenshots) await page.screenshot({ path: `${screenshots}/finance-donut-mobile.png`, fullPage: true });
    await page.getByRole("button", { name: "编辑隔离测试 更新后用途" }).click();
    if (screenshots) await page.screenshot({ path: `${screenshots}/finance-editor-mobile.png` });
    await page.getByRole("dialog", { name: "编辑账单" }).getByRole("button", { name: "取消" }).click();
    await unlocked();
    await page.setViewportSize({ width: 390, height: 600 });
    await page.getByRole("button", { name: "编辑隔离测试 drink" }).click();
    const compactEditor = page.getByRole("dialog", { name: "编辑账单" });
    const content = compactEditor.locator(".overflow-y-auto");
    assert.ok(await content.evaluate((element) => element.scrollHeight > element.clientHeight));
    await content.evaluate((element) => { element.scrollTop = 200; });
    assert.ok(await content.evaluate((element) => element.scrollTop > 0));
    const beforeCloseY = await page.evaluate(() => window.scrollY);
    await compactEditor.getByLabel("金额（元）").fill("60.00");
    await compactEditor.getByLabel("分类", { exact: true }).selectOption("生活");
    await compactEditor.getByRole("button", { name: "保存记录" }).click();
    await compactEditor.waitFor({ state: "detached" });
    assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - beforeCloseY) < 60);
    await unlocked();
    await page.getByText("匹配 8 笔 · 收入 ¥100.00 · 支出 ¥275.00").waitFor();
    const updatedReportResponse = await context.request.get(`${baseUrl}/api/private/finance?start=${date}&end=${date}`);
    const updatedReport = await updatedReportResponse.json() as { composition: { expenseCents: number;
      categories: { key: string; amountCents: number }[] } };
    assert.equal(updatedReport.composition.expenseCents, 27500);
    assert.equal(updatedReport.composition.categories.find((item) => item.key === "生活")?.amountCents, 11500);
    const searchResponse = await context.request.get(`${baseUrl}/api/private/search?q=${encodeURIComponent("隔离测试 drink")}&type=${encodeURIComponent("账单")}`);
    const search = await searchResponse.json() as { results: { href: string; summary: string }[] };
    assert.equal(search.results[0]?.href, `/finance?record=${fixture[1].id}`);
    assert.match(search.results[0]?.summary ?? "", /生活.*60\.00/);
    await page.getByRole("button", { name: "删除隔离测试 drink" }).click();
    await page.getByRole("dialog", { name: "删除账单" }).getByRole("button", { name: "确认删除" }).click();
    await page.getByText("匹配 7 笔 · 收入 ¥100.00 · 支出 ¥215.00").waitFor();
    const deletedSearchResponse = await context.request.get(`${baseUrl}/api/private/search?q=${encodeURIComponent("隔离测试 drink")}&type=${encodeURIComponent("账单")}`);
    const deletedSearch = await deletedSearchResponse.json() as { results: unknown[] };
    assert.deepEqual(deletedSearch.results, []);
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 },
      isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    await touchContext.addCookies([{ name: "next-auth.session-token", value: token, url: baseUrl }]);
    const touchPage = await touchContext.newPage();
    await touchPage.goto(`${baseUrl}/finance`);
    await touchPage.getByRole("heading", { name: "消费类别与标签占比" }).waitFor();
    await touchPage.getByText("匹配 7 笔 · 收入 ¥100.00 · 支出 ¥215.00").waitFor();
    assert.ok(await touchPage.evaluate(() => document.documentElement.scrollHeight > innerHeight));
    await touchPage.getByRole("button", { name: "编辑隔离测试 更新后用途" }).click();
    await touchPage.getByRole("dialog", { name: "编辑账单" }).getByRole("button", { name: "取消" }).click();
    await touchPage.getByRole("dialog", { name: "编辑账单" }).waitFor({ state: "detached" });
    assert.equal(await touchPage.evaluate(() => document.documentElement.style.overflow), "");
    const outerSector = touchPage.locator(".recharts-pie-sector").nth(2);
    await outerSector.scrollIntoViewIfNeeded();
    const tap = await outerSector.evaluate((path) => {
      const rect = path.getBoundingClientRect();
      for (let y = rect.top + 3; y < rect.bottom - 3; y += 5) {
        for (let x = rect.left + 3; x < rect.right - 3; x += 5) {
          if (path.contains(document.elementFromPoint(x, y))) return { x, y };
        }
      }
      throw new Error("手机环形图扇区不可点击");
    });
    await touchPage.touchscreen.tap(tap.x, tap.y);
    await touchPage.getByText("当前账单筛选：餐饮 / 未指定主要标签").waitFor();
    await touchPage.getByRole("button", { name: "返回全部类别与标签" }).click();
    await touchPage.evaluate(() => window.scrollTo(0, 0));
    const cdp = await touchContext.newCDPSession(touchPage);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 180, y: 700 }] });
    for (let step = 1; step <= 10; step++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove",
        touchPoints: [{ x: 180, y: 700 - step * 45 }] });
      await touchPage.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await touchPage.waitForTimeout(400);
    const touchState = await touchPage.evaluate(() => ({ y: window.scrollY,
      root: document.documentElement.style.overflow, body: document.body.style.overflow,
      height: document.documentElement.scrollHeight, viewport: innerHeight }));
    assert.ok(touchState.y > 0, JSON.stringify(touchState));
    await touchContext.close();
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    if (browser) await browser.close();
    await db.financeTransaction.deleteMany({ where: { workspaceId: workspace.id } });
    await db.financeCategorySetting.deleteMany({ where: { workspaceId: workspace.id } });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
