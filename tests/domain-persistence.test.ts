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
import { workspaceReducer } from "@/services/workspace-service";

class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>();
  writes = 0;
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) { this.writes++; this.values.set(key, value); return true; }
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

test("stale v3 saves cannot resurrect domain-deleted tasks or projects, including exports", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const projects = createProjectService(repository);
  const tasks = createTaskService(repository);
  const projectTemplate = (await repository.loadDomain()).projects[0];
  const project = await projects.create({ ...withoutIdentity(projectTemplate), name: "待删除项目" });
  const taskTemplate = (await repository.loadDomain()).tasks[0];
  const task = await tasks.create({ ...withoutIdentity(taskTemplate), title: "待删除任务",
    sourceType: "PERSONAL", relatedId: undefined, moduleId: undefined });
  const staleView = (await repository.load()).data;

  assert.equal(await tasks.delete(task.id), true);
  assert.equal(await projects.delete(project.id), true);
  assert.equal(await repository.save(staleView), true);

  const reopened = createWorkspaceRepository(storage);
  assert.equal((await reopened.loadDomain()).tasks.some((item) => item.id === task.id), false);
  assert.equal((await reopened.loadDomain()).projects.some((item) => item.id === project.id), false);
  const backup = await createWorkspaceDataService(reopened).createDomainBackup((await reopened.load()).data, fixedNow);
  assert.equal(backup.data.tasks.some((item) => item.id === task.id), false);
  assert.equal(backup.data.projects.some((item) => item.id === project.id), false);
});

test("v3 project deletion and domain deletion both reject v4 references without losing records", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const projects = createProjectService(repository);
  const template = (await repository.loadDomain()).projects[0];
  const project = await projects.create({ ...withoutIdentity(template), name: "含复盘的项目" });
  await repository.updateDomain((state) => ({ ...state,
    reviews: [...state.reviews, { id: "review-linked", type: "PROJECT", date: "2026-07-14",
      summary: "复盘", achievement: "完成", problem: "问题", plan: "计划", relatedProjectId: project.id }],
    timeline: [...state.timeline, { id: "timeline-linked", date: "2026-07-14", title: "节点",
      description: "说明", tags: [], relatedProjectId: project.id, visibility: "PRIVATE" }],
    attachments: [...state.attachments, { id: "attachment-linked", url: "https://example.com/a",
      type: "text/plain", relatedType: "PROJECT", relatedId: project.id }],
  }));
  const staleView = (await repository.load()).data;
  const deletingView = workspaceReducer(staleView, { type: "project/deleted", projectId: project.id });
  await assert.rejects(() => repository.save(deletingView), /关联|复盘/);
  await assert.rejects(() => projects.delete(project.id), /关联|复盘/);

  const reopened = createWorkspaceRepository(storage);
  const state = await reopened.loadDomain();
  assert.equal(state.projects.some((item) => item.id === project.id), true);
  assert.equal(state.reviews.some((item) => item.id === "review-linked"), true);
  assert.equal(state.timeline.some((item) => item.id === "timeline-linked"), true);
  assert.equal(state.attachments.some((item) => item.id === "attachment-linked"), true);
  const backup = await createWorkspaceDataService(reopened).createDomainBackup((await reopened.load()).data, fixedNow);
  assert.equal(backup.data.reviews.some((item) => item.id === "review-linked"), true);
});

test("v3 task and project field edits merge with newer domain edits", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const view = (await repository.load()).data;
  const task = view.tasks[0];
  const project = view.projects[0];
  await createTaskService(repository).update(task.id, { title: "领域新标题" });
  await createProjectService(repository).update(project.id, { description: "领域新描述" });
  const edited = { ...view,
    tasks: view.tasks.map((item) => item.id === task.id ? { ...item, status: "已完成" as const } : item),
    projects: view.projects.map((item) => item.id === project.id ? { ...item, progress: 42 } : item),
  };
  assert.equal(await repository.save(edited), true);
  const reopened = createWorkspaceRepository(storage);
  const savedTask = (await reopened.loadDomain()).tasks.find((item) => item.id === task.id);
  const savedProject = (await reopened.loadDomain()).projects.find((item) => item.id === project.id);
  assert.equal(savedTask?.title, "领域新标题");
  assert.equal(savedTask?.status, "已完成");
  assert.equal(savedProject?.description, "领域新描述");
  assert.equal(savedProject?.progress, 42);
  const backup = await createWorkspaceDataService(reopened).createDomainBackup((await reopened.load()).data, fixedNow);
  assert.equal(backup.data.tasks.find((item) => item.id === task.id)?.title, "领域新标题");
  assert.equal(backup.data.projects.find((item) => item.id === project.id)?.description, "领域新描述");
});

