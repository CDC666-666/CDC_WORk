import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";
import { chromium, type Browser, type Page } from "playwright";

import { createEmptyWorkspaceData, createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { toLocalDateKey } from "@/lib/date";
import { migrateWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { navigationItems } from "@/lib/navigation";
import { RAW_STORAGE_KEYS, type RawBrowserSnapshot } from "@/types/migration";

const baseUrl = process.env.TEST_BASE_URL;
const fixedDate = new Date("2026-07-14T08:00:00+08:00");

function emptySnapshot(): RawBrowserSnapshot {
  return Object.fromEntries(RAW_STORAGE_KEYS.map((key) => [key, null])) as RawBrowserSnapshot;
}

function sourceCases(): Array<{ name: string; raw: RawBrowserSnapshot; canExecute: boolean }> {
  const old = createInitialWorkspaceData(fixedDate);
  const v2 = emptySnapshot();
  v2["cdc-workspace-data-v2"] = JSON.stringify({
    tasks: [old.tasks[0]], studyPlans: [], studySessions: [], readingItems: [],
    metadata: { schemaVersion: 2, createdAt: old.metadata.createdAt, updatedAt: old.metadata.updatedAt },
  });
  v2["cdc-dashboard-task-state-v1"] = JSON.stringify({ completedTaskIds: [old.tasks[0].id] });
  const v3 = emptySnapshot();
  v3["cdc-workspace-data-v3"] = JSON.stringify(old);
  const invalidV4 = emptySnapshot();
  invalidV4["cdc-workspace-data-v4"] = '{"metadata":{"schemaVersion":4},"projects":[]}';
  invalidV4["cdc-workspace-data-v3"] = JSON.stringify(old);
  invalidV4["cdc-workspace-data-v4-invalid-backup"] = "recovery-original-text";
  return [
    { name: "v2", raw: v2, canExecute: true },
    { name: "v3", raw: v3, canExecute: true },
    { name: "invalid-v4", raw: invalidV4, canExecute: false },
    { name: "empty", raw: emptySnapshot(), canExecute: false },
  ];
}

async function snapshot(page: Page): Promise<RawBrowserSnapshot> {
  const values = await page.evaluate((keys) =>
    Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])), [...RAW_STORAGE_KEYS]);
  return values as RawBrowserSnapshot;
}

async function storageWrites(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as Window & { __migrationWrites?: string[] }).__migrationWrites ?? []);
}

