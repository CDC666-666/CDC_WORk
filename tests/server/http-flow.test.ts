import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";
import { createEmptyWorkspaceData } from "@/data/initial-workspace-data";
import { migrateWorkspaceV3 } from "@/lib/storage/workspace-migration";

const baseUrl = process.env.TEST_BASE_URL;

type ItemResponse = { item: { id: string; version?: number; date?: string; relatedProjectId?: string; summary?: string } };

test("private HTTP API enforces session and commits versioned reflection CRUD", { skip: !baseUrl || !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  assert.ok(baseUrl);
  const allowedId = process.env.ALLOWED_GITHUB_USER_ID;
  assert.ok(allowedId);
  const allowed = await db.user.create({ data: { githubId: allowedId } });
  const denied = await db.user.create({ data: { githubId: `test-denied-${marker}` } });
  const goodToken = randomUUID();
  const badToken = randomUUID();
  const expires = new Date(Date.now() + 3600_000);
  await db.account.createMany({ data: [
    { userId: allowed.id, type: "oauth", provider: "github", providerAccountId: allowedId },
    { userId: denied.id, type: "oauth", provider: "github", providerAccountId: `998-${marker}` },
  ] });
  await db.session.createMany({ data: [
    { userId: allowed.id, sessionToken: goodToken, expires },
    { userId: denied.id, sessionToken: badToken, expires },
  ] });
  await db.workspace.create({ data: { userId: allowed.id } });
  const headers = { cookie: `next-auth.session-token=${goodToken}` };
  const writeHeaders = { ...headers, origin: baseUrl, "content-type": "application/json" };
  let projectId = "";
  try {
    const anonymous = await fetch(`${baseUrl}/api/private/reviews`, { redirect: "manual" });
    assert.equal(anonymous.status, 401);
    const deniedResponse = await fetch(`${baseUrl}/api/private/reviews`, {
      headers: { cookie: `next-auth.session-token=${badToken}` }, redirect: "manual",
    });
    assert.equal(deniedResponse.status, 401);
    const privatePage = await fetch(`${baseUrl}/reflections`, { redirect: "manual" });
    assert.equal(privatePage.status, 307);
    assert.equal(privatePage.headers.get("location"), "/login");
    const deniedPage = await fetch(`${baseUrl}/reflections`, {
      headers: { cookie: `next-auth.session-token=${badToken}` }, redirect: "manual",
    });
    const deniedHtml = await deniedPage.text();
    assert.match(deniedHtml, /\/login/);
    assert.doesNotMatch(deniedHtml, /记录保存在本地 Workspace v4/);
    const allowedPage = await fetch(`${baseUrl}/reflections`, { headers, redirect: "manual" });
    assert.equal(allowedPage.status, 200);
    const allowedHtml = await allowedPage.text();
    assert.match(allowedHtml, /总结与复盘/);
    assert.match(allowedHtml, /退出登录/);
    const rawMigration = Object.fromEntries([
      "cdc-workspace-data-v4", "cdc-workspace-data-v3", "cdc-workspace-data-v2",
      "cdc-dashboard-task-state-v1", "cdc-workspace-data-v4-invalid-backup",
      "cdc-content-state-v1",
    ].map((key) => [key, null]));
    const anonymousMigration = await fetch(`${baseUrl}/api/private/migration/preview`, {
      method: "POST", headers: { origin: baseUrl, "content-type": "application/json" },
      body: JSON.stringify({ raw: rawMigration }),
    });
    assert.equal(anonymousMigration.status, 401);
    const deniedMigration = await fetch(`${baseUrl}/api/private/migration/preview`, {
      method: "POST", headers: { origin: baseUrl, "content-type": "application/json",
        cookie: `next-auth.session-token=${badToken}` },
      body: JSON.stringify({ raw: rawMigration }),
    });
    assert.equal(deniedMigration.status, 401);
    const migrationPreview = await fetch(`${baseUrl}/api/private/migration/preview`, {
      method: "POST", headers: writeHeaders, body: JSON.stringify({ raw: rawMigration }),
    });
    assert.equal(migrationPreview.status, 200);
    const migrationBody = (await migrationPreview.json()) as { preview: { canExecute: boolean } };
    assert.equal(migrationBody.preview.canExecute, false);
    const invalidMigrationOrigin = await fetch(`${baseUrl}/api/private/migration/execute`, {
      method: "POST", headers: { ...writeHeaders, origin: "https://other.invalid" },
      body: JSON.stringify({ raw: rawMigration, previewDigest: "0".repeat(64) }),
    });
    assert.equal(invalidMigrationOrigin.status, 403);

    const projectResponse = await fetch(`${baseUrl}/api/private/projects`, {
      method: "POST", headers: writeHeaders, body: JSON.stringify({ name: "三轴机械臂" }),
    });
    assert.equal(projectResponse.status, 201);
    projectId = ((await projectResponse.json()) as ItemResponse).item.id;
    const projectReview = { type: "PROJECT", date: "2026-10-03", summary: "控制问题复盘",
      achievement: "进入 MIT 模式", problem: "模式切换失败", plan: "检查控制字", relatedProjectId: projectId };
    const invalid = await fetch(`${baseUrl}/api/private/reviews`, {
      method: "POST", headers: writeHeaders, body: JSON.stringify({ ...projectReview, relatedProjectId: "missing" }),
    });
    assert.equal(invalid.status, 422);
    const csrf = await fetch(`${baseUrl}/api/private/reviews`, {
      method: "POST", headers: { ...writeHeaders, origin: "https://other.example" }, body: JSON.stringify(projectReview),
    });
    assert.equal(csrf.status, 403);
    const createdResponse = await fetch(`${baseUrl}/api/private/reviews`, {
      method: "POST", headers: writeHeaders, body: JSON.stringify(projectReview),
    });
    assert.equal(createdResponse.status, 201);
    const created = ((await createdResponse.json()) as ItemResponse).item;
    assert.equal(created.date, "2026-10-03");
    assert.equal(created.relatedProjectId, projectId);
    assert.equal(created.version, 1);

    const list = await fetch(`${baseUrl}/api/private/reviews?type=PROJECT&relatedProjectId=${projectId}`, { headers });
    assert.equal(list.status, 200);
    const listed = (await list.json()) as { items: Array<{ id: string }> };
    assert.deepEqual(listed.items.map((item) => item.id), [created.id]);
    const concurrent = await Promise.all([
      fetch(`${baseUrl}/api/private/reviews/${created.id}`, { method: "PATCH", headers: writeHeaders,
        body: JSON.stringify({ version: 1, summary: "设备 A" }) }),
      fetch(`${baseUrl}/api/private/reviews/${created.id}`, { method: "PATCH", headers: writeHeaders,
        body: JSON.stringify({ version: 1, summary: "设备 B" }) }),
    ]);
    assert.deepEqual(concurrent.map((response) => response.status).sort(), [200, 409]);
    const currentResponse = await fetch(`${baseUrl}/api/private/reviews/${created.id}`, { headers });
    const current = ((await currentResponse.json()) as ItemResponse).item;
    assert.equal(current.version, 2);
    assert.ok(current.summary === "设备 A" || current.summary === "设备 B");
    const staleDelete = await fetch(`${baseUrl}/api/private/reviews/${created.id}`, { method: "DELETE",
      headers: { ...writeHeaders, "if-match": '"1"' } });
    assert.equal(staleDelete.status, 409);
    const deleted = await fetch(`${baseUrl}/api/private/reviews/${created.id}`, { method: "DELETE",
      headers: { ...writeHeaders, "if-match": '"2"' } });
    assert.equal(deleted.status, 200);
    const missing = await fetch(`${baseUrl}/api/private/reviews/${created.id}`, { headers });
    assert.equal(missing.status, 404);

    const migrationState = migrateWorkspaceV3(createEmptyWorkspaceData());
    migrationState.reviews.push({ id: `http-migration-${marker}`, type: "DAILY", date: "2026-10-03",
      summary: "迁移测试", achievement: "完成", problem: "", plan: "继续" });
    const migrationSource = { ...rawMigration, "cdc-workspace-data-v4": JSON.stringify(migrationState) };
    const migrationPlanResponse = await fetch(`${baseUrl}/api/private/migration/preview`, {
      method: "POST", headers: writeHeaders, body: JSON.stringify({ raw: migrationSource }),
    });
    assert.equal(migrationPlanResponse.status, 200);
    const migrationPlan = (await migrationPlanResponse.json()) as { preview: { previewDigest: string; counts: {
      reviews: { written: number } } } };
    assert.equal(migrationPlan.preview.counts.reviews.written, 1);
    const migrationExecuteResponse = await fetch(`${baseUrl}/api/private/migration/execute`, {
      method: "POST", headers: writeHeaders,
      body: JSON.stringify({ raw: migrationSource, previewDigest: migrationPlan.preview.previewDigest }),
    });
    assert.equal(migrationExecuteResponse.status, 200);
    const migrated = (await migrationExecuteResponse.json()) as { result: { batchId: string; status: string } };
    assert.equal(migrated.result.status, "COMPLETED");
    const batchResponse = await fetch(`${baseUrl}/api/private/migration/batches/${migrated.result.batchId}`, { headers });
    assert.equal(batchResponse.status, 200);
    const anonymousBatch = await fetch(`${baseUrl}/api/private/migration/batches/${migrated.result.batchId}`);
    assert.equal(anonymousBatch.status, 401);

    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, { headers });
    assert.equal(csrfResponse.status, 200);
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
    const csrfCookies = csrfResponse.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
    assert.match(csrfCookies, /next-auth\.csrf-token=/);
    const signout = await fetch(`${baseUrl}/api/auth/signout`, {
      method: "POST",
      headers: { cookie: `${headers.cookie}; ${csrfCookies}`, origin: baseUrl,
        "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken, callbackUrl: "/login", json: "true" }),
      redirect: "manual",
    });
    assert.equal(signout.status, 200);
    assert.equal(await db.session.count({ where: { sessionToken: goodToken } }), 0);
    const afterSignout = await fetch(`${baseUrl}/api/private/reviews`, { headers });
    assert.equal(afterSignout.status, 401);
  } finally {
    const workspace = await db.workspace.findUnique({ where: { userId: allowed.id } });
    if (workspace) {
      await db.migrationPending.deleteMany({ where: { workspaceId: workspace.id } });
      await db.migrationEntityMap.deleteMany({ where: { workspaceId: workspace.id } });
      await db.migrationBatch.deleteMany({ where: { workspaceId: workspace.id } });
      await db.review.deleteMany({ where: { workspaceId: workspace.id } });
      if (projectId) await db.project.deleteMany({ where: { id: projectId, workspaceId: workspace.id } });
      await db.workspace.delete({ where: { id: workspace.id } });
    }
    await db.session.deleteMany({ where: { userId: { in: [allowed.id, denied.id] } } });
    await db.account.deleteMany({ where: { userId: { in: [allowed.id, denied.id] } } });
    await db.user.deleteMany({ where: { id: { in: [allowed.id, denied.id] } } });
    await db.$disconnect();
  }
});
