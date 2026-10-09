import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { ApiError } from "@/lib/server/api-response";
import { MIGRATION_TABLES } from "@/services/migration/registry";
import { serverWorkspaceEntityService as service } from "@/services/server/workspace-entity-service";
import { MIGRATION_COLLECTIONS } from "@/types/migration";

type Attempt = { id: string; write: () => Promise<unknown> };
type ParentTable = "StudyPlan" | "Task" | "Skill";

/** Hold the parent row so both transactions read the same version before either UPDATE can commit. */
async function raceAtOneVersion(db: PrismaClient, table: ParentTable, id: string,
  attempts: readonly [Attempt, Attempt]): Promise<{ accepted: Attempt; rejected: Attempt }> {
  let signalLocked!: () => void;
  let release!: () => void;
  const locked = new Promise<void>((resolve) => { signalLocked = resolve; });
  const released = new Promise<void>((resolve) => { release = resolve; });
  const blocker = db.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(`SELECT "id" FROM "${table}" WHERE "id" = $1 FOR NO KEY UPDATE`, id);
    signalLocked();
    await released;
  }, { timeout: 20_000 });
  await locked;
  const resultsPromise = Promise.allSettled(attempts.map((attempt) => attempt.write()));
  try {
    const deadline = Date.now() + 8_000;
    let blocked = 0;
    while (Date.now() < deadline) {
      const rows = await db.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT COUNT(*)::integer AS "count" FROM pg_stat_activity
         WHERE wait_event_type = 'Lock' AND query LIKE $1`, `%UPDATE "${table}" SET%`,
      );
      blocked = rows[0]?.count ?? 0;
      if (blocked >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.ok(blocked >= 2, `two ${table} transactions must wait on the same parent version`);
  } finally { release(); }
  await blocker;
  const results = await resultsPromise;
  const successes = results.flatMap((result, index) => result.status === "fulfilled" ? [attempts[index]] : []);
  const failures = results.flatMap((result, index) => result.status === "rejected" ?
    [{ attempt: attempts[index], reason: result.reason as unknown }] : []);
  assert.equal(successes.length, 1, `${table}: exactly one write may commit the observed version`);
  assert.equal(failures.length, 1);
  assert.ok(failures[0].reason instanceof ApiError && failures[0].reason.status === 409,
    `${table}: the losing transaction must report a retryable version conflict`);
  return { accepted: successes[0], rejected: failures[0].attempt };
}

test("concurrent child inserts either accumulate exactly or roll back and retry safely", {
  skip: !process.env.DATABASE_URL,
}, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: `linked-race-${marker}` } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const workspaceId = workspace.id;
  const planId = `race-plan-${marker}`;
  const projectId = `race-project-${marker}`;
  const taskId = `race-task-${marker}`;
  const skillId = `race-skill-${marker}`;
  try {
    await service.create(workspaceId, "studyPlans", { id: planId, title: "并发学习",
      targetHours: 4, completedHours: 0, progress: 0, status: "未开始", deadline: "2026-10-10" });
    await service.create(workspaceId, "projects", { id: projectId, name: "并发工程", code: "RACE",
      category: "个人", role: "开发", description: "", status: "进行中", progress: 0,
      startDate: "2026-10-04", endDate: "", objectives: [], responsibilities: [], techStack: [],
      repositoryUrl: "", coverStyle: "blue", tags: [], visibility: "PRIVATE",
      createdAt: "2026-10-04T08:00:00.000Z", updatedAt: "2026-10-04T08:00:00.000Z" });
    await service.create(workspaceId, "tasks", { id: taskId, title: "并发调试", status: "待开始",
      priority: "中", sourceType: "PROJECT", relatedId: projectId, actualHours: 0,
      scheduledDate: "2026-10-04", deadline: "2026-10-04T12:00:00.000Z" });
    await service.create(workspaceId, "skills", { id: skillId, name: "控制", score: 20, level: 1 });

    const sessions: [Attempt, Attempt] = [0, 1].map((index) => ({
      id: `race-session-${index}-${marker}`,
      write: () => service.create(workspaceId, "studySessions", {
        id: `race-session-${index}-${marker}`, studyPlanId: planId,
        date: "2026-10-04", durationMinutes: 60, content: `第 ${index + 1} 次学习`,
      }),
    })) as [Attempt, Attempt];
    const sessionRace = await raceAtOneVersion(db, "StudyPlan", planId, sessions);
    assert.equal(await db.studySession.count({ where: { workspaceId } }), 1);
    assert.equal(await db.studySession.findUnique({ where: { id: sessionRace.rejected.id } }), null);
    assert.equal((await db.studyPlan.findUniqueOrThrow({ where: { id: planId } })).version, 2);
    assert.equal(((await db.studyPlan.findUniqueOrThrow({ where: { id: planId } })).payload as {
      completedHours: number }).completedHours, 1);
    await sessionRace.rejected.write();
    assert.equal(await db.studySession.count({ where: { workspaceId } }), 2);
    assert.equal((await db.studyPlan.findUniqueOrThrow({ where: { id: planId } })).version, 3);
    assert.equal(((await db.studyPlan.findUniqueOrThrow({ where: { id: planId } })).payload as {
      completedHours: number }).completedHours, 2);

    const logs: [Attempt, Attempt] = [0, 1].map((index) => ({
      id: `race-log-${index}-${marker}`,
      write: () => service.create(workspaceId, "engineeringLogs", {
        id: `race-log-${index}-${marker}`, projectId, taskId,
        title: `第 ${index + 1} 次调试`, date: "2026-10-04", durationMinutes: 60,
        workContent: "检查电机", resultStatus: "完成", tags: [],
      }),
    })) as [Attempt, Attempt];
    const logRace = await raceAtOneVersion(db, "Task", taskId, logs);
    assert.equal(await db.engineeringLog.count({ where: { workspaceId } }), 1);
    assert.equal(await db.engineeringLog.findUnique({ where: { id: logRace.rejected.id } }), null);
    assert.equal(((await db.task.findUniqueOrThrow({ where: { id: taskId } })).payload as {
      actualHours: number }).actualHours, 1);
    await logRace.rejected.write();
    assert.equal(await db.engineeringLog.count({ where: { workspaceId } }), 2);
    assert.equal((await db.task.findUniqueOrThrow({ where: { id: taskId } })).version, 3);
    assert.equal(((await db.task.findUniqueOrThrow({ where: { id: taskId } })).payload as {
      actualHours: number }).actualHours, 2);

    const evidence: [Attempt, Attempt] = [0, 1].map((index) => ({
      id: `race-evidence-${index}-${marker}`,
      write: () => service.create(workspaceId, "skillEvidence", {
        id: `race-evidence-${index}-${marker}`, skillId, evidenceType: "manual",
        description: `第 ${index + 1} 条证据`, scoreChange: 10,
        occurredAt: "2026-10-04T08:00:00.000Z",
      }),
    })) as [Attempt, Attempt];
    const evidenceRace = await raceAtOneVersion(db, "Skill", skillId, evidence);
    assert.equal(await db.skillEvidence.count({ where: { workspaceId } }), 1);
    assert.equal(await db.skillEvidence.findUnique({ where: { id: evidenceRace.rejected.id } }), null);
    assert.equal(((await db.skill.findUniqueOrThrow({ where: { id: skillId } })).payload as {
      score: number }).score, 30);
    await evidenceRace.rejected.write();
    assert.equal(await db.skillEvidence.count({ where: { workspaceId } }), 2);
    assert.equal((await db.skill.findUniqueOrThrow({ where: { id: skillId } })).version, 3);
    assert.equal(((await db.skill.findUniqueOrThrow({ where: { id: skillId } })).payload as {
      score: number }).score, 40);
  } finally {
    for (const collection of [...MIGRATION_COLLECTIONS].reverse()) {
      await db.$executeRawUnsafe(`DELETE FROM "${MIGRATION_TABLES[collection].table}" WHERE "workspaceId" = $1`,
        workspaceId);
    }
    await db.workspace.delete({ where: { id: workspaceId } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
