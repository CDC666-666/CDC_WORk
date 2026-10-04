import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { createEmptyWorkspaceData, createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { migrateWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { readRawBrowserSnapshot } from "@/repositories/migration/raw-browser-source";
import { prepareRawMigration } from "@/services/migration/preflight";
import { executeMigration, previewMigration } from "@/services/migration/migration-service";
import { MIGRATION_TABLES } from "@/services/migration/registry";
import { serverWorkspaceEntityService } from "@/services/server/workspace-entity-service";
import { MIGRATION_COLLECTIONS, RAW_STORAGE_KEYS, type RawBrowserSnapshot } from "@/types/migration";
import type { WorkspaceDomainState } from "@/types/workspace";

const now = new Date("2026-07-14T08:00:00+08:00");
const emptyRaw = (): RawBrowserSnapshot => Object.fromEntries(RAW_STORAGE_KEYS.map((key) => [key, null])) as RawBrowserSnapshot;

function fixture(marker: string): RawBrowserSnapshot {
  const state = migrateWorkspaceV3(createEmptyWorkspaceData(), now);
  const example = migrateWorkspaceV3(createInitialWorkspaceData(now), now);
  const project = { ...example.projects[0], id: `project-${marker}`, name: "个人机械臂" };
  state.projects.push(project);
  state.academic.semesters.push({ id: `semester-${marker}`, year: 2026, term: "AUTUMN", name: "秋季" });
  state.academic.courses.push({ id: `course-${marker}`, semesterId: `semester-${marker}`,
    name: "控制理论", type: "MAJOR", teacher: "老师", credits: 3, importance: 4, status: "IN_PROGRESS" });
  state.academic.chapters.push({ id: `chapter-${marker}`, courseId: `course-${marker}`,
    title: "PID", content: "笔记", learnDate: "2026-10-03" });
  state.academic.classSessions.push({ id: `session-${marker}`, courseId: `course-${marker}`,
    date: "2026-10-03", summary: "控制", notes: "课堂笔记" });
  state.academic.assignments.push({ id: `assignment-${marker}`, courseId: `course-${marker}`,
    title: "作业一", description: "建模", deadline: "2026-10-10", status: "COMPLETED", priority: "HIGH" });
  state.academic.exams.push({ id: `exam-${marker}`, courseId: `course-${marker}`,
    date: "2026-11-01", type: "MIDTERM", reviewStatus: "IN_PROGRESS" });
  state.reviews.push({ id: `review-${marker}`, type: "PROJECT", date: "2026-10-03",
    summary: "复盘", achievement: "完成", problem: "误差", plan: "继续",
    relatedProjectId: project.id });
  state.timeline.push({ id: `timeline-${marker}`, date: "2026-10-03", title: "阶段",
    description: "达成", tags: [], relatedProjectId: project.id, visibility: "PRIVATE" });
  state.attachments.push({ id: `attachment-${marker}`, url: "https://example.invalid/file", type: "text/plain",
    relatedType: "REVIEW", relatedId: `review-${marker}` });
  state.legacy.financeTransactions.push({ ...createInitialWorkspaceData(now).financeTransactions[0],
    id: `finance-${marker}`, amount: 123.45, date: "2026-10-03" });
  const raw = emptyRaw();
  raw["cdc-workspace-data-v4"] = JSON.stringify(state);
  raw["cdc-content-state-v1"] = JSON.stringify({ version: 1, items: {
    "content-m3508-pid": { status: "completed", isFavorite: true,
      isInKnowledgeBase: true, isInStudyPlan: false },
  } });
  return raw;
}

test("raw precheck reads all collections and preserves source keys", () => {
  const raw = fixture(randomUUID());
  const before = JSON.stringify(raw);
  const prepared = prepareRawMigration(raw);
  assert.equal(prepared.sourceKind, "v4");
  assert.equal(prepared.fatal, false);
  assert.equal(prepared.entities.length, 12);
  assert.deepEqual(Object.keys(raw), [...RAW_STORAGE_KEYS]);
  assert.equal(JSON.stringify(raw), before);
  assert.equal(MIGRATION_COLLECTIONS.length, 28);
});

test("raw browser reader only calls getItem for the six known keys", () => {
  const seen: string[] = [];
  const storage = { getItem(key: string) { seen.push(key); return key === "cdc-content-state-v1" ? "{}" : null; } };
  const raw = readRawBrowserSnapshot(storage);
  assert.deepEqual(seen, [...RAW_STORAGE_KEYS]);
  assert.equal(raw["cdc-content-state-v1"], "{}");
});

test("amounts beyond a safe integer number of cents are quarantined", () => {
  const raw = fixture(randomUUID());
  const state = JSON.parse(raw["cdc-workspace-data-v4"] ?? "") as WorkspaceDomainState;
  state.legacy.financeTransactions[0].amount = 90071992547409.92;
  raw["cdc-workspace-data-v4"] = JSON.stringify(state);
  const item = prepareRawMigration(raw).entities.find((entity) => entity.collection === "financeTransactions");
  assert.ok(item?.reasons.some((reason) => reason.includes("金额")));
});

test("v4 wins over old snapshots and invalid links or duplicate IDs stay visible", () => {
  const raw = fixture(randomUUID());
  raw["cdc-workspace-data-v3"] = JSON.stringify(createInitialWorkspaceData(now));
  const state = JSON.parse(raw["cdc-workspace-data-v4"] ?? "") as WorkspaceDomainState;
  state.reviews.push({ ...state.reviews[0] });
  state.attachments.push({ id: "broken-link", url: "https://example.invalid/broken", type: "text/plain",
    relatedType: "PROJECT", relatedId: "deleted-project" });
  raw["cdc-workspace-data-v4"] = JSON.stringify(state);
  const prepared = prepareRawMigration(raw);
  assert.equal(prepared.sourceKind, "v4");
  assert.equal(prepared.entities.filter((item) => item.collection === "reviews").length, 2);
  assert.equal(prepared.entities.filter((item) => item.collection === "reviews" &&
    item.reasons.includes("同一集合内 ID 重复")).length, 2);
  assert.equal(prepared.entities.find((item) => item.id === "broken-link")?.reasons.length, 1);
  assert.ok(prepared.issues.some((item) => item.collection === "snapshot" && item.sourceId === "legacy"));
});

test("v3 filtered calendar copies remain pending and v2 does not import synthesized demo modules", () => {
  const old = createInitialWorkspaceData(now);
  old.calendarEvents.push({ ...old.calendarEvents[0], id: "old-derived-event",
    sourceType: "task", sourceId: old.tasks[0].id });
  const v3 = emptyRaw();
  v3["cdc-workspace-data-v3"] = JSON.stringify(old);
  const checkedV3 = prepareRawMigration(v3);
  assert.equal(checkedV3.sourceKind, "v3");
  assert.ok(checkedV3.entities.some((item) => item.id === "old-derived-event" &&
    item.reasons.some((reason) => reason.includes("常规升级中会被过滤"))));
  const v2 = emptyRaw();
  v2["cdc-workspace-data-v2"] = JSON.stringify({ tasks: old.tasks, studyPlans: old.studyPlans,
    studySessions: old.studySessions, readingItems: old.readingItems,
    metadata: { schemaVersion: 2, createdAt: old.metadata.createdAt, updatedAt: old.metadata.updatedAt } });
  const checkedV2 = prepareRawMigration(v2);
  assert.equal(checkedV2.sourceKind, "v2");
  assert.equal(checkedV2.entities.some((item) => item.collection === "projects"), false);
  assert.equal(checkedV2.entities.filter((item) => item.collection === "tasks").length, old.tasks.length);
});

test("PostgreSQL migration is verified, repeatable, preserves relations and decimal precision", { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: `migration-${marker}` } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const raw = fixture(marker);
  try {
    const preview = await previewMigration(workspace.id, raw);
    assert.equal(preview.canExecute, true);
    assert.equal(preview.counts.projects.written, 1);
    assert.equal(preview.counts.financeTransactions.written, 1);
    const result = await executeMigration(workspace.id, raw, [], preview.previewDigest);
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.counts.assignments.written, 1);
    const again = await executeMigration(workspace.id, raw, [], preview.previewDigest);
    assert.equal(again.batchId, result.batchId);
    assert.equal(await db.assignment.count({ where: { workspaceId: workspace.id } }), 1);
    const amount = await db.financeTransaction.findUniqueOrThrow({ where: { id: `finance-${marker}` } });
    assert.equal(amount.amount?.toString(), "123.45");
    const relation = await db.review.findUniqueOrThrow({ where: { id: `review-${marker}` } });
    assert.equal(relation.relatedProjectId, `project-${marker}`);
    const contents = await db.contentState.findUniqueOrThrow({ where: { id: "content-m3508-pid" } });
    assert.equal(contents.status, "completed");
    assert.equal(contents.isInKnowledgeBase, true);
    const changedRaw = { ...raw };
    const changedState = JSON.parse(raw["cdc-workspace-data-v4"] ?? "") as WorkspaceDomainState;
    changedState.academic.assignments[0].title = "作业已在浏览器变更";
    changedRaw["cdc-workspace-data-v4"] = JSON.stringify(changedState);
    const changedPreview = await previewMigration(workspace.id, changedRaw);
    assert.equal(changedPreview.counts.assignments.conflict, 1);
    assert.ok(changedPreview.issues.some((item) => item.sourceId === `assignment-${marker}` && item.code === "SERVER_CONFLICT"));
    await db.assignment.update({ where: { id: `assignment-${marker}` }, data: { status: "TODO" } });
    await assert.rejects(executeMigration(workspace.id, raw, [], preview.previewDigest), /服务器记录发生变化/);
  } finally {
    await db.migrationPending.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationEntityMap.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationBatch.deleteMany({ where: { workspaceId: workspace.id } });
    await db.attachment.deleteMany({ where: { workspaceId: workspace.id } });
    await db.review.deleteMany({ where: { workspaceId: workspace.id } });
    await db.timeline.deleteMany({ where: { workspaceId: workspace.id } });
    await db.contentState.deleteMany({ where: { workspaceId: workspace.id } });
    await db.financeTransaction.deleteMany({ where: { workspaceId: workspace.id } });
    await db.exam.deleteMany({ where: { workspaceId: workspace.id } });
    await db.assignment.deleteMany({ where: { workspaceId: workspace.id } });
    await db.classSession.deleteMany({ where: { workspaceId: workspace.id } });
    await db.chapter.deleteMany({ where: { workspaceId: workspace.id } });
    await db.course.deleteMany({ where: { workspaceId: workspace.id } });
    await db.semester.deleteMany({ where: { workspaceId: workspace.id } });
    await db.project.deleteMany({ where: { workspaceId: workspace.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});

test("invalid relations are quarantined, not discarded; partial batch retries are idempotent", { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: `migration-partial-${marker}` } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const raw = fixture(marker);
  const state = JSON.parse(raw["cdc-workspace-data-v4"] ?? "") as WorkspaceDomainState;
  state.attachments.push({ id: `orphan-${marker}`, url: "https://example.invalid/orphan",
    type: "text/plain", relatedType: "PROJECT", relatedId: `deleted-${marker}` });
  raw["cdc-workspace-data-v4"] = JSON.stringify(state);
  try {
    const preview = await previewMigration(workspace.id, raw);
    assert.equal(preview.counts.attachments.pending, 1);
    const result = await executeMigration(workspace.id, raw, [], preview.previewDigest);
    assert.equal(result.status, "PARTIAL");
    const pending = await db.migrationPending.findFirstOrThrow({ where: { batchId: result.batchId, sourceId: `orphan-${marker}` } });
    assert.equal((pending.payload as { relatedId: string }).relatedId, `deleted-${marker}`);
    assert.equal((await executeMigration(workspace.id, raw, [], preview.previewDigest)).batchId, result.batchId);
    assert.equal(await db.migrationPending.count({ where: { batchId: result.batchId } }), 1);
  } finally {
    await db.migrationPending.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationEntityMap.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationBatch.deleteMany({ where: { workspaceId: workspace.id } });
    await db.attachment.deleteMany({ where: { workspaceId: workspace.id } });
    await db.review.deleteMany({ where: { workspaceId: workspace.id } });
    await db.timeline.deleteMany({ where: { workspaceId: workspace.id } });
    await db.contentState.deleteMany({ where: { workspaceId: workspace.id } });
    await db.financeTransaction.deleteMany({ where: { workspaceId: workspace.id } });
    await db.exam.deleteMany({ where: { workspaceId: workspace.id } });
    await db.assignment.deleteMany({ where: { workspaceId: workspace.id } });
    await db.classSession.deleteMany({ where: { workspaceId: workspace.id } });
    await db.chapter.deleteMany({ where: { workspaceId: workspace.id } });
    await db.course.deleteMany({ where: { workspaceId: workspace.id } });
    await db.semester.deleteMany({ where: { workspaceId: workspace.id } });
    await db.project.deleteMany({ where: { workspaceId: workspace.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});

test("a transient database failure rolls back writes and the same batch can retry", { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: `migration-retry-${marker}` } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const raw = fixture(marker);
  const trigger = `migration_retry_${marker.replaceAll("-", "_")}`;
  try {
    const preview = await previewMigration(workspace.id, raw);
    await db.$executeRawUnsafe(`CREATE FUNCTION "${trigger}"() RETURNS trigger AS $$ BEGIN
      IF NEW.id = 'finance-${marker}' THEN RAISE EXCEPTION 'temporary migration test failure'; END IF;
      RETURN NEW; END; $$ LANGUAGE plpgsql`);
    await db.$executeRawUnsafe(`CREATE TRIGGER "${trigger}" BEFORE INSERT ON "FinanceTransaction"
      FOR EACH ROW EXECUTE FUNCTION "${trigger}"()`);
    await assert.rejects(executeMigration(workspace.id, raw, [], preview.previewDigest), /temporary migration test failure/);
    assert.equal(await db.project.count({ where: { workspaceId: workspace.id } }), 0);
    assert.equal(await db.migrationEntityMap.count({ where: { workspaceId: workspace.id } }), 0);
    assert.equal((await db.migrationBatch.findFirstOrThrow({ where: { workspaceId: workspace.id } })).status, "FAILED");
    await db.$executeRawUnsafe(`DROP TRIGGER "${trigger}" ON "FinanceTransaction"`);
    const result = await executeMigration(workspace.id, raw, [], preview.previewDigest);
    assert.equal(result.status, "COMPLETED");
    assert.equal(await db.financeTransaction.count({ where: { workspaceId: workspace.id } }), 1);
  } finally {
    await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${trigger}" ON "FinanceTransaction"`);
    await db.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${trigger}"()`);
    await db.migrationPending.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationEntityMap.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationBatch.deleteMany({ where: { workspaceId: workspace.id } });
    await db.attachment.deleteMany({ where: { workspaceId: workspace.id } });
    await db.review.deleteMany({ where: { workspaceId: workspace.id } });
    await db.timeline.deleteMany({ where: { workspaceId: workspace.id } });
    await db.contentState.deleteMany({ where: { workspaceId: workspace.id } });
    await db.financeTransaction.deleteMany({ where: { workspaceId: workspace.id } });
    await db.exam.deleteMany({ where: { workspaceId: workspace.id } });
    await db.assignment.deleteMany({ where: { workspaceId: workspace.id } });
    await db.classSession.deleteMany({ where: { workspaceId: workspace.id } });
    await db.chapter.deleteMany({ where: { workspaceId: workspace.id } });
    await db.course.deleteMany({ where: { workspaceId: workspace.id } });
    await db.semester.deleteMany({ where: { workspaceId: workspace.id } });
    await db.project.deleteMany({ where: { workspaceId: workspace.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});

test("every one of the 28 persisted collections can migrate and reconcile in one batch", { skip: !process.env.DATABASE_URL }, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: `migration-all-${marker}` } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const raw = fixture(marker);
  const generated = JSON.parse(raw["cdc-workspace-data-v4"] ?? "") as WorkspaceDomainState;
  const state = migrateWorkspaceV3(createInitialWorkspaceData(now), now);
  state.academic = generated.academic;
  state.reviews = generated.reviews.map((item) => ({ ...item, relatedProjectId: state.projects[0].id }));
  state.timeline = generated.timeline.map((item) => ({ ...item, relatedProjectId: state.projects[0].id }));
  state.attachments = generated.attachments;
  raw["cdc-workspace-data-v4"] = JSON.stringify(state);
  const prepared = prepareRawMigration(raw);
  const includeIds = prepared.entities.filter((item) => item.origin !== "PERSONAL" && !item.reasons.length)
    .map((item) => `${item.collection}:${item.id}`);
  try {
    assert.deepEqual([...new Set(prepared.entities.map((item) => item.collection))].sort(),
      [...MIGRATION_COLLECTIONS].sort());
    assert.equal(prepared.issues.length, 0);
    const preview = await previewMigration(workspace.id, raw, includeIds);
    const result = await executeMigration(workspace.id, raw, includeIds, preview.previewDigest);
    assert.equal(result.status, "COMPLETED");
    for (const collection of MIGRATION_COLLECTIONS) {
      assert.ok(result.counts[collection].source > 0, collection);
      assert.equal(result.counts[collection].written, result.counts[collection].source, collection);
      assert.equal(result.counts[collection].conflict, 0, collection);
      assert.equal(result.counts[collection].pending, 0, collection);
    }
    const aggregate = await serverWorkspaceEntityService.snapshot(workspace.id);
    const loaded: Record<string, unknown> = { ...aggregate.domain, ...aggregate.domain.academic,
      ...aggregate.domain.legacy };
    for (const collection of MIGRATION_COLLECTIONS) {
      const count = collection === "contentStates" ? Object.keys(aggregate.contentStates).length :
        Array.isArray(loaded[collection]) ? (loaded[collection] as unknown[]).length : -1;
      assert.equal(count, result.counts[collection].source, `${collection} aggregate read`);
    }
    const financeId = state.legacy.financeTransactions[0].id;
    await serverWorkspaceEntityService.update(workspace.id, "financeTransactions", financeId,
      aggregate.versions[`financeTransactions:${financeId}`], { amount: 99.99 });
    const editedFinance = await db.financeTransaction.findUniqueOrThrow({ where: { id: financeId } });
    assert.equal(editedFinance.amount?.toString(), "99.99");
    assert.equal((editedFinance.payload as { amount: number }).amount, 99.99);
    assert.equal(editedFinance.version, 2);
    const replay = await previewMigration(workspace.id, raw, includeIds);
    assert.ok(replay.counts.financeTransactions.conflict > 0);
  } finally {
    await db.migrationPending.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationEntityMap.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationBatch.deleteMany({ where: { workspaceId: workspace.id } });
    for (const collection of [...MIGRATION_COLLECTIONS].reverse()) {
      await db.$executeRawUnsafe(`DELETE FROM "${MIGRATION_TABLES[collection].table}" WHERE "workspaceId" = $1`, workspace.id);
    }
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});

test("personal records keep demo links pending until the exact multi-level dependencies are selected", {
  skip: !process.env.DATABASE_URL,
}, async () => {
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: `migration-dependency-${marker}` } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const state = migrateWorkspaceV3(createInitialWorkspaceData(now), now);
  const projectId = state.projects[0].id;
  const taskTemplate = state.tasks.find((item) => item.id === "task-motor");
  assert.ok(taskTemplate?.moduleId);
  const moduleId = taskTemplate.moduleId;
  state.reviews.push({ id: `personal-review-${marker}`, type: "PROJECT", date: "2026-10-04",
    summary: "个人项目复盘", achievement: "调试完成", problem: "", plan: "继续",
    relatedProjectId: projectId });
  state.tasks.push({ ...taskTemplate, id: `personal-task-${marker}`, title: "个人调试任务" });
  state.academic.semesters.push({ id: `personal-semester-${marker}`, year: 2026,
    term: "AUTUMN", name: "个人学期" });
  state.academic.courses.push({ id: `personal-course-${marker}`, semesterId: `personal-semester-${marker}`,
    name: "控制课程", type: "MAJOR", teacher: "老师", credits: 3, importance: 4, status: "IN_PROGRESS" });
  state.academic.assignments.push({ id: `personal-assignment-${marker}`,
    courseId: `personal-course-${marker}`, title: "个人作业",
    description: "完成建模", deadline: "2026-10-10", status: "TODO", priority: "HIGH" });
  const raw = emptyRaw();
  raw["cdc-workspace-data-v4"] = JSON.stringify(state);
  const projectKey = `projects:${projectId}`;
  const moduleKey = `projectModules:${moduleId}`;
  try {
    const first = await previewMigration(workspace.id, raw);
    assert.equal(first.counts.reviews.pending, 1);
    assert.equal(first.counts.tasks.pending > 0, true);
    assert.equal(first.counts.assignments.written, 1);
    assert.equal(first.dependencies.some((item) => item.dependentKey === `reviews:personal-review-${marker}` &&
      item.requiredKey === projectKey && !item.satisfied), true);
    assert.equal(first.dependencies.some((item) => item.dependentKey === `tasks:personal-task-${marker}` &&
      item.requiredKey === moduleKey && !item.satisfied), true);
    assert.equal(first.dependencies.some((item) => item.dependentKey === moduleKey &&
      item.requiredKey === projectKey && !item.satisfied), true);
    const partial = await executeMigration(workspace.id, raw, [], first.previewDigest);
    assert.equal(partial.status, "PARTIAL");
    assert.equal(await db.review.count({ where: { id: `personal-review-${marker}` } }), 0);
    assert.equal(await db.assignment.count({ where: { id: `personal-assignment-${marker}` } }), 1);
    assert.equal((await db.migrationPending.findFirstOrThrow({ where: {
      batchId: partial.batchId, sourceId: `personal-review-${marker}`,
    } })).payload !== null, true);

    const onlyModule = await previewMigration(workspace.id, raw, [moduleKey]);
    assert.equal(onlyModule.counts.projectModules.pending > 0, true);
    const selected = [moduleKey, projectKey].sort();
    const resolved = await previewMigration(workspace.id, raw, selected);
    assert.equal(resolved.counts.reviews.written, 1);
    assert.equal(resolved.counts.tasks.written, 1);
    assert.equal(resolved.counts.projects.written, 1);
    assert.equal(resolved.counts.projectModules.written, 1);
    const completed = await executeMigration(workspace.id, raw, selected, resolved.previewDigest);
    // Other pre-existing modified demo records remain pending by design.
    assert.equal(completed.status, "PARTIAL");
    assert.equal(completed.counts.reviews.pending, 0);
    assert.equal(completed.counts.reviews.written, 1);
    assert.equal(completed.counts.projectModules.written, 1);
    assert.equal((await executeMigration(workspace.id, raw, selected, resolved.previewDigest)).batchId, completed.batchId);
    assert.equal(await db.review.count({ where: { id: `personal-review-${marker}` } }), 1);
    assert.equal(await db.project.count({ where: { id: projectId } }), 1);
    assert.equal(await db.assignment.count({ where: { id: `personal-assignment-${marker}` } }), 1);
  } finally {
    await db.migrationPending.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationEntityMap.deleteMany({ where: { workspaceId: workspace.id } });
    await db.migrationBatch.deleteMany({ where: { workspaceId: workspace.id } });
    for (const collection of [...MIGRATION_COLLECTIONS].reverse()) {
      await db.$executeRawUnsafe(`DELETE FROM "${MIGRATION_TABLES[collection].table}" WHERE "workspaceId" = $1`, workspace.id);
    }
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
