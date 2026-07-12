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

export const WORKSPACE_SCHEMA_VERSION = 3 as const;
export const LEGACY_WORKSPACE_SCHEMA_VERSION = 2 as const;

export interface WorkspaceMetadata {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceData {
  tasks: Task[];
  studyPlans: StudyPlan[];
  studySessions: StudySession[];
  readingItems: ReadingItem[];
  projects: Project[];
  projectModules: ProjectModule[];
  projectMilestones: ProjectMilestone[];
  workLogs: WorkLog[];
  testRecords: TestRecord[];
  technicalIssues: TechnicalIssue[];
  issueSolutions: IssueSolution[];
  knowledgeItems: KnowledgeItem[];
  skills: Skill[];
  skillEvidence: SkillEvidence[];
  reports: ReportRecord[];
  resumeMaterials: ResumeMaterial[];
  calendarEvents: CalendarEvent[];
  financeTransactions: FinanceTransaction[];
  metadata: WorkspaceMetadata;
}

export interface WorkspaceDataV2 {
  tasks: Task[];
  studyPlans: StudyPlan[];
  studySessions: StudySession[];
  readingItems: ReadingItem[];
  metadata: {
    schemaVersion: typeof LEGACY_WORKSPACE_SCHEMA_VERSION;
    createdAt: string;
    updatedAt: string;
  };
}

export interface WorkspaceBackup {
  app: "CDC AI Workspace";
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  exportedAt: string;
  data: WorkspaceData;
}

export interface WorkspaceBackupV2 {
  app: "CDC AI Workspace";
  schemaVersion: typeof LEGACY_WORKSPACE_SCHEMA_VERSION;
  exportedAt: string;
  data: WorkspaceDataV2;
}

export type WorkspaceRecoveryKind = "migration" | "invalid-data" | null;

export interface WorkspaceLoadResult {
  data: WorkspaceData;
  recoveryKind: WorkspaceRecoveryKind;
  message: string | null;
}