async function verifyDirectOpen(browser: Browser, raw: RawBrowserSnapshot, width: number,
  sessionToken: string, name: string, canExecute: boolean): Promise<void> {
  assert.ok(baseUrl);
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  try {
    await context.addCookies([{ name: "next-auth.session-token", value: sessionToken, url: baseUrl }]);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/login`);
    await page.evaluate((source) => {
      for (const [key, value] of Object.entries(source)) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
    }, raw);
    assert.deepEqual(await snapshot(page), raw, `${name}: initial values`);
    await page.addInitScript(() => {
      const monitored = window as Window & { __migrationWrites?: string[] };
      monitored.__migrationWrites = [];
      const setItem = Storage.prototype.setItem;
      const removeItem = Storage.prototype.removeItem;
      const clear = Storage.prototype.clear;
      Storage.prototype.setItem = function(this: Storage, key: string, value: string) {
        if (this === localStorage) monitored.__migrationWrites?.push(`set:${key}`);
        return setItem.call(this, key, value);
      };
      Storage.prototype.removeItem = function(this: Storage, key: string) {
        if (this === localStorage) monitored.__migrationWrites?.push(`remove:${key}`);
        return removeItem.call(this, key);
      };
      Storage.prototype.clear = function(this: Storage) {
        if (this === localStorage) monitored.__migrationWrites?.push("clear");
        return clear.call(this);
      };
    });
    const response = await page.goto(`${baseUrl}/migration`);
    assert.equal(response?.status(), 200, `${name}: authenticated route`);
    assert.deepEqual(await snapshot(page), raw, `${name}: direct open`);
    assert.deepEqual(await storageWrites(page), [], `${name}: no mount-time writes`);
    await page.getByRole("button", { name: /读取原始数据/ }).click();
    assert.deepEqual(await snapshot(page), raw, `${name}: after raw read`);
    assert.deepEqual(await storageWrites(page), [], `${name}: no read-time writes`);
    await page.getByRole("button", { name: /上传服务器预览/ }).click();
    await page.getByRole("heading", { name: "服务器预览" }).waitFor();
    assert.deepEqual(await snapshot(page), raw, `${name}: after server preview`);
    assert.deepEqual(await storageWrites(page), [], `${name}: no preview-time writes`);
    assert.equal(await page.getByRole("button", { name: /执行并核对/ }).isEnabled(), canExecute, name);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      true, `${name}: no page overflow at ${width}px`);
  } finally { await context.close(); }
}

async function verifyDemoDependencyChoice(browser: Browser, sessionToken: string): Promise<void> {
  assert.ok(baseUrl);
  const state = migrateWorkspaceV3(createInitialWorkspaceData(fixedDate), fixedDate);
  const reviewId = `browser-review-${randomUUID()}`;
  state.reviews.push({ id: reviewId, type: "PROJECT", date: "2026-07-14",
    summary: "个人复盘", achievement: "完成测试", problem: "", plan: "继续",
    relatedProjectId: state.projects[0].id });
  const raw = emptySnapshot();
  raw["cdc-workspace-data-v4"] = JSON.stringify(state);
  const context = await browser.newContext();
  try {
    await context.addCookies([{ name: "next-auth.session-token", value: sessionToken, url: baseUrl }]);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/login`);
    await page.evaluate((source) => {
      for (const [key, value] of Object.entries(source)) {
        if (value !== null) localStorage.setItem(key, value);
      }
    }, raw);
    await page.goto(`${baseUrl}/migration`);
    await page.getByRole("button", { name: /读取原始数据/ }).click();
    await page.getByRole("button", { name: /上传服务器预览/ }).click();
    const dependency = page.locator("label").filter({ hasText: `reviews:${reviewId}` });
    await dependency.locator('input[type="checkbox"]').check();
    assert.equal(await page.getByText(/选择已变化，请重新上传服务器预览/).isVisible(), true);
    assert.equal(await page.getByRole("button", { name: /执行并核对/ }).isEnabled(), false);
    await page.getByRole("button", { name: /上传服务器预览/ }).click();
    await page.getByText("当前预览没有未满足的关联依赖。").waitFor();
    assert.equal(await page.getByRole("button", { name: /执行并核对/ }).isEnabled(), true);
    assert.deepEqual(await snapshot(page), raw);
  } finally { await context.close(); }
}