test("explicit same-field v3 edits win over concurrent domain edits", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const view = (await repository.load()).data;
  const task = view.tasks[0];
  const project = view.projects[0];
  await createTaskService(repository).update(task.id, { title: "领域任务标题" });
  await createProjectService(repository).update(project.id, { description: "领域项目描述" });
  assert.equal(await repository.save({ ...view,
    tasks: view.tasks.map((item) => item.id === task.id ? { ...item, title: "页面任务标题" } : item),
    projects: view.projects.map((item) => item.id === project.id ? { ...item, description: "页面项目描述" } : item),
  }), true);
  const reopened = createWorkspaceRepository(storage);
  const backup = await createWorkspaceDataService(reopened).createDomainBackup((await reopened.load()).data, fixedNow);
  assert.equal(backup.data.tasks.find((item) => item.id === task.id)?.title, "页面任务标题");
  assert.equal(backup.data.projects.find((item) => item.id === project.id)?.description, "页面项目描述");
});

test("backup import rejects broken v4 references and preserves stored records", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const service = createWorkspaceDataService(repository);
  const view = (await service.load()).data;
  const backup = await service.createDomainBackup(view, fixedNow);
  backup.data.reviews.push({ id: "orphan-review", type: "PROJECT", date: "2026-07-14",
    summary: "必须保留", achievement: "", problem: "", plan: "", relatedProjectId: "missing-project" });
  assert.throws(() => parseWorkspaceBackup(JSON.stringify(backup)), /关联引用无效.*复盘/);
  await assert.rejects(() => repository.replaceDomain(backup.data), /关联引用无效.*复盘/);
  const reopened = createWorkspaceRepository(storage);
  assert.equal((await reopened.loadDomain()).reviews.some((item) => item.id === "orphan-review"), false);
  assert.equal((await reopened.loadDomain()).projects.length, backup.data.projects.length);
});

test("v3 migration reports dangling project references and keeps the old record", async () => {
  const storage = new MemoryStorage();
  const old = createInitialWorkspaceData(fixedNow);
  old.tasks[0] = { ...old.tasks[0], projectId: "missing-project" };
  storage.values.set(LEGACY_WORKSPACE_V3_STORAGE_KEY, JSON.stringify(old));
  const repository = createWorkspaceRepository(storage);
  const loaded = await repository.load();
  assert.match(loaded.message ?? "", /失效关联.*任务/);
  assert.equal((await repository.loadDomain()).tasks[0].relatedId, "missing-project");
  assert.equal(JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null").tasks[0].relatedId, "missing-project");
  await assert.rejects(() => repository.save(loaded.data), /关联引用无效.*任务/);
  const reopened = await createWorkspaceRepository(storage).load();
  assert.match(reopened.message ?? "", /失效关联.*任务/);
  assert.equal(reopened.data.tasks[0].projectId, "missing-project");
});

test("v3 backup import explains a dangling reference before replacing local data", async () => {
  const old = createInitialWorkspaceData(fixedNow);
  old.tasks[0] = { ...old.tasks[0], projectId: "missing-project" };
  assert.throws(() => parseWorkspaceBackup(JSON.stringify({
    app: "CDC AI Workspace", schemaVersion: 3, exportedAt: fixedNow.toISOString(), data: old,
  })), /关联引用无效.*任务.*missing-project/);
});

test("recovery export reads invalid v4 references without writing or dropping records", async () => {
  const storage = new MemoryStorage();
  const state = migrateWorkspaceV3(createInitialWorkspaceData(fixedNow), fixedNow);
  state.reviews.push({ id: "orphan-review", type: "PROJECT", date: "2026-07-14",
    summary: "必须恢复的复盘", achievement: "完成", problem: "失效引用", plan: "修复",
    relatedProjectId: "missing-project" });
  const raw = JSON.stringify(state);
  storage.values.set(WORKSPACE_STORAGE_KEY, raw);
  const service = createWorkspaceDataService(createWorkspaceRepository(storage));
  const view = (await service.load()).data;
  await assert.rejects(() => service.createDomainBackup(view, fixedNow), /关联引用无效/);

  const backup = await service.createRecoveryBackup(fixedNow);
  assert.equal(backup.recovery.kind, "INVALID_REFERENCES");
  assert.match(backup.recovery.issues.join(" "), /orphan-review.*missing-project/);
  assert.equal(backup.data.reviews[0].summary, "必须恢复的复盘");
  assert.equal(storage.values.get(WORKSPACE_STORAGE_KEY), raw);
  assert.equal(storage.writes, 0);
  assert.throws(() => parseWorkspaceBackup(JSON.stringify(backup)), /恢复备份/);
});
