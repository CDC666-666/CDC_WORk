import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_BASE_URL;

test("backfilled reflection follows its date, and QQ experience is editable and searchable", {
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
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.TEST_BROWSER_CHANNEL ?? undefined });
    const context = await browser.newContext({ viewport: { width: 1280, height: 844 } });
    await context.addCookies([{ name: "next-auth.session-token", value: token, url: baseUrl }]);
    const page = await context.newPage();
    const title = `补写总结 ${randomUUID().slice(0, 8)}`;
    await page.goto(`${baseUrl}/calendar`);
    await page.getByLabel("选择日历日期").fill("2026-10-15");
    await page.getByRole("link", { name: /新建 2026-10-15 总结/ }).click();
    await page.getByRole("dialog", { name: "新增总结" }).waitFor();
    assert.equal(await page.getByLabel("总结日期").inputValue(), "2026-10-15");
    await page.getByLabel("总结标题").fill(title);
    await page.getByLabel("总结正文").fill("CAN 超时中文正文，4310 电机 PID 复测。");
    await page.getByRole("button", { name: "保存总结" }).click();
    await page.getByRole("dialog", { name: "每日总结" }).waitFor();
    const review = await db.review.findFirstOrThrow({ where: { workspaceId: workspace.id, summary: title } });
    assert.equal(review.date.toISOString().slice(0, 10), "2026-10-15");
    await page.goto(`${baseUrl}/calendar`);
    await page.getByLabel("选择日历日期").fill("2026-10-15");
    const day = (value: string) => page.getByRole("button", { name: `选择 ${value}` }).locator("..");
    await day("2026-10-15").getByRole("link", { name: new RegExp(title) }).waitFor();
    await day("2026-10-15").getByRole("link", { name: new RegExp(title) }).click();
    await page.waitForURL(`${baseUrl}/reflections?reviewId=${review.id}`);
    await page.getByRole("dialog", { name: "每日总结" }).getByRole("button", { name: "编辑总结" }).click();
    await page.getByLabel("总结日期").fill("2026-10-16");
    await page.getByLabel("总结正文").fill("编辑后正文：CAN 参数已调整。");
    await page.getByRole("button", { name: "保存总结" }).click();
    await page.getByRole("dialog", { name: "每日总结" }).waitFor();
    await page.goto(`${baseUrl}/calendar`);
    await page.getByLabel("选择日历日期").fill("2026-10-16");
    assert.equal(await day("2026-10-15").getByRole("link", { name: new RegExp(title) }).count(), 0);
    await day("2026-10-16").getByRole("link", { name: new RegExp(title) }).waitFor();
    await page.goto(`${baseUrl}/reflections`);
    await page.getByRole("article").filter({ hasText: title }).getByRole("button", { name: "删除" }).click();
    await page.getByRole("dialog", { name: "删除总结" }).getByRole("button", { name: "确认删除" }).click();
    await page.waitForFunction((id) => !document.body.textContent?.includes(id), title);
    await page.goto(`${baseUrl}/calendar`);
    await page.getByLabel("选择日历日期").fill("2026-10-16");
    assert.equal(await day("2026-10-16").getByRole("link", { name: new RegExp(title) }).count(), 0);

    const qqTitle = `QQ 群 CAN 超时 ${randomUUID().slice(0, 8)}`;
    await page.goto(`${baseUrl}/experiences`);
    await page.getByRole("button", { name: "QQ 群经验", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "新增 QQ 技术群经验" });
    await editor.getByLabel("标题").fill(qqTitle);
    await editor.getByLabel("正文（可直接粘贴 AI 整理结果）").fill("4310 电机 CAN 超时：先检查 PID 参数。");
    await editor.getByLabel("来源群或说明").fill("控制技术讨论");
    await editor.getByLabel("技术标签（逗号分隔）").fill("CAN, PID");
    await editor.getByRole("button", { name: "保存经验" }).click();
    await page.getByRole("dialog", { name: qqTitle }).waitFor();
    const knowledge = await db.knowledge.findFirstOrThrow({ where: { workspaceId: workspace.id } });
    assert.equal((knowledge.payload as { title: string }).title, qqTitle);
    await page.getByRole("dialog", { name: qqTitle }).getByRole("button", { name: "编辑" }).click();
    const edit = page.getByRole("dialog", { name: "编辑 QQ 技术群经验" });
    await edit.getByLabel("正文（可直接粘贴 AI 整理结果）").fill("4310 电机 CAN 超时：PID 参数已在本人设备复测。");
    await edit.getByLabel("验证状态").selectOption("已实测");
    await edit.getByRole("button", { name: "保存经验" }).click();
    await edit.waitFor({ state: "hidden" });
    const savedKnowledge = await db.knowledge.findUniqueOrThrow({ where: { id: knowledge.id } });
    const savedItem = savedKnowledge.payload as { tags: string[]; experience: { qq: { verification: string } } };
    assert.equal(savedItem.experience.qq.verification, "已实测");
    assert.ok(savedItem.tags.includes("PID"));
    await page.goto(`${baseUrl}/experiences`);
    await page.getByRole("tab", { name: "QQ 技术群经验" }).click();
    await page.getByLabel("QQ 经验验证状态").selectOption("已实测");
    await page.getByLabel("标签筛选").fill("PID");
    await page.getByText(qqTitle, { exact: true }).waitFor();
    await page.getByRole("textbox", { name: "全局搜索" }).fill("4310 电机");
    await page.getByRole("button", { name: new RegExp(qqTitle) }).last().click();
    await page.waitForURL(`${baseUrl}/experiences?record=${knowledge.id}`);
    await page.getByRole("dialog", { name: qqTitle }).getByText("已实测").waitFor();
    assert.equal(await db.knowledge.count({ where: { workspaceId: workspace.id } }), 1);
  } finally {
    await browser?.close();
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.knowledge.deleteMany({ where: { workspaceId: workspace.id } });
    await db.review.deleteMany({ where: { workspaceId: workspace.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