async function verifyServerWorkspaceFlow(browser: Browser, sessionToken: string, db: PrismaClient,
  userId: string): Promise<void> {
  assert.ok(baseUrl);
  const workspace = await db.workspace.findUniqueOrThrow({ where: { userId } });
  const marker = randomUUID();
  const projectId = `browser-project-${marker}`;
  const semesterId = `browser-semester-${marker}`;
  const courseId = `browser-course-${marker}`;
  const assignmentId = `browser-assignment-${marker}`;
  const assignmentTitle = `跨页面作业 ${marker.slice(0, 8)}`;
  const title = `浏览器同步任务 ${marker.slice(0, 8)}`;
  const source = migrateWorkspaceV3(createEmptyWorkspaceData(), fixedDate);
  source.projects.push({ ...migrateWorkspaceV3(createInitialWorkspaceData(fixedDate), fixedDate).projects[0],
    id: projectId, name: `浏览器项目 ${marker.slice(0, 8)}` });
  const raw = emptySnapshot();
  raw["cdc-workspace-data-v4"] = JSON.stringify(source);
  const headers = { cookie: `next-auth.session-token=${sessionToken}`, origin: baseUrl,
    "content-type": "application/json" };
  const first = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const second = await browser.newContext({ viewport: { width: 1280, height: 844 } });
  try {
    const previewResponse = await fetch(`${baseUrl}/api/private/migration/preview`, {
      method: "POST", headers, body: JSON.stringify({ raw }),
    });
    assert.equal(previewResponse.status, 200);
    const preview = (await previewResponse.json()) as { preview: { canExecute: boolean; previewDigest: string } };
    assert.equal(preview.preview.canExecute, true);
    const executed = await fetch(`${baseUrl}/api/private/migration/execute`, {
      method: "POST", headers, body: JSON.stringify({ raw, previewDigest: preview.preview.previewDigest }),
    });
    assert.equal(executed.status, 200);
    await first.addCookies([{ name: "next-auth.session-token", value: sessionToken, url: baseUrl }]);
    await second.addCookies([{ name: "next-auth.session-token", value: sessionToken, url: baseUrl }]);
    const page = await first.newPage();
    await page.goto(`${baseUrl}/login`);
    await page.evaluate((values) => {
      for (const [key, value] of Object.entries(values)) if (value !== null) localStorage.setItem(key, value);
    }, raw);
    assert.equal((await page.goto(`${baseUrl}/projects`))?.status(), 200);
    await page.getByRole("heading", { name: source.projects[0].name }).waitFor();
    assert.deepEqual(await snapshot(page), raw, "daily page must preserve raw browser keys");
    for (const route of navigationItems) {
      const response = await page.goto(`${baseUrl}${route.href}`);
      assert.equal(response?.status(), 200, `${route.href} should not return 404`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        true, `${route.href} should not overflow at 390px`);
    }
    assert.deepEqual(await snapshot(page), raw, "navigation must preserve old browser keys");
    await page.goto(`${baseUrl}/today`);
    await page.getByRole("textbox", { name: "快速任务标题" }).fill(title);
    await page.route("**/api/private/entities/tasks", (route) => route.fulfill({
      status: 503, contentType: "application/json", body: JSON.stringify({ error: "临时写入失败" }),
    }));
    await page.getByRole("button", { name: "添加", exact: true }).click();
    await page.getByText("临时写入失败").first().waitFor();
    assert.equal(await page.getByRole("textbox", { name: "快速任务标题" }).inputValue(), title);
    await page.unroute("**/api/private/entities/tasks");
    await page.getByRole("button", { name: "添加", exact: true }).click();
    await page.getByRole("heading", { name: title }).waitFor();
    const otherPage = await second.newPage();
    await otherPage.goto(`${baseUrl}/today`);
    await otherPage.getByRole("heading", { name: title }).waitFor();
    await page.getByRole("button", { name: "完成", exact: true }).click();
    await page.getByText("任务已完成", { exact: true }).waitFor();
    await otherPage.getByRole("button", { name: "完成", exact: true }).click();
    await otherPage.getByText(/重新加载后再试/).waitFor();
    await otherPage.reload();
    await otherPage.getByRole("button", { name: "恢复", exact: true }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: title }).waitFor();
    await page.getByRole("button", { name: "删除", exact: true }).click();
    await page.getByRole("button", { name: /确认删除/ }).click();
    await page.getByText("任务已删除", { exact: true }).waitFor();
    await otherPage.reload();
    assert.equal(await otherPage.getByRole("heading", { name: title }).count(), 0);
    const create = async (collection: string, item: Record<string, unknown>) => {
      const response = await fetch(`${baseUrl}/api/private/entities/${collection}`, {
        method: "POST", headers, body: JSON.stringify({ item }),
      });
      assert.equal(response.status, 201, `${collection}: ${await response.text()}`);
    };
    await create("semesters", { id: semesterId, year: 2026, term: "秋", name: "浏览器验收学期" });
    await create("courses", { id: courseId, semesterId, name: "浏览器验收课程", type: "MAJOR",
      teacher: "", credits: 2, importance: 3, status: "IN_PROGRESS" });
    await create("assignments", { id: assignmentId, courseId, title: assignmentTitle,
      description: "验证作业派生", deadline: toLocalDateKey(), status: "TODO", priority: "MEDIUM" });
    const aggregateResponse = await fetch(`${baseUrl}/api/private/workspace`, { headers });
    assert.equal(aggregateResponse.status, 200);
    const aggregate = (await aggregateResponse.json()) as { domain: { academic: {
      assignments: Array<{ id: string; deadline: string }> } } };
    assert.equal(aggregate.domain.academic.assignments.find((item) => item.id === assignmentId)?.deadline,
      toLocalDateKey());
    await page.goto(baseUrl);
    try {
      await page.getByRole("button", { name: `完成作业${assignmentTitle}` }).waitFor({ timeout: 5000 });
    } catch (cause: unknown) {
      throw new Error(`Assignment was not shown on Today page: ${await page.locator("body").innerText()}`, { cause });
    }
    assert.equal(await page.getByText(assignmentTitle, { exact: true }).count(), 1,
      "assignment appears once on the home task list");
    await page.goto(`${baseUrl}/calendar`);
    await page.getByRole("button", { name: "日程列表" }).click();
    await page.getByText(`作业：${assignmentTitle}`).waitFor();
    await page.goto(baseUrl);
    await page.getByRole("button", { name: `完成作业${assignmentTitle}` }).click();
    await page.getByRole("button", { name: `将作业${assignmentTitle}标记为未完成` }).waitFor();
    await page.goto(`${baseUrl}/academic/${courseId}`);
    await page.getByText(assignmentTitle, { exact: true }).waitFor();
    await page.getByText(/已完成/).first().waitFor();
    await otherPage.goto(`${baseUrl}/academic/${courseId}`);
    await otherPage.getByText(assignmentTitle, { exact: true }).waitFor();
    await otherPage.getByText(/已完成/).first().waitFor();
    assert.equal(await db.task.count({ where: { workspaceId: workspace.id } }), 0,
      "assignment must not create an independent Task");
    await page.goto(baseUrl);
    assert.deepEqual(await snapshot(page), raw, "daily writes must not modify old browser keys");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true);
    await page.getByRole("button", { name: "退出登录" }).click();
    await page.waitForURL("**/login");
    const afterLogout = await page.goto(`${baseUrl}/projects`);
    assert.equal(afterLogout?.status(), 200);
    assert.equal(new URL(page.url()).pathname, "/login");
  } finally {
    await first.close();
    await second.close();
    await db.task.deleteMany({ where: { workspaceId: workspace.id } });
    await db.assignment.deleteMany({ where: { workspaceId: workspace.id, id: assignmentId } });
    await db.course.deleteMany({ where: { workspaceId: workspace.id, id: courseId } });
    await db.semester.deleteMany({ where: { workspaceId: workspace.id, id: semesterId } });
    await db.migrationPending.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationEntityMap.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationBatch.deleteMany({ where: { workspaceId: workspace.id } });
    await db.project.deleteMany({ where: { workspaceId: workspace.id, id: projectId } });
  }
}

