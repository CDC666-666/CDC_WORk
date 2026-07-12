import type { CalendarEvent } from "@/types/calendar";
import type { WorkLog } from "@/types/engineering-log";
import type { FinanceTransaction } from "@/types/finance";
import type { KnowledgeItem } from "@/types/knowledge";
import type { StudyPlan, StudySession } from "@/types/learning";
import type { Project, ProjectMilestone, ProjectModule } from "@/types/project";
import type { ReadingItem } from "@/types/reading";
import type { ReportRecord } from "@/types/report";
import type { ResumeMaterial } from "@/types/resume";
import type { Skill, SkillEvidence } from "@/types/skill";
import type { Task } from "@/types/task";
import type { IssueSolution, TechnicalIssue, TestRecord } from "@/types/testing";
import {
  LEGACY_WORKSPACE_SCHEMA_VERSION,
  WORKSPACE_SCHEMA_VERSION,
  type WorkspaceBackup,
  type WorkspaceBackupV2,
  type WorkspaceData,
  type WorkspaceDataV2,
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

function isParameterRecord(value: unknown): value is Record<string, string | number | boolean> {
  return isRecord(value) && Object.values(value).every((item) =>
    isString(item) || isFiniteNumber(item) || typeof item === "boolean",
  );
}

function hasEntityBase(value: UnknownRecord): boolean {
  return isString(value.id) && isString(value.createdAt) && isString(value.updatedAt);
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

export function isProject(value: unknown): value is Project {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isString(value.name) && isString(value.code) &&
    isOneOf(value.category, ["比赛", "课程", "科研", "个人", "创业"] as const) &&
    isString(value.role) && isString(value.description) &&
    isOneOf(value.status, ["规划中", "进行中", "已暂停", "已完成", "已归档"] as const) &&
    isFiniteNumber(value.progress) && isString(value.startDate) && isString(value.endDate) &&
    isStringArray(value.objectives) && isStringArray(value.responsibilities) && isStringArray(value.techStack) &&
    isString(value.repositoryUrl) && isOneOf(value.coverStyle, ["blue", "green", "amber", "violet", "slate"] as const);
}

export function isProjectModule(value: unknown): value is ProjectModule {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isString(value.projectId) && hasOptionalString(value, "parentId") &&
    isString(value.name) && isString(value.description) && isString(value.owner) &&
    isOneOf(value.status, ["规划中", "开发中", "验证中", "稳定", "已暂停"] as const) &&
    isOneOf(value.priority, ["高", "中", "低"] as const) && isFiniteNumber(value.progress) &&
    isString(value.currentTarget) && isFiniteNumber(value.sortOrder);
}

export function isProjectMilestone(value: unknown): value is ProjectMilestone {
  if (!isRecord(value)) return false;
  return isString(value.id) && isString(value.projectId) && isString(value.title) &&
    isString(value.description) && isString(value.targetDate) && hasOptionalString(value, "completedDate") &&
    isOneOf(value.status, ["未开始", "进行中", "已完成", "延期"] as const) && isFiniteNumber(value.progress);
}

export function isWorkLog(value: unknown): value is WorkLog {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isString(value.projectId) && hasOptionalString(value, "moduleId") &&
    hasOptionalString(value, "taskId") && isString(value.date) && isString(value.title) &&
    isString(value.workContent) && isString(value.result) && isString(value.problems) && isString(value.nextPlan) &&
    isFiniteNumber(value.durationMinutes) && isOneOf(value.resultStatus, ["完成", "部分完成", "受阻"] as const) &&
    isStringArray(value.tags) && isStringArray(value.attachments);
}

export function isTestRecord(value: unknown): value is TestRecord {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isString(value.projectId) && hasOptionalString(value, "moduleId") &&
    hasOptionalString(value, "taskId") && hasOptionalString(value, "workLogId") && isString(value.title) &&
    isString(value.testDate) && isString(value.environment) && isString(value.objective) && isString(value.procedure) &&
    isParameterRecord(value.inputParameters) && isParameterRecord(value.measurements) &&
    isString(value.expectedResult) && isString(value.actualResult) && isString(value.conclusion) &&
    isOneOf(value.resultStatus, ["通过", "部分通过", "失败", "待复测"] as const) && isStringArray(value.attachmentNames);
}

export function isTechnicalIssue(value: unknown): value is TechnicalIssue {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isString(value.projectId) && hasOptionalString(value, "moduleId") &&
    hasOptionalString(value, "taskId") && hasOptionalString(value, "testRecordId") && isString(value.title) &&
    isString(value.phenomenon) && isString(value.errorMessage) && isOneOf(value.severity, ["S1", "S2", "S3"] as const) &&
    isOneOf(value.status, ["待定位", "调查中", "修复中", "待验证", "已解决", "不处理"] as const) &&
    isString(value.reproductionSteps) && isString(value.probableCause) && isString(value.rootCause) &&
    isString(value.discoveredAt) && hasOptionalString(value, "resolvedAt");
}

export function isIssueSolution(value: unknown): value is IssueSolution {
  if (!isRecord(value)) return false;
  return isString(value.id) && isString(value.issueId) && isString(value.title) && isString(value.content) &&
    isString(value.result) && typeof value.isEffective === "boolean" && isParameterRecord(value.parametersBefore) &&
    isParameterRecord(value.parametersAfter) && isString(value.createdAt);
}

export function isKnowledgeItem(value: unknown): value is KnowledgeItem {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isString(value.title) && isString(value.content) && isString(value.summary) &&
    isOneOf(value.itemType, ["笔记", "视频总结", "文章", "项目经验", "故障方案", "测试结论", "读书笔记", "代码说明"] as const) &&
    isString(value.category) && isOneOf(value.sourceType, ["manual", "content", "workLog", "issue", "test", "reading", "project"] as const) &&
    hasOptionalString(value, "sourceId") && hasOptionalString(value, "projectId") && hasOptionalString(value, "moduleId") &&
    isString(value.sourceUrl) && isStringArray(value.tags) && isOneOf(value.status, ["收件箱", "已整理", "已归档"] as const) &&
    isFiniteNumber(value.importance) && value.importance >= 1 && value.importance <= 5;
}

export function isSkill(value: unknown): value is Skill {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && hasOptionalString(value, "parentId") && isString(value.name) &&
    isOneOf(value.category, ["嵌入式", "控制", "算法", "软件", "工具链", "项目管理", "产品", "其他"] as const) &&
    isString(value.description) && isFiniteNumber(value.level) && isFiniteNumber(value.score) &&
    isFiniteNumber(value.targetScore) && isOneOf(value.status, ["学习中", "实践中", "熟练", "暂停"] as const);
}

export function isSkillEvidence(value: unknown): value is SkillEvidence {
  if (!isRecord(value)) return false;
  return isString(value.id) && isString(value.skillId) &&
    isOneOf(value.evidenceType, ["task", "study", "workLog", "test", "issue", "knowledge", "project", "achievement", "manual"] as const) &&
    hasOptionalString(value, "sourceId") && hasOptionalString(value, "projectId") && isString(value.description) &&
    isFiniteNumber(value.scoreChange) && isString(value.occurredAt) && isString(value.createdAt);
}

export function isReportRecord(value: unknown): value is ReportRecord {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isString(value.title) &&
    isOneOf(value.reportType, ["日报", "周报", "月报", "项目阶段报告", "测试报告", "问题复盘报告", "学习总结"] as const) &&
    hasOptionalString(value, "projectId") && isString(value.dateFrom) && isString(value.dateTo) &&
    isString(value.content) && isStringArray(value.sourceRefs) && isOneOf(value.status, ["草稿", "已确认", "已归档"] as const);
}

export function isResumeMaterial(value: unknown): value is ResumeMaterial {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && hasOptionalString(value, "projectId") &&
    isOneOf(value.materialType, ["项目职责", "技术挑战", "解决方案", "项目成果", "团队协作", "领导经历", "技能证明"] as const) &&
    isString(value.title) && isString(value.originalContent) && isString(value.polishedContentCn) && isString(value.polishedContentEn) &&
    isOneOf(value.targetRole, ["嵌入式", "电控", "产品经理", "项目管理", "机器人", "通用"] as const) &&
    isRecord(value.metrics) && Object.values(value.metrics).every((item) => isString(item) || isFiniteNumber(item)) &&
    isStringArray(value.tags) && isOneOf(value.status, ["待整理", "可使用", "已使用", "已归档"] as const);
}

export function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isString(value.title) &&
    isOneOf(value.eventType, ["课程", "任务", "学习", "阅读", "项目", "比赛", "个人"] as const) &&
    isString(value.startAt) && isString(value.endAt) && typeof value.allDay === "boolean" &&
    isOneOf(value.sourceType, ["manual", "task", "studyPlan", "reading", "milestone"] as const) &&
    hasOptionalString(value, "sourceId") && isOneOf(value.colorKey, ["blue", "green", "amber", "rose", "violet", "slate"] as const) &&
    isString(value.notes);
}

export function isFinanceTransaction(value: unknown): value is FinanceTransaction {
  if (!isRecord(value)) return false;
  return hasEntityBase(value) && isOneOf(value.type, ["收入", "支出"] as const) &&
    isOneOf(value.category, ["生活", "学习", "交通", "设备", "RoboMaster", "项目", "娱乐", "奖学金", "兼职", "其他"] as const) &&
    isFiniteNumber(value.amount) && value.amount > 0 && isString(value.date) && isString(value.account) &&
    isString(value.description) && isStringArray(value.tags);
}

export function isWorkspaceData(value: unknown): value is WorkspaceData {
  if (!isRecord(value) || !isRecord(value.metadata)) return false;
  return (
    Array.isArray(value.tasks) && value.tasks.every(isTask) &&
    Array.isArray(value.studyPlans) && value.studyPlans.every(isStudyPlan) &&
    Array.isArray(value.studySessions) && value.studySessions.every(isStudySession) &&
    Array.isArray(value.readingItems) && value.readingItems.every(isReadingItem) &&
    Array.isArray(value.projects) && value.projects.every(isProject) &&
    Array.isArray(value.projectModules) && value.projectModules.every(isProjectModule) &&
    Array.isArray(value.projectMilestones) && value.projectMilestones.every(isProjectMilestone) &&
    Array.isArray(value.workLogs) && value.workLogs.every(isWorkLog) &&
    Array.isArray(value.testRecords) && value.testRecords.every(isTestRecord) &&
    Array.isArray(value.technicalIssues) && value.technicalIssues.every(isTechnicalIssue) &&
    Array.isArray(value.issueSolutions) && value.issueSolutions.every(isIssueSolution) &&
    Array.isArray(value.knowledgeItems) && value.knowledgeItems.every(isKnowledgeItem) &&
    Array.isArray(value.skills) && value.skills.every(isSkill) &&
    Array.isArray(value.skillEvidence) && value.skillEvidence.every(isSkillEvidence) &&
    Array.isArray(value.reports) && value.reports.every(isReportRecord) &&
    Array.isArray(value.resumeMaterials) && value.resumeMaterials.every(isResumeMaterial) &&
    Array.isArray(value.calendarEvents) && value.calendarEvents.every(isCalendarEvent) &&
    Array.isArray(value.financeTransactions) && value.financeTransactions.every(isFinanceTransaction) &&
    value.metadata.schemaVersion === WORKSPACE_SCHEMA_VERSION &&
    isString(value.metadata.createdAt) &&
    isString(value.metadata.updatedAt)
  );
}

export function isWorkspaceDataV2(value: unknown): value is WorkspaceDataV2 {
  if (!isRecord(value) || !isRecord(value.metadata)) return false;
  return Array.isArray(value.tasks) && value.tasks.every(isTask) &&
    Array.isArray(value.studyPlans) && value.studyPlans.every(isStudyPlan) &&
    Array.isArray(value.studySessions) && value.studySessions.every(isStudySession) &&
    Array.isArray(value.readingItems) && value.readingItems.every(isReadingItem) &&
    value.metadata.schemaVersion === LEGACY_WORKSPACE_SCHEMA_VERSION &&
    isString(value.metadata.createdAt) && isString(value.metadata.updatedAt);
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

export function isWorkspaceBackupV2(value: unknown): value is WorkspaceBackupV2 {
  return isRecord(value) && value.app === "CDC AI Workspace" &&
    value.schemaVersion === LEGACY_WORKSPACE_SCHEMA_VERSION && isString(value.exportedAt) &&
    isWorkspaceDataV2(value.data);
}

export function isLegacyCompletedTaskIds(value: unknown): value is string[] {
  return isStringArray(value);
}

