import assert from "node:assert/strict";
import test from "node:test";
import { reflectionPeriod, canonicalReflectionDate } from "@/services/reflection-period";
import { createReviewService } from "@/services/review-service";
import { createWorkspaceDataService, parseWorkspaceBackup } from "@/services/workspace-data-service";
import { createWorkspaceRepository, WORKSPACE_STORAGE_KEY } from "@/repositories/workspace-repository";
import type { StorageAdapter } from "@/repositories/storage-adapter";

class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>();
  failWrites = false;
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) {
    if (this.failWrites) return false;
    this.values.set(key, value);
    return true;
  }
  async removeItem(key: string) { this.values.delete(key); }
}

const draft = (type: "DAILY" | "WEEKLY" | "MONTHLY" | "PROJECT", date: string,
  relatedProjectId?: string) => ({ type, date, summary: `${type} 总结`, achievement: "收获",
  problem: "问题", plan: "计划", relatedProjectId });

test("reflection dates use local day, Monday week start, and first day of month", () => {
  assert.deepEqual(reflectionPeriod("DAILY", "2026-01-01"), { start: "2026-01-01", end: "2026-01-01" });
  assert.deepEqual(reflectionPeriod("WEEKLY", "2026-01-01"), { start: "2025-12-29", end: "2026-01-04" });
  assert.deepEqual(reflectionPeriod("MONTHLY", "2024-02-25"), { start: "2024-02-01", end: "2024-02-29" });
  assert.deepEqual(reflectionPeriod("PROJECT", "2026-01-01"), { start: "2026-01-01", end: "2026-01-01" });
  assert.equal(canonicalReflectionDate("WEEKLY", "2026-01-04"), "2025-12-29");
  assert.throws(() => reflectionPeriod("DAILY", "2026-02-30"), /有效的本地日期/);
});

test("four review types survive fresh load, normal backup export and import, edit, and deletion", async () => {
  const sourceStore = new MemoryStorage();
  const sourceRepo = createWorkspaceRepository(sourceStore);
  const source = createReviewService(sourceRepo);
  const projectId = (await sourceRepo.loadDomain()).projects[0].id;
  const daily = await source.create(draft("DAILY", "2026-07-14"));
  const weekly = await source.create(draft("WEEKLY", "2026-07-16", projectId));
  const monthly = await source.create(draft("MONTHLY", "2026-07-20"));
  const project = await source.create(draft("PROJECT", "2026-07-21", projectId));
  assert.equal(weekly.date, "2026-07-13");
  assert.equal(monthly.date, "2026-07-01");
  assert.equal((await source.query({ relatedProjectId: projectId })).length, 2);
  assert.deepEqual((await source.query({ type: "WEEKLY", dateFrom: "2026-07-13", dateTo: "2026-07-13" }))
    .map((item) => item.id), [weekly.id]);
  assert.equal((await source.query({ dateFrom: "2026-07-14", dateTo: "2026-07-20" })).length, 1);
  await source.update(daily.id, { summary: "修改后的每日总结", achievement: "新收获" });
  const reopened = createWorkspaceRepository(sourceStore);
  const reloaded = createReviewService(reopened);
  assert.equal((await reloaded.query({ type: "DAILY" }))[0].summary, "修改后的每日总结");
  assert.equal((await reloaded.query()).length, 4);
  const backup = await createWorkspaceDataService(reopened).createDomainBackup((await reopened.load()).data);
  assert.equal(backup.schemaVersion, 4);
  assert.equal(backup.data.reviews.find((item) => item.id === project.id)?.relatedProjectId, projectId);
  const targetStore = new MemoryStorage();
  const targetRepo = createWorkspaceRepository(targetStore);
  await createWorkspaceDataService(targetRepo).importBackup(parseWorkspaceBackup(JSON.stringify(backup)));
  const imported = createReviewService(createWorkspaceRepository(targetStore));
  assert.deepEqual((await imported.query()).map((item) => item.id).sort(),
    [daily.id, weekly.id, monthly.id, project.id].sort());
  assert.equal((await imported.query({ id: project.id }))[0].relatedProjectId, projectId);
  assert.equal(await imported.delete(project.id), true);
  assert.equal((await createReviewService(createWorkspaceRepository(targetStore)).query({ relatedProjectId: projectId })).length, 1);
});

test("review service rejects invalid projects and preserves form data when storage write fails", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const reviews = createReviewService(repository);
  await repository.loadDomain();
  await assert.rejects(reviews.create(draft("PROJECT", "2026-07-14")), /必须关联/);
  await assert.rejects(reviews.create(draft("DAILY", "2026-07-14", "missing-project")), /关联项目不存在/);
  storage.failWrites = true;
  await assert.rejects(reviews.create(draft("DAILY", "2026-07-14")), /保存失败/);
  assert.equal((await createReviewService(createWorkspaceRepository(storage)).query()).length, 0);
  storage.failWrites = false;
  const saved = await reviews.create(draft("DAILY", "2026-07-14"));
  storage.failWrites = true;
  await assert.rejects(reviews.update(saved.id, { summary: "不会保存" }), /保存失败/);
  assert.equal((await createReviewService(createWorkspaceRepository(storage)).query())[0].summary, "DAILY 总结");
});

test("project and review deletion honor linked reviews and attachments; invalid import is rejected", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const reviews = createReviewService(repository);
  const projectId = (await repository.loadDomain()).projects[0].id;
  const review = await reviews.create(draft("PROJECT", "2026-07-14", projectId));
  const before = await repository.loadDomain();
  await assert.rejects(repository.updateDomain((state) => ({ ...state,
    projects: state.projects.filter((item) => item.id !== projectId) })), /关联记录|关联引用无效/);
  await repository.updateDomain((state) => ({ ...state, attachments: [...state.attachments,
    { id: "reflection-attachment", type: "text/plain", url: "file-ref", relatedType: "REVIEW", relatedId: review.id }] }));
  await assert.rejects(reviews.delete(review.id), /关联附件/);
  const invalid = { app: "CDC AI Workspace", schemaVersion: 4, exportedAt: new Date().toISOString(),
    data: { ...before, reviews: [{ ...review, relatedProjectId: "missing-project" }] } };
  assert.throws(() => parseWorkspaceBackup(JSON.stringify(invalid)), /关联引用无效/);
  assert.equal(JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null").reviews.length, 1);
});