test("direct migration page leaves all six raw keys unchanged through read and preview", {
  skip: !baseUrl || !process.env.DATABASE_URL,
}, async () => {
  assert.ok(baseUrl);
  const allowedId = process.env.ALLOWED_GITHUB_USER_ID;
  assert.ok(allowedId);
  const db = new PrismaClient();
  const user = await db.user.create({ data: { githubId: allowedId } });
  const sessionToken = randomUUID();
  await db.account.create({ data: { userId: user.id, type: "oauth", provider: "github",
    providerAccountId: allowedId } });
  await db.session.create({ data: { userId: user.id, sessionToken, expires: new Date(Date.now() + 3600_000) } });
  await db.workspace.create({ data: { userId: user.id } });
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true,
      channel: process.env.TEST_BROWSER_CHANNEL ?? undefined });
    const anonymous = await browser.newPage();
    await anonymous.goto(`${baseUrl}/migration`);
    const redirect = new URL(anonymous.url());
    assert.equal(redirect.pathname, "/login");
    assert.equal(redirect.searchParams.get("callbackUrl"), "/migration");
    await anonymous.close();
    for (const source of sourceCases()) {
      await verifyDirectOpen(browser, source.raw, 390, sessionToken, source.name, source.canExecute);
    }
    await verifyDirectOpen(browser, sourceCases()[1].raw, 1280, sessionToken, "v3-desktop", true);
    await verifyDemoDependencyChoice(browser, sessionToken);
    await verifyServerWorkspaceFlow(browser, sessionToken, db, user.id);
  } finally {
    await browser?.close();
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
