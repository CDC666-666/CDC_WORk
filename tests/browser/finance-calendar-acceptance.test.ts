import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import test from "node:test";

import { Prisma, PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

import { toBeijingDateKey } from "@/lib/date";
import { monthStart } from "@/services/finance-analysis";
import type { FinanceTransaction } from "@/types/finance";

const baseUrl = process.env.TEST_BASE_URL;
const screenshots = process.env.ACCEPTANCE_SCREENSHOT_DIR;

test("isolated browser acceptance: research calendar and finance", {
  skip: !baseUrl || !process.env.DATABASE_URL || !process.env.ALLOWED_GITHUB_USER_ID,
  timeout: 240_000,
}, async (t) => {
  assert.ok(baseUrl);
  if (screenshots) await mkdir(screenshots, { recursive: true });
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: process.env.ALLOWED_GITHUB_USER_ID! } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const project = await db.project.create({ data: { id: `accept-project-${marker}`, workspaceId: workspace.id,
    name: "验收测试项目", code: "ACCEPT" } });
  const token = randomUUID();
  await db.account.create({ data: { userId: user.id, type: "oauth", provider: "github",
    providerAccountId: process.env.ALLOWED_GITHUB_USER_ID! } });
  await db.session.create({ data: { userId: user.id, sessionToken: token,
    expires: new Date(Date.now() + 3_600_000) } });
  const today = toBeijingDateKey();
  const currentMonth = today.slice(0, 7);
  const previousMonth = monthStart(today, -1).slice(0, 7);
  const stamp = new Date().toISOString();
  const historicalId = `accept-history-${marker}`;
  await db.engineeringLog.create({ data: { id: historicalId, workspaceId: workspace.id,
    projectId: project.id, date: new Date(`${previousMonth}-05T00:00:00Z`), payload: {
      id: historicalId, projectId: project.id, date: `${previousMonth}-05`, title: "历史研发验收记录",
      workContent: "应按实际研发日期显示", result: "完成", problems: "", nextPlan: "",
      durationMinutes: 30, resultStatus: "完成", tags: [], attachments: [], createdAt: stamp, updatedAt: stamp,
    } } });
  await db.engineeringLog.createMany({ data: Array.from({ length: 4 }, (_, index) => {
    const id = `accept-same-day-${index}-${marker}`;
    return { id, workspaceId: workspace.id, projectId: project.id,
      date: new Date(`${currentMonth}-07T00:00:00Z`), payload: {
        id, projectId: project.id, date: `${currentMonth}-07`, title: `同日研发记录 ${index + 1}`,
        workContent: `同日内容 ${index + 1}`, result: "", problems: "", nextPlan: "",
        durationMinutes: 30, resultStatus: "部分完成", tags: [], attachments: [],
        createdAt: stamp, updatedAt: stamp,
      } };
  }) });
  const bill = (key: string, type: FinanceTransaction["type"], category: string,
    amount: number, date: string, description: string): FinanceTransaction => ({
    id: `accept-${key}-${marker}`, type, category, amount, date, description,
    account: "验收账户", note: key === "prior" ? "跨月搜索专用备注" : "",
    tags: [], createdAt: stamp, updatedAt: stamp,
  });
  const fixture = [
    bill("food", "支出", "餐饮", 12.30, `${currentMonth}-19`, "验收餐饮"),
    bill("travel", "支出", "交通", 7.70, `${currentMonth}-20`, "验收交通"),
    bill("income", "收入", "其他", 100, `${currentMonth}-20`, "验收收入"),
    bill("transfer", "转账", "其他", 50, `${currentMonth}-20`, "验收转账"),
    bill("deep", "支出", "其他", 1, `${currentMonth}-01`, "分页稀有账单"),
    bill("prior", "支出", "餐饮", 3, `${previousMonth}-28`, "跨月搜索账单"),
    ...Array.from({ length: 20 }, (_, index) => bill(`filler-${index}`, "转账", "其他", 1,
      today, `分页填充 ${index}`)),
  ];
  await db.financeTransaction.createMany({ data: fixture.map((item) => ({ id: item.id,
    workspaceId: workspace.id, payload: item as unknown as Prisma.InputJsonObject, amount: item.amount,
    date: new Date(`${item.date}T00:00:00Z`), type: item.type })) });
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
    const navigate = async (path: string) => { await page.goto(`${baseUrl}${path}`); await page.getByRole("heading", { name: path.startsWith("/finance") ? "理财记录" : path.startsWith("/calendar") ? "日历计划" : "工程经验" }).first().waitFor(); };
    const dayCell = (date: string) => page.getByRole("button", { name: `选择 ${date}` }).locator("..");
    const card = (label: string) => page.getByText(label, { exact: true }).first().locator("..");
    const report = async (params = "") => {
      const response = await context.request.get(`${baseUrl}/api/private/finance?start=${currentMonth}-01&end=${today}&${params}`);
      assert.equal(response.status(), 200, await response.text());
      return response.json() as Promise<{ expenseCents: number; incomeCents: number; balanceCents: number;
        totalCount: number; categories: { key: string; amountCents: number }[];
        trend: { key: string; amountCents: number }[]; items: FinanceTransaction[] }>;
    };

    await t.test("historical calendar date, create, edit, move, direct detail and delete", async () => {
      await navigate("/calendar");
      await page.getByLabel("选择日历日期").fill(`${previousMonth}-05`);
      assert.equal(await dayCell(`${previousMonth}-05`).getByRole("link", { name: "历史研发验收记录" }).count(), 1);
      await page.reload();
      await page.getByLabel("选择日历日期").fill(`${previousMonth}-05`);
      assert.equal(await dayCell(`${previousMonth}-05`).getByRole("link", { name: "历史研发验收记录" }).count(), 1);
      await dayCell(`${previousMonth}-05`).getByRole("link", { name: "历史研发验收记录" }).click();
      await page.waitForURL(`**/experiences?record=${historicalId}`);
      await page.getByRole("dialog", { name: "历史研发验收记录" }).getByText("应按实际研发日期显示").waitFor();
      await navigate("/experiences");
      await page.getByRole("article").filter({ hasText: "历史研发验收记录" }).waitFor();
      await page.getByRole("button", { name: "新增过程记录" }).click();
      const form = page.getByRole("dialog", { name: "新增研发过程记录" });
      await form.getByLabel("日期", { exact: true }).fill(`${currentMonth}-05`);
      await form.getByLabel("标题").fill("完成 DT7 遥控器控制");
      await form.getByLabel("工作内容").fill("完整内容供详情查看");
      await form.getByRole("button", { name: "保存记录" }).click();
      await page.getByRole("dialog", { name: "完成 DT7 遥控器控制" }).waitFor();
      await navigate("/calendar");
      await page.getByLabel("选择日历日期").fill(`${currentMonth}-05`);
      const link = dayCell(`${currentMonth}-05`).getByRole("link", { name: "完成 DT7 遥控器控制" });
      assert.equal(await link.count(), 1);
      assert.equal(await link.textContent(), "完成 DT7 遥控器控制");
      if (screenshots) await page.screenshot({ path: `${screenshots}/calendar-desktop.png`, fullPage: true });
      await link.click();
      await page.getByRole("dialog", { name: "完成 DT7 遥控器控制" }).getByText("完整内容供详情查看").waitFor();
      await page.getByRole("dialog", { name: "完成 DT7 遥控器控制" }).getByRole("button", { name: "编辑" }).click();
      const edit = page.getByRole("dialog", { name: "编辑研发过程记录" });
      await edit.getByLabel("标题").fill("完成 DT7 遥控器联调");
      await edit.getByLabel("日期", { exact: true }).fill(`${currentMonth}-06`);
      await edit.getByRole("button", { name: "保存记录" }).click();
      await page.getByRole("dialog", { name: "完成 DT7 遥控器联调" }).waitFor();
      await navigate("/calendar");
      await page.getByLabel("选择日历日期").fill(`${currentMonth}-06`);
      await dayCell(`${currentMonth}-06`).getByRole("link", { name: "完成 DT7 遥控器联调" }).waitFor();
      assert.equal(await dayCell(`${currentMonth}-05`).getByRole("link", { name: "完成 DT7 遥控器控制" }).count(), 0);
      await page.reload();
      await page.getByLabel("选择日历日期").fill(`${currentMonth}-06`);
      assert.equal(await dayCell(`${currentMonth}-06`).getByRole("link", { name: "完成 DT7 遥控器联调" }).count(), 1);
      await page.getByLabel("选择日历日期").fill(`${currentMonth}-07`);
      await dayCell(`${currentMonth}-07`).getByRole("button", { name: "另有 1 条，查看列表" }).click();
      for (let index = 1; index <= 4; index++) {
        assert.equal(await page.getByRole("link", { name: `同日研发记录 ${index}` }).count(), 1);
      }
      await navigate("/experiences");
      const row = page.getByRole("article").filter({ hasText: "完成 DT7 遥控器联调" });
      await row.getByRole("button", { name: "删除" }).click();
      await page.getByRole("dialog", { name: "删除过程记录" }).getByRole("button", { name: "确认删除" }).click();
      await row.waitFor({ state: "detached" });
      await navigate("/calendar");
      await page.getByLabel("选择日历日期").fill(`${currentMonth}-06`);
      await page.getByRole("heading", { name: "日历计划" }).waitFor();
      assert.equal(await dayCell(`${currentMonth}-06`).getByRole("link", { name: "完成 DT7 遥控器联调" }).count(), 0);
    });

    await t.test("finance totals, chart source, pagination search, chart filter and cross-month global search", async () => {
      await navigate("/finance");
      await page.getByText("匹配 25 笔").waitFor();
      assert.match(await card("总支出").textContent() ?? "", /¥21\.00/);
      assert.match(await card("总收入").textContent() ?? "", /¥100\.00/);
      assert.match(await card("期间结余").textContent() ?? "", /¥79\.00/);
      let actual = await report();
      assert.equal(actual.totalCount, 25);
      assert.deepEqual([actual.expenseCents, actual.incomeCents, actual.balanceCents], [2100, 10000, 7900]);
      assert.deepEqual(actual.categories.map((item) => item.amountCents), [1230, 770, 100]);
      assert.equal(actual.trend.find((item) => item.key === `${currentMonth}-02`)?.amountCents, 0);
      const categoryResponse = await context.request.get(`${baseUrl}/api/private/finance/categories`);
      assert.equal(categoryResponse.status(), 200);
      const seededCategories = await categoryResponse.json() as { categories: { name: string; color: string }[] };
      assert.ok(seededCategories.categories.some((item) => item.name === "餐饮" && /^#[0-9a-f]{6}$/.test(item.color)));
      if (screenshots) await page.screenshot({ path: `${screenshots}/finance-desktop.png`, fullPage: true });
      await page.getByRole("button", { name: `筛选 ${currentMonth}-01 消费` }).click();
      await page.getByText(`${currentMonth}-01 至 ${currentMonth}-01`).first().waitFor();
      await page.waitForFunction(() => [...document.querySelectorAll("article")].some((item) =>
        item.textContent?.includes("总支出") && item.textContent?.includes("¥1.00")));
      assert.match(await card("总支出").textContent() ?? "", /¥1\.00/);
      await page.getByRole("button", { name: "清空全部筛选" }).click();
      await page.getByRole("button", { name: "近六个月" }).click();
      await page.waitForFunction((start) => (document.querySelector('input[aria-label="开始日期"]') as HTMLInputElement)?.value === start,
        monthStart(today, -5));
      await card("总支出").waitFor();
      if (screenshots) await page.screenshot({ path: `${screenshots}/finance-six-month.png`, fullPage: false });
      await page.locator("svg text").filter({ hasText: new RegExp(`^${previousMonth}$`) }).click();
      await page.waitForFunction((start) => (document.querySelector('input[aria-label="开始日期"]') as HTMLInputElement)?.value === start,
        `${previousMonth}-01`);
      await page.waitForFunction(() => [...document.querySelectorAll("article")].some((item) =>
        item.textContent?.includes("总支出") && item.textContent?.includes("¥3.00")));
      await page.getByRole("button", { name: "清空全部筛选" }).click();
      await page.getByLabel("搜索账单关键词").fill("分页稀有账单");
      await page.getByText("匹配 1 笔").waitFor();
      assert.equal(await page.getByRole("article").filter({ hasText: "分页稀有账单" }).count(), 1);
      await page.getByRole("button", { name: "清空全部筛选" }).click();
      await page.getByRole("heading", { name: "消费类别占比" }).locator("..").getByRole("button", { name: /餐饮/ }).click();
      await page.getByText("分类：餐饮").waitFor();
      assert.match(await card("总支出").textContent() ?? "", /¥12\.30/);
      actual = await report("category=餐饮");
      assert.equal(actual.expenseCents, 1230);
      await page.getByRole("button", { name: "清空全部筛选" }).click();
      await page.getByRole("button", { name: "快速记账" }).click();
      const form = page.getByRole("dialog", { name: "快速记账" });
      await form.getByLabel("金额（元）").fill("2.25");
      await form.getByLabel("账单日期").fill(`${currentMonth}-21`);
      await form.getByLabel("分类").selectOption({ label: "餐饮" });
      await form.getByLabel("用途或标题").fill("浏览器验收新增");
      await form.getByRole("button", { name: "保存记录" }).click();
      await page.getByText("匹配 26 笔").waitFor();
      assert.match(await card("总支出").textContent() ?? "", /¥23\.25/);
      await page.getByLabel("搜索账单关键词").fill("浏览器验收新增");
      await page.getByText("匹配 1 笔").waitFor();
      const newRow = page.getByRole("article").filter({ hasText: "浏览器验收新增" });
      await newRow.getByRole("button", { name: "编辑浏览器验收新增" }).click();
      await page.getByRole("dialog", { name: "编辑账单" }).getByLabel("金额（元）").fill("4.25");
      await page.getByRole("dialog", { name: "编辑账单" }).getByRole("button", { name: "保存记录" }).click();
      await page.getByText("匹配 1 笔").waitFor();
      await page.waitForFunction(() => document.body.textContent?.includes("¥4.25"));
      await newRow.getByRole("button", { name: "删除浏览器验收新增" }).click();
      await page.getByRole("dialog", { name: "删除账单" }).getByRole("button", { name: "确认删除" }).click();
      await page.getByRole("button", { name: "清空全部筛选" }).click();
      await page.getByText("匹配 25 笔").waitFor();
      assert.match(await card("总支出").textContent() ?? "", /¥21\.00/);
      await page.getByRole("textbox", { name: "全局搜索" }).fill("跨月搜索账单");
      await page.getByRole("button", { name: /跨月搜索账单/ }).last().click();
      await page.waitForURL(`**/finance?record=${fixture[5].id}`);
      await page.getByRole("dialog", { name: "跨月搜索账单" }).getByText("跨月搜索专用备注").waitFor();
      if (screenshots) await page.screenshot({ path: `${screenshots}/finance-cross-month-detail.png`, fullPage: true });
      await page.getByRole("dialog", { name: "跨月搜索账单" }).getByRole("button", { name: "关闭", exact: true }).click();
      await page.getByRole("dialog", { name: "跨月搜索账单" }).waitFor({ state: "detached" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
      if (screenshots) await page.screenshot({ path: `${screenshots}/finance-mobile.png`, fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await page.goto(`${baseUrl}/finance?record=${fixture[5].id}`);
      await page.getByRole("dialog", { name: "跨月搜索账单" }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      if (screenshots) await page.screenshot({ path: `${screenshots}/finance-mobile-detail.png`, fullPage: false });
      await page.getByRole("dialog", { name: "跨月搜索账单" }).getByRole("button", { name: "关闭", exact: true }).click();
      await page.getByRole("dialog", { name: "跨月搜索账单" }).waitFor({ state: "detached" });
      await navigate("/calendar");
      await page.getByLabel("选择日历日期").fill(`${previousMonth}-05`);
      if (screenshots) await page.screenshot({ path: `${screenshots}/calendar-mobile.png`, fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      const removeCategory = await context.request.delete(`${baseUrl}/api/private/finance/categories`, {
        headers: { origin: baseUrl, "content-type": "application/json" },
        data: { name: "餐饮", migrateTo: "未分类" },
      });
      assert.equal(removeCategory.status(), 200, await removeCategory.text());
      const remapped = await report();
      assert.equal(remapped.totalCount, 25);
      assert.equal(remapped.expenseCents, 2100);
      assert.equal(remapped.categories.find((item) => item.key === "未分类")?.amountCents, 1230);
      assert.equal(await db.financeTransaction.count({ where: { workspaceId: workspace.id } }), fixture.length);
    });
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser?.close();
    await db.financeTransaction.deleteMany({ where: { workspaceId: workspace.id } });
    await db.financeCategorySetting.deleteMany({ where: { workspaceId: workspace.id } });
    await db.engineeringLog.deleteMany({ where: { workspaceId: workspace.id } });
    await db.project.deleteMany({ where: { workspaceId: workspace.id } });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
