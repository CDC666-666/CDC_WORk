import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { ApiError } from "@/lib/server/api-response";
import { serverReviewRepository } from "@/repositories/server/review-repository";

test("PostgreSQL commits reflections, rejects invalid projects and stale versions", { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: `test-${marker}` } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const project = await db.project.create({ data: { id: `project-${marker}`, workspaceId: workspace.id, name: "三轴机械臂" } });
  try {
    const draft = { type: "PROJECT" as const, date: "2026-10-03", summary: "完成复盘", achievement: "控制稳定",
      problem: "偶发抖动", plan: "继续定位", relatedProjectId: project.id };
    await assert.rejects(serverReviewRepository.create(workspace.id, { ...draft, relatedProjectId: "missing" }),
      (error: unknown) => error instanceof ApiError && error.status === 422);
    const otherUser = await db.user.create({ data: { githubId: `other-${marker}` } });
    const otherWorkspace = await db.workspace.create({ data: { userId: otherUser.id } });
    const otherProject = await db.project.create({ data: { id: `other-project-${marker}`, workspaceId: otherWorkspace.id, name: "其他工作台" } });
    try {
      await assert.rejects(serverReviewRepository.create(workspace.id, { ...draft, relatedProjectId: otherProject.id }),
        (error: unknown) => error instanceof ApiError && error.status === 422);
    } finally {
      await db.project.delete({ where: { id: otherProject.id } });
      await db.workspace.delete({ where: { id: otherWorkspace.id } });
      await db.user.delete({ where: { id: otherUser.id } });
    }
    assert.equal((await serverReviewRepository.list(workspace.id)).length, 0);
    const created = await serverReviewRepository.create(workspace.id, draft);
    assert.equal(created.date, "2026-10-03");
    assert.equal(created.version, 1);
    await assert.rejects(db.project.delete({ where: { id: project.id } }));
    const results = await Promise.allSettled([
      serverReviewRepository.update(workspace.id, created.id, 1, { ...draft, summary: "设备 A" }),
      serverReviewRepository.update(workspace.id, created.id, 1, { ...draft, summary: "设备 B" }),
    ]);
    assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal(results.filter((item) => item.status === "rejected" && item.reason instanceof ApiError && item.reason.status === 409).length, 1);
    const persisted = await serverReviewRepository.get(workspace.id, created.id);
    assert.equal(persisted?.version, 2);
    assert.equal((await serverReviewRepository.list("another-workspace")).length, 0);
    const newConnection = new PrismaClient();
    try {
      const afterReconnect = await newConnection.review.findUnique({ where: { id: created.id } });
      assert.equal(afterReconnect?.version, 2);
    } finally { await newConnection.$disconnect(); }
    await assert.rejects(serverReviewRepository.delete(workspace.id, created.id, 1),
      (error: unknown) => error instanceof ApiError && error.status === 409);
    const attachment = await db.attachment.create({ data: { id: `attachment-${marker}`, workspaceId: workspace.id,
      url: "https://example.invalid/reference", type: "text/plain", relatedType: "REVIEW", relatedId: created.id } });
    await assert.rejects(serverReviewRepository.delete(workspace.id, created.id, 2),
      (error: unknown) => error instanceof ApiError && error.status === 409);
    await db.attachment.delete({ where: { id: attachment.id } });
    await serverReviewRepository.delete(workspace.id, created.id, 2);
    assert.equal(await serverReviewRepository.get(workspace.id, created.id), null);
  } finally {
    await db.review.deleteMany({ where: { workspaceId: workspace.id } });
    await db.attachment.deleteMany({ where: { workspaceId: workspace.id } });
    await db.project.deleteMany({ where: { workspaceId: workspace.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
