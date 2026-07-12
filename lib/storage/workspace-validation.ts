import type { StudyPlan, StudySession } from "@/types/learning";
import type { ReadingItem } from "@/types/reading";
import type { Task } from "@/types/task";
import {
  WORKSPACE_SCHEMA_VERSION,
  type WorkspaceBackup,
  type WorkspaceData,
} from "@/types/workspace";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isOneOf<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return isString(value) && choices.includes(value as T);
}

function hasOptionalString(record: UnknownRecord, key: string): boolean {
  return record[key] === undefined || isString(record[key]);
}

export function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.description) &&
    isOneOf(value.status, ["待开始", "进行中", "已完成", "受阻"] as const) &&
    isOneOf(value.priority, ["高", "中", "低"] as const) &&
    isOneOf(value.domain, ["学校学习", "阅读成长", "项目研发", "内容学习", "个人管理"] as const) &&
    isString(value.scheduledDate) &&
    isString(value.dueAt) &&
    isFiniteNumber(value.estimateHours) &&
    isFiniteNumber(value.actualHours) &&
    isStringArray(value.tags) &&
    isOneOf(value.sourceType, ["manual", "content", "reading", "project"] as const) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    hasOptionalString(value, "projectId") &&
    hasOptionalString(value, "moduleId") &&
    hasOptionalString(value, "sourceId") &&
    hasOptionalString(value, "completedAt")
  );
}

export function isStudyPlan(value: unknown): value is StudyPlan {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.title) &&
    isOneOf(value.category, ["课程", "技术", "考试", "项目", "阶段目标"] as const) &&
    isString(value.description) &&
    isFiniteNumber(value.targetHours) &&
    isFiniteNumber(value.completedHours) &&
    isFiniteNumber(value.progress) &&
    isString(value.deadline) &&
    isString(value.nextAction) &&
    isOneOf(value.status, ["未开始", "进行中", "已完成", "已暂停"] as const) &&
    isStringArray(value.tags) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

export function isStudySession(value: unknown): value is StudySession {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.studyPlanId) &&
    isString(value.date) &&
    isFiniteNumber(value.durationMinutes) &&
    isString(value.content) &&
    isString(value.result) &&
    isString(value.notes) &&
    isString(value.createdAt)
  );
}

export function isReadingItem(value: unknown): value is ReadingItem {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.author) &&
    isOneOf(value.category, ["专业技术", "课程教材", "产品管理", "创业商业", "文学通识", "其他"] as const) &&
    isFiniteNumber(value.totalPages) &&
    isFiniteNumber(value.currentPage) &&
    isFiniteNumber(value.dailyPageTarget) &&
    isString(value.startDate) &&
    isString(value.targetDate) &&
    isOneOf(value.status, ["待读", "阅读中", "已完成", "已暂停"] as const) &&
    isFiniteNumber(value.rating) &&
    isString(value.notes) &&
    isStringArray(value.tags) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    hasOptionalString(value, "completedAt")
  );
}

export function isWorkspaceData(value: unknown): value is WorkspaceData {
  if (!isRecord(value) || !isRecord(value.metadata)) return false;
  return (
    Array.isArray(value.tasks) && value.tasks.every(isTask) &&
    Array.isArray(value.studyPlans) && value.studyPlans.every(isStudyPlan) &&
    Array.isArray(value.studySessions) && value.studySessions.every(isStudySession) &&
    Array.isArray(value.readingItems) && value.readingItems.every(isReadingItem) &&
    value.metadata.schemaVersion === WORKSPACE_SCHEMA_VERSION &&
    isString(value.metadata.createdAt) &&
    isString(value.metadata.updatedAt)
  );
}

export function isWorkspaceBackup(value: unknown): value is WorkspaceBackup {
  return (
    isRecord(value) &&
    value.app === "CDC AI Workspace" &&
    value.schemaVersion === WORKSPACE_SCHEMA_VERSION &&
    isString(value.exportedAt) &&
    isWorkspaceData(value.data)
  );
}

export function isLegacyCompletedTaskIds(value: unknown): value is string[] {
  return isStringArray(value);
}

