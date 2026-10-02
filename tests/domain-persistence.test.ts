import assert from "node:assert/strict";
import test from "node:test";

import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { isWorkspaceDomainState } from "@/lib/storage/domain-validation";
import { migrateWorkspaceV3, projectDomainToWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { createWorkspaceRepository, LEGACY_WORKSPACE_V3_STORAGE_KEY,
  WORKSPACE_RECOVERY_KEY, WORKSPACE_STORAGE_KEY } from "@/repositories/workspace-repository";
import type { StorageAdapter } from "@/repositories/storage-adapter";
import { createAcademicService } from "@/services/academic-service";
import { createProjectService } from "@/services/project-service";
import { createReviewService } from "@/services/review-service";
import { createTaskService } from "@/services/task-service";
import { createWorkspaceDataService, parseWorkspaceBackup } from "@/services/workspace-data-service";

class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>();
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) { this.values.set(key, value); return true; }
  async removeItem(key: string) { this.values.delete(key); }
}

const fixedNow = new Date("2026-07-14T08:00:00+08:00");

function withoutIdentity<T extends { id: string; createdAt: string; updatedAt: string }>(
  value: T,
): Omit<T, "id" | "createdAt" | "updatedAt"> {
  const draft: Partial<T> = { ...value };
  delete draft.id;
  delete draft.createdAt;
  delete draft.updatedAt;
  return draft as Omit<T, "id" | "createdAt" | "updatedAt">;
}

test("v3 to v4 conversion keeps every existing collection and old task provenance", () => {
  const old = createInitialWorkspaceData(fixedNow);
  const domain = migrateWorkspaceV3(old, fixedNow);
  assert.equal(domain.metadata.schemaVersion, 4);
  assert.equal(isWorkspaceDomainState(domain), true);
  assert.deepEqual(projectDomainToWorkspaceV3(domain), old);
  assert.equal(domain.projects.every((item) => item.visibility === "PRIVATE"), true);
  const projectTask = domain.tasks.find((item) => item.id === "task-motor");
  assert.equal(projectTask?.sourceType, "PROJECT");
  assert.equal(projectTask?.relatedId, old.tasks.find((item) => item.id === "task-motor")?.projectId);
  assert.equal(projectTask?.creationSourceType, "project");
  assert.equal("projectId" in (projectTask ?? {}), false);
});

