import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";
import { chromium, type Browser, type Page } from "playwright";

import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { migrateWorkspaceV3 } from "@/lib/storage/workspace-migration";
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
  const browser = await chromium.launch({ headless: true,
    channel: process.env.TEST_BROWSER_CHANNEL ?? undefined });
  try {
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
  } finally {
    await browser.close();
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
