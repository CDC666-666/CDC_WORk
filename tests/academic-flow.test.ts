import assert from "node:assert/strict";
import test from "node:test";

import { createWorkspaceRepository } from "@/repositories/workspace-repository";
import type { StorageAdapter } from "@/repositories/storage-adapter";
import { selectAssignmentCalendarEvents, selectHomeAssignments } from "@/services/academic-selectors";
import { createAcademicService } from "@/services/academic-service";
import { createWorkspaceDataService, parseWorkspaceBackup } from "@/services/workspace-data-service";

class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>();
  failWrites = false;
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) { if (this.failWrites) return false; this.values.set(key, value); return true; }
  async removeItem(key: string) { this.values.delete(key); }
}

test("semester, course and assignment remain one source through home, calendar, reload and backup", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const academic = createAcademicService(repository);
  const semester = await academic.create("semesters", { year: 2026, term: "AUTUMN", name: "2026 秋季" });
  const course = await academic.create("courses", { semesterId: semester.id, name: "控制理论",
    type: "MAJOR", teacher: "王老师", credits: 3, importance: 5, status: "IN_PROGRESS" });
  const general = await academic.create("courses", { semesterId: semester.id, name: "写作",
    type: "GENERAL", teacher: "李老师", credits: 2, importance: 2, status: "PLANNED" });
  const assignment = await academic.create("assignments", { courseId: course.id, title: "PID 作业",
    description: "实现控制器", deadline: "2026-07-13", status: "TODO", priority: "HIGH" });
  await academic.create("chapters", { courseId: course.id, title: "第一章", content: "反馈控制", learnDate: "2026-07-14" });
  await academic.create("classSessions", { courseId: course.id, date: "2026-07-14", summary: "传递函数", notes: "课堂记录" });
  await academic.create("exams", { courseId: course.id, date: "2026-07-20", type: "QUIZ", reviewStatus: "NOT_STARTED" });

  let state = await repository.loadDomain();
  assert.equal(state.tasks.some((item) => item.id === assignment.id), false);
  assert.equal(state.academic.courses.filter((item) => item.type === "GENERAL")[0].id, general.id);
  assert.deepEqual(selectHomeAssignments(state.academic, "2026-07-14").map((item) => item.sourceKey), [`assignment:${assignment.id}`]);
  assert.equal(selectHomeAssignments(state.academic, "2026-07-14")[0].isOverdue, true);
  assert.equal(selectAssignmentCalendarEvents(state.academic).filter((item) => item.sourceId === assignment.id).length, 1);
  assert.equal(selectAssignmentCalendarEvents(state.academic)[0].id, `derived-assignment-${assignment.id}`);

  await academic.update("assignments", assignment.id, { deadline: "2026-07-14", status: "COMPLETED" });
  state = await createWorkspaceRepository(storage).loadDomain();
  assert.equal(state.academic.assignments[0].courseId, course.id);
  assert.equal(state.academic.assignments[0].status, "COMPLETED");
  assert.equal(selectHomeAssignments(state.academic, "2026-07-14")[0].isOverdue, false);
  assert.equal(selectAssignmentCalendarEvents(state.academic)[0].sourceId, assignment.id);

  const source = createWorkspaceDataService(createWorkspaceRepository(storage));
  const backup = await source.createDomainBackup((await source.load()).data, new Date("2026-07-14T00:00:00Z"));
  const target = createWorkspaceRepository(new MemoryStorage());
  await createWorkspaceDataService(target).importBackup(parseWorkspaceBackup(JSON.stringify(backup)));
  const restored = await target.loadDomain();
  assert.equal(restored.academic.assignments[0].status, "COMPLETED");
  assert.equal(restored.academic.assignments[0].courseId, course.id);
  assert.equal(restored.academic.chapters.length, 1);
  assert.equal(restored.academic.classSessions.length, 1);
  assert.equal(restored.academic.exams.length, 1);
  assert.equal(restored.tasks.some((item) => item.id === assignment.id), false);
});

test("academic CRUD rejects dependent deletion and failed writes preserve assignment status", async () => {
  const storage = new MemoryStorage();
  const repository = createWorkspaceRepository(storage);
  const academic = createAcademicService(repository);
  const semester = await academic.create("semesters", { year: 2026, term: "SPRING", name: "春季" });
  const course = await academic.create("courses", { semesterId: semester.id, name: "数学",
    type: "MAJOR", teacher: "", credits: 3, importance: 4, status: "IN_PROGRESS" });
  const assignment = await academic.create("assignments", { courseId: course.id, title: "习题",
    description: "", deadline: "2026-07-14", status: "TODO", priority: "MEDIUM" });
  await assert.rejects(() => academic.delete("courses", course.id), /关联/);
  storage.failWrites = true;
  await assert.rejects(() => academic.update("assignments", assignment.id, { status: "COMPLETED" }), /保存失败/);
  assert.equal((await createWorkspaceRepository(storage).loadDomain()).academic.assignments[0].status, "TODO");
  storage.failWrites = false;
  await academic.update("assignments", assignment.id, { title: "更新后的习题" });
  assert.equal((await academic.query("assignments"))[0].title, "更新后的习题");
  await academic.delete("assignments", assignment.id);
  assert.equal(selectAssignmentCalendarEvents((await repository.loadDomain()).academic).length, 0);
  assert.equal(await academic.delete("courses", course.id), true);
  assert.equal(await academic.delete("semesters", semester.id), true);
});
