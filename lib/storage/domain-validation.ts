import { createEmptyWorkspaceData } from "@/data/initial-workspace-data";
import { isKnowledgeItem, isProject, isProjectMilestone, isProjectModule, isSkill,
  isSkillEvidence, isTask, isTestRecord, isWorkLog, isWorkspaceData } from "@/lib/storage/workspace-validation";
import type { WorkspaceDomainBackup, WorkspaceDomainState } from "@/types/workspace";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => typeof value === "object" && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === "string";
const optionalString = (value: unknown): boolean => value === undefined || string(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(string);
const oneOf = (value: unknown, choices: readonly string[]): boolean => string(value) && choices.includes(value);
const collection = (value: unknown, valid: (entry: unknown) => boolean): boolean => Array.isArray(value) && value.every(valid);

function validTask(value: unknown): boolean {
  if (!record(value) || !string(value.deadline) || !optionalString(value.relatedId) ||
    !optionalString(value.creationSourceType) || !optionalString(value.creationSourceId) ||
    !oneOf(value.sourceType, ["PROJECT", "COURSE", "LEARNING", "PERSONAL"])) return false;
  return isTask({ ...value, dueAt: value.deadline, projectId: value.sourceType === "PROJECT" ? value.relatedId : undefined,
    sourceType: value.creationSourceType ?? "manual", sourceId: value.creationSourceId });
}

function validAcademic(value: unknown): boolean {
  if (!record(value)) return false;
  const base = (entry: unknown): entry is RecordValue => record(entry) && string(entry.id);
  const semesters = collection(value.semesters, (item) => base(item) && typeof item.year === "number" && Number.isInteger(item.year) &&
    string(item.term) && string(item.name));
  const courses = collection(value.courses, (item) => base(item) && string(item.semesterId) &&
    string(item.name) && oneOf(item.type, ["MAJOR", "GENERAL"]) && string(item.teacher) &&
    typeof item.credits === "number" && Number.isFinite(item.credits) &&
    typeof item.importance === "number" && Number.isInteger(item.importance) &&
    item.importance >= 1 && item.importance <= 5 &&
    oneOf(item.status, ["PLANNED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]));
  const chapters = collection(value.chapters, (item) => base(item) && string(item.courseId) &&
    string(item.title) && string(item.content) && optionalString(item.learnDate));
  const sessions = collection(value.classSessions, (item) => base(item) && string(item.courseId) &&
    string(item.date) && string(item.summary) && string(item.notes));
  const assignments = collection(value.assignments, (item) => base(item) && string(item.courseId) &&
    string(item.title) && string(item.description) && string(item.deadline) &&
    oneOf(item.status, ["TODO", "IN_PROGRESS", "COMPLETED"]) && oneOf(item.priority, ["HIGH", "MEDIUM", "LOW"]));
  const exams = collection(value.exams, (item) => base(item) && string(item.courseId) && string(item.date) &&
    oneOf(item.type, ["QUIZ", "MIDTERM", "FINAL", "OTHER"]) &&
    oneOf(item.reviewStatus, ["NOT_STARTED", "IN_PROGRESS", "READY"]));
  return semesters && courses && chapters && sessions && assignments && exams;
}

/** Reject malformed v4 JSON before it can replace valid v3 browser data. */
export function isWorkspaceDomainState(value: unknown): value is WorkspaceDomainState {
  if (!record(value) || !record(value.metadata) || value.metadata.schemaVersion !== 4 ||
    !string(value.metadata.createdAt) || !string(value.metadata.updatedAt) || !record(value.legacy)) return false;
  if (!collection(value.projects, (item) => isProject(item) && record(item) && strings(item.tags) &&
    oneOf(item.visibility, ["PRIVATE", "PUBLIC"]) && optionalString(item.publicSummary)) ||
    !collection(value.projectModules, isProjectModule) || !collection(value.projectMilestones, isProjectMilestone) ||
    !collection(value.tasks, validTask) ||
    !collection(value.engineeringLogs, (item) => isWorkLog(item) && record(item) &&
      ["environment", "problem", "symptom", "analysis", "solution"].every((key) => string(item[key]))) ||
    !collection(value.experiments, (item) => isTestRecord(item) && record(item) &&
      string(item.hypothesis) && string(item.observations)) ||
    !collection(value.knowledge, (item) => isKnowledgeItem(item) && record(item) && optionalString(item.courseId)) ||
    !collection(value.skills, isSkill) ||
    !collection(value.skillEvidence, (item) => isSkillEvidence(item) && record(item) &&
      optionalString(item.courseId) && optionalString(item.knowledgeId)) || !validAcademic(value.academic) ||
    !collection(value.reviews, (item) => record(item) && string(item.id) &&
      oneOf(item.type, ["DAILY", "WEEKLY", "MONTHLY", "PROJECT"]) && string(item.date) &&
      ["summary", "achievement", "problem", "plan"].every((key) => string(item[key])) &&
      optionalString(item.relatedProjectId)) ||
    !collection(value.timeline, (item) => record(item) && string(item.id) && string(item.date) &&
      string(item.title) && string(item.description) && strings(item.tags) &&
      optionalString(item.relatedProjectId) && oneOf(item.visibility, ["PRIVATE", "PUBLIC"])) ||
    !collection(value.attachments, (item) => record(item) && string(item.id) && string(item.url) &&
      string(item.type) && oneOf(item.relatedType, ["PROJECT", "ENGINEERING_LOG", "KNOWLEDGE", "REVIEW", "COURSE", "ASSIGNMENT", "EXPERIMENT"]) &&
      string(item.relatedId))) return false;
  const legacy = value.legacy;
  if (!["studyPlans", "studySessions", "readingItems", "technicalIssues", "issueSolutions",
    "reports", "resumeMaterials", "calendarEvents", "financeTransactions"].every((key) => Array.isArray(legacy[key]))) return false;
  return isWorkspaceData({ ...createEmptyWorkspaceData(), ...legacy });
}

export function isWorkspaceDomainBackup(value: unknown): value is WorkspaceDomainBackup {
  return record(value) && value.app === "CDC AI Workspace" && value.schemaVersion === 4 &&
    string(value.exportedAt) && isWorkspaceDomainState(value.data);
}
