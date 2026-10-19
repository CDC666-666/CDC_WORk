import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_BASE_URL;
const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/3ZcAAAAASUVORK5CYII=";

test("legacy log link opens the original record with attachment and test/issue relations", {
  skip: !baseUrl || !process.env.DATABASE_URL || !process.env.ALLOWED_GITHUB_USER_ID,
}, async () => {
  assert.ok(baseUrl);
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: process.env.ALLOWED_GITHUB_USER_ID } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const token = randomUUID();
  await db.account.create({ data: { userId: user.id, type: "oauth", provider: "github",
    providerAccountId: process.env.ALLOWED_GITHUB_USER_ID! } });
  await db.session.create({ data: { userId: user.id, sessionToken: token,
    expires: new Date(Date.now() + 3600_000) } });
  const projectId = `log-project-${marker}`;
  const logId = `old-log-${marker}`;
  const experimentId = `log-test-${marker}`;
  const issueId = `log-issue-${marker}`;
  const title = `CAN 4310 过程记录 ${marker.slice(0, 8)}`;
  const headers = { cookie: `next-auth.session-token=${token}`, origin: baseUrl, "content-type": "application/json" };
  const create = async (collection: string, item: Record<string, unknown>) => {
    const response = await fetch(`${baseUrl}/api/private/entities/${collection}`, { method: "POST", headers,
      body: JSON.stringify({ item }) });
    assert.equal(response.status, 201, await response.text());
  };
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    await create("projects", { id: projectId, name: "关联项目", code: "LOG", status: "规划中",
      category: "个人", role: "个人", description: "", progress: 0, objectives: [], responsibilities: [],
      techStack: [], tags: [], visibility: "PRIVATE", coverStyle: "blue", repositoryUrl: "" });
    await create("engineeringLogs", { id: logId, projectId, title, date: "2026-10-15",
      workContent: "原始日志中文正文：CAN 总线超时", result: "已复现", problems: "4310 参数待查",
      nextPlan: "检查 PID", durationMinutes: 30, resultStatus: "部分完成", tags: ["CAN", "PID"],
      attachments: [image], createdAt: "2026-10-15T08:00:00.000Z", updatedAt: "2026-10-15T08:00:00.000Z" });
    await create("experiments", { id: experimentId, projectId, workLogId: logId,
      title: "关联测试", testDate: "2026-10-15", resultStatus: "待复测" });
    await create("technicalIssues", { id: issueId, projectId, testRecordId: experimentId,
      title: "关联问题", status: "待定位", severity: "S2" });
    browser = await chromium.launch({ headless: true, channel: process.env.TEST_BROWSER_CHANNEL ?? undefined });
    const context = await browser.newContext({ viewport: { width: 1280, height: 844 } });
    await context.addCookies([{ name: "next-auth.session-token", value: token, url: baseUrl }]);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/logs?record=${logId}`);
    await page.waitForURL(`${baseUrl}/experiences?record=${logId}`);
    const detail = page.getByRole("dialog", { name: title });
    await detail.getByText("原始日志中文正文：CAN 总线超时").waitFor();
    assert.equal(await detail.getByAltText("日志附件").count(), 1);
    assert.match(await detail.textContent() ?? "", /2026-10-15/);
    const stored = await db.engineeringLog.findUniqueOrThrow({ where: { id: logId } });
    assert.equal(stored.projectId, projectId);
    assert.deepEqual((stored.payload as { attachments: string[] }).attachments, [image]);
    assert.equal((await db.experiment.findUniqueOrThrow({ where: { id: experimentId } })).workLogId, logId);
    assert.equal((await db.technicalIssue.findUniqueOrThrow({ where: { id: issueId } })).testRecordId, experimentId);
    await detail.getByRole("button", { name: "关闭", exact: true }).click();
    await page.getByRole("textbox", { name: "全局搜索" }).fill("CAN 4310");
    await page.getByRole("button", { name: new RegExp(title) }).last().click();
    await page.waitForURL(`${baseUrl}/experiences?record=${logId}`);
    assert.equal(await page.getByRole("dialog", { name: title }).count(), 1);
  } finally {
    await browser?.close();
    await db.technicalIssue.deleteMany({ where: { workspaceId: workspace.id } });
    await db.experiment.deleteMany({ where: { workspaceId: workspace.id } });
    await db.engineeringLog.deleteMany({ where: { workspaceId: workspace.id } });
    await db.project.deleteMany({ where: { workspaceId: workspace.id } });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
