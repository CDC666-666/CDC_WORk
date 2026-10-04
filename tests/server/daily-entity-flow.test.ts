import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { serverWorkspaceEntityService as service } from "@/services/server/workspace-entity-service";
import { MIGRATION_COLLECTIONS } from "@/types/migration";
import { MIGRATION_TABLES } from "@/services/migration/registry";

test("daily entity API persists native rows, checks versions and relations, and reads all modules", {
  skip: !process.env.DATABASE_URL,
}, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: `daily-${marker}` } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const id = workspace.id;
  const projectId = `project-${marker}`;
  const now = "2026-10-04T08:00:00.000Z";
  const project = { id: projectId, name: "个人机械臂", code: "ARM", category: "个人", role: "开发",
    description: "", status: "进行中", progress: 10, startDate: "2026-10-04", endDate: "",
    objectives: [], responsibilities: [], techStack: [], repositoryUrl: "", coverStyle: "blue",
    tags: [], visibility: "PRIVATE", createdAt: now, updatedAt: now };
  try {
    assert.equal((await service.snapshot(id)).hasServerRecords, false);
    const created = await service.create(id, "projects", project);
    assert.equal(created.version, 1);
    assert.equal((await db.project.findUniqueOrThrow({ where: { id: projectId } })).migrationBatchId, null);
    const reviewId = `review-${marker}`;
    await service.create(id, "reviews", { id: reviewId, type: "PROJECT", date: "2026-10-04",
      summary: "复盘", achievement: "完成", problem: "", plan: "继续", relatedProjectId: projectId });
    const semesterId = `semester-${marker}`;
    const courseId = `course-${marker}`;
    const assignmentId = `assignment-${marker}`;
    await service.create(id, "semesters", { id: semesterId, year: 2026, term: "AUTUMN", name: "秋季" });
    await service.create(id, "courses", { id: courseId, semesterId, name: "控制", type: "MAJOR", status: "IN_PROGRESS" });
    await service.create(id, "assignments", { id: assignmentId, courseId, title: "设计作业",
      deadline: "2026-10-10", status: "TODO" });
    const financeId = `finance-${marker}`;
    await service.create(id, "financeTransactions", { id: financeId, type: "支出", date: "2026-10-04",
      amount: 12.34, category: "学习", account: "现金", description: "资料", tags: [], createdAt: now, updatedAt: now });
    const taskId = `task-${marker}`;
    await service.create(id, "tasks", { id: taskId, title: "控制调试", status: "待开始", priority: "高",
      sourceType: "PROJECT", relatedId: projectId, scheduledDate: "2026-10-04",
      deadline: "2026-10-04T12:00:00.000Z", actualHours: 0, tags: [] });
    await service.create(id, "engineeringLogs", { id: `log-${marker}`, projectId, taskId,
      title: "MIT 模式调试", date: "2026-10-04", durationMinutes: 90,
      workContent: "检查控制字", resultStatus: "完成", tags: [] });
    const taskAfterLog = (await service.snapshot(id)).domain.tasks.find((item) => item.id === taskId);
    assert.equal(taskAfterLog?.actualHours, 1.5);
    const planId = `plan-${marker}`;
    await service.create(id, "studyPlans", { id: planId, title: "控制学习", targetHours: 2,
      completedHours: 0, progress: 0, status: "未开始", deadline: "2026-10-10" });
    await service.create(id, "studySessions", { id: `study-${marker}`, studyPlanId: planId,
      date: "2026-10-04", durationMinutes: 60, content: "PID" });
    assert.equal((await service.snapshot(id)).domain.legacy.studyPlans.find((item) => item.id === planId)?.progress, 50);
    const skillId = `skill-${marker}`;
    await service.create(id, "skills", { id: skillId, name: "C++", score: 20, level: 1 });
    await service.create(id, "skillEvidence", { id: `evidence-${marker}`, skillId,
      evidenceType: "manual", description: "项目实践", scoreChange: 2, occurredAt: now });
    assert.equal((await service.snapshot(id)).domain.skills.find((item) => item.id === skillId)?.score, 22);
    assert.equal((await db.skillEvidence.findUniqueOrThrow({ where: { id: `evidence-${marker}` } })).migrationBatchId, null);
    const snapshot = await service.snapshot(id);
    assert.equal(snapshot.domain.reviews[0].relatedProjectId, projectId);
    assert.equal(snapshot.domain.academic.assignments[0].courseId, courseId);
    assert.equal(snapshot.domain.legacy.financeTransactions[0].amount, 12.34);
    assert.equal(snapshot.versions[`assignments:${assignmentId}`], 1);
    const changed = await service.update(id, "assignments", assignmentId, 1, { status: "COMPLETED" });
    assert.equal(changed.version, 2);
    await assert.rejects(() => service.update(id, "assignments", assignmentId, 1, { status: "TODO" }),
      /重新加载/);
    await assert.rejects(() => service.delete(id, "projects", projectId, 1), /关联/);
    await assert.rejects(() => service.delete(id, "courses", courseId, 1), /关联/);
    assert.equal((await service.snapshot(id)).domain.academic.assignments[0].status, "COMPLETED");
    await service.delete(id, "assignments", assignmentId, 2);
    assert.equal((await service.snapshot(id)).domain.academic.assignments.length, 0);
    await assert.rejects(() => service.create(id, "financeTransactions", { id: `bad-${marker}`,
      type: "支出", date: "2026-02-30", amount: 1.234 }), /日期|amount/);
    await assert.rejects(() => service.create(id, "reviews", { id: `orphan-${marker}`,
      type: "PROJECT", date: "2026-10-04", summary: "无效", relatedProjectId: "missing" }), /不存在/);
  } finally {
    for (const collection of [...MIGRATION_COLLECTIONS].reverse()) {
      await db.$executeRawUnsafe(`DELETE FROM "${MIGRATION_TABLES[collection].table}" WHERE "workspaceId" = $1`, id);
    }
    await db.workspace.delete({ where: { id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