test("v4 domain records survive old UI saves and a fresh repository load", async () => {
  const storage = new MemoryStorage();
  storage.values.set(LEGACY_WORKSPACE_V3_STORAGE_KEY, JSON.stringify(createInitialWorkspaceData(fixedNow)));
  const repository = createWorkspaceRepository(storage);
  const legacyView = (await repository.load()).data;
  const academic = createAcademicService(repository);
  const tasks = createTaskService(repository);
  const reviews = createReviewService(repository);
  const projects = createProjectService(repository);

  const projectTemplate = (await repository.loadDomain()).projects[0];
  const newProject = await projects.create({ ...withoutIdentity(projectTemplate), name: "v4 新项目" });

  const semester = await academic.create("semesters", { year: 2026, term: "AUTUMN", name: "2026 秋季" });
  const course = await academic.create("courses", { semesterId: semester.id, name: "控制理论",
    type: "MAJOR", teacher: "教师", credits: 3, importance: 4, status: "IN_PROGRESS" });
  const base = (await repository.loadDomain()).tasks[0];
  const courseTask = await tasks.create({ ...withoutIdentity(base), title: "课程任务", sourceType: "COURSE", relatedId: course.id });
  const review = await reviews.create({ type: "DAILY", date: "2026-07-14", summary: "总结",
    achievement: "完成", problem: "阻碍", plan: "下一步" });

  legacyView.tasks[0] = { ...legacyView.tasks[0], title: "旧页面编辑后的标题" };
  assert.equal(await repository.save(legacyView), true);
  const reopened = createWorkspaceRepository(storage);
  const state = await reopened.loadDomain();
  assert.equal(state.tasks.find((item) => item.id === courseTask.id)?.relatedId, course.id);
  assert.equal(state.tasks.find((item) => item.id === courseTask.id)?.sourceType, "COURSE");
  assert.equal(state.tasks[0].title, "旧页面编辑后的标题");
  assert.equal(state.reviews[0].id, review.id);
  assert.equal(state.academic.semesters[0].id, semester.id);
  assert.equal(state.academic.courses[0].semesterId, semester.id);
  assert.equal(state.projects.some((item) => item.id === newProject.id), true);
  assert.equal(JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null").metadata.schemaVersion, 4);
  assert.equal(storage.values.has(LEGACY_WORKSPACE_V3_STORAGE_KEY), true);
  const freshView = (await reopened.load()).data;
  assert.equal(await reopened.save(freshView), true);
  assert.equal((await reopened.loadDomain()).tasks.find((item) => item.id === courseTask.id)?.sourceType, "COURSE");
});

test("v4 backup exports and imports domain-only records", async () => {
  const source = createWorkspaceDataService(createWorkspaceRepository(new MemoryStorage()));
  const view = (await source.load()).data;
  const backup = await source.createDomainBackup(view, fixedNow);
  backup.data.reviews.push({ id: "review-test", type: "WEEKLY", date: "2026-07-14",
    summary: "本周", achievement: "完成", problem: "无", plan: "继续" });
  const parsed = parseWorkspaceBackup(JSON.stringify(backup));
  const target = createWorkspaceDataService(createWorkspaceRepository(new MemoryStorage()));
  await target.importBackup(parsed);
  const exported = await target.createDomainBackup((await target.load()).data, fixedNow);
  assert.equal(exported.data.reviews[0].id, "review-test");
  assert.equal(parsed.data.metadata.schemaVersion, 3);
});

test("invalid v4 JSON is retained before a valid v3 fallback migrates", async () => {
  const storage = new MemoryStorage();
  storage.values.set(WORKSPACE_STORAGE_KEY, "{broken");
  storage.values.set(LEGACY_WORKSPACE_V3_STORAGE_KEY, JSON.stringify(createInitialWorkspaceData(fixedNow)));
  const result = await createWorkspaceRepository(storage).load();
  assert.equal(result.recoveryKind, "migration");
  assert.equal(storage.values.get(WORKSPACE_RECOVERY_KEY), "{broken");
  assert.equal(JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null").metadata.schemaVersion, 4);
});

test("domain services support CRUD and protect academic/project relations", async () => {
  const repository = createWorkspaceRepository(new MemoryStorage());
  const projects = createProjectService(repository);
  const tasks = createTaskService(repository);
  const academic = createAcademicService(repository);
  const reviews = createReviewService(repository);
  const template = (await repository.loadDomain()).projects[0];
  const project = await projects.create({ ...withoutIdentity(template), name: "独立项目" });
  assert.equal((await projects.query({ id: project.id })).length, 1);
  await projects.update(project.id, { description: "更新" });
  assert.equal((await projects.query({ id: project.id }))[0].description, "更新");

  const taskTemplate = (await repository.loadDomain()).tasks[0];
  const task = await tasks.create({ ...withoutIdentity(taskTemplate), sourceType: "PROJECT", relatedId: project.id });
  await assert.rejects(() => projects.delete(project.id));
  assert.equal((await tasks.query({ sourceType: "PROJECT", relatedId: project.id })).some((item) => item.id === task.id), true);
  await tasks.update(task.id, { title: "更新任务" });
  assert.equal((await tasks.query({ id: task.id }))[0].title, "更新任务");
  assert.equal(await tasks.delete(task.id), true);
  assert.equal(await projects.delete(project.id), true);

  const semester = await academic.create("semesters", { year: 2026, term: "SPRING", name: "春季" });
  const course = await academic.create("courses", { semesterId: semester.id, name: "数学",
    type: "GENERAL", teacher: "教师", credits: 2, importance: 3, status: "PLANNED" });
  await assert.rejects(() => academic.delete("semesters", semester.id));
  await academic.update("courses", course.id, { name: "高等数学" });
  assert.equal((await academic.query("courses"))[0].name, "高等数学");
  assert.equal(await academic.delete("courses", course.id), true);
  assert.equal(await academic.delete("semesters", semester.id), true);

  const review = await reviews.create({ type: "MONTHLY", date: "2026-07-01", summary: "初稿",
    achievement: "完成", problem: "无", plan: "继续" });
  await reviews.update(review.id, { summary: "定稿" });
  assert.equal((await reviews.query({ type: "MONTHLY" }))[0].summary, "定稿");
  assert.equal(await reviews.delete(review.id), true);
});
