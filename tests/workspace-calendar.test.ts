import assert from "node:assert/strict";
import test from "node:test";

import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { normalizeWorkspaceData } from "@/lib/storage/workspace-normalization";
import { parseWorkspaceBackup } from "@/services/workspace-data-service";
import { selectDerivedCalendarEvents } from "@/services/workspace-selectors";
import { workspaceReducer } from "@/services/workspace-service";
import type { CalendarEvent } from "@/types/calendar";
import type { WorkspaceData } from "@/types/workspace";

const fixedNow = new Date("2026-07-14T08:00:00+08:00");

function createData(): WorkspaceData {
  return createInitialWorkspaceData(fixedNow);
}

function manualEvent(): CalendarEvent {
  return {
    id: "manual-test-event",
    title: "合法手动日程",
    eventType: "个人",
    startAt: "2026-07-20T19:00:00+08:00",
    endAt: "2026-07-20T20:00:00+08:00",
    allDay: false,
    sourceType: "manual",
    colorKey: "blue",
    notes: "测试手动日程",
    createdAt: fixedNow.toISOString(),
    updatedAt: fixedNow.toISOString(),
  };
}

test("删除里程碑后 reducer 中不再存在该里程碑", () => {
  const data = createData();
  const milestoneId = data.projectMilestones[0].id;
  const next = workspaceReducer(data, { type: "milestone/deleted", milestoneId });
  assert.equal(next.projectMilestones.some((item) => item.id === milestoneId), false);
});

test("删除里程碑后对应派生日程消失", () => {
  const data = createData();
  const milestoneId = data.projectMilestones[0].id;
  const next = workspaceReducer(data, { type: "milestone/deleted", milestoneId });
  assert.equal(selectDerivedCalendarEvents(next).some((event) => event.id === `derived-milestone-${milestoneId}`), false);
});

test("删除任务后对应派生日程立即消失", () => {
  const data = createData();
  const taskId = data.tasks[0].id;
  const next = workspaceReducer(data, { type: "task/deleted", taskId });
  assert.equal(selectDerivedCalendarEvents(next).some((event) => event.id === `derived-task-${taskId}`), false);
});

test("删除学习计划后对应派生日程立即消失", () => {
  const data = createData();
  const planId = data.studyPlans[0].id;
  const next = workspaceReducer(data, { type: "study-plan/deleted", planId });
  assert.equal(selectDerivedCalendarEvents(next).some((event) => event.id === `derived-study-${planId}`), false);
});

test("删除阅读条目后对应派生日程立即消失", () => {
  const data = createData();
  const itemId = data.readingItems[0].id;
  const next = workspaceReducer(data, { type: "reading/deleted", itemId });
  assert.equal(selectDerivedCalendarEvents(next).some((event) => event.id === `derived-reading-${itemId}`), false);
});

test("规范化会清除旧的非手动日程副本", () => {
  const data = createData();
  const derived = selectDerivedCalendarEvents(data).find((event) => event.sourceType === "task");
  assert.ok(derived);
  const normalized = normalizeWorkspaceData({ ...data, calendarEvents: [...data.calendarEvents, derived] });
  assert.equal(normalized.calendarEvents.some((event) => event.sourceType === "task"), false);
});

test("规范化不会清除合法手动日程", () => {
  const data = createData();
  const event = manualEvent();
  const normalized = normalizeWorkspaceData({ ...data, calendarEvents: [event] });
  assert.deepEqual(normalized.calendarEvents, [event]);
});

test("同一源实体不会产生重复派生日程", () => {
  const data = createData();
  const task = data.tasks[0];
  const events = selectDerivedCalendarEvents({ ...data, tasks: [...data.tasks, { ...task }] });
  assert.equal(events.filter((event) => event.sourceType === "task" && event.sourceId === task.id).length, 1);
});

test("删除项目后该项目的全部里程碑派生日程消失", () => {
  const data = createData();
  const projectId = data.projects[0].id;
  const milestoneIds = data.projectMilestones.filter((item) => item.projectId === projectId).map((item) => item.id);
  const next = workspaceReducer(data, { type: "project/deleted", projectId });
  const remainingIds = new Set(selectDerivedCalendarEvents(next).map((event) => event.id));
  assert.equal(next.projectMilestones.some((item) => item.projectId === projectId), false);
  assert.equal(milestoneIds.some((id) => remainingIds.has(`derived-milestone-${id}`)), false);
});

test("导入旧派生日程副本时只保留合法手动日程", () => {
  const data = createData();
  const derived = selectDerivedCalendarEvents(data).find((event) => event.sourceType === "milestone");
  assert.ok(derived);
  const manual = manualEvent();
  const backup = parseWorkspaceBackup(JSON.stringify({
    app: "CDC AI Workspace",
    schemaVersion: 3,
    exportedAt: fixedNow.toISOString(),
    data: { ...data, calendarEvents: [manual, derived] },
  }));
  assert.deepEqual(backup.data.calendarEvents, [manual]);
});
