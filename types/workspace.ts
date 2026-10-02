import type { CalendarEvent } from "@/types/calendar";
import type { Assignment, Chapter, ClassSession, Course, Exam, Semester } from "@/types/academic";
import type { Attachment } from "@/types/attachment";
import type { EngineeringLog, WorkLog } from "@/types/engineering-log";
import type { Experiment } from "@/types/experiment";
import type { FinanceTransaction } from "@/types/finance";
import type { KnowledgeItem, KnowledgeVNext } from "@/types/knowledge";
import type { StudyPlan, StudySession } from "@/types/learning";
import type { Project, ProjectMilestone, ProjectModule, ProjectVNext } from "@/types/project";
import type { ReadingItem } from "@/types/reading";
import type { ReportRecord } from "@/types/report";
import type { ResumeMaterial } from "@/types/resume";
import type { Review } from "@/types/review";
import type { Skill, SkillEvidence, SkillEvidenceVNext } from "@/types/skill";
import type { DomainTask, Task } from "@/types/task";
import type { IssueSolution, TechnicalIssue, TestRecord } from "@/types/testing";
import type { Timeline } from "@/types/timeline";

export const WORKSPACE_SCHEMA_VERSION = 3 as const;
export const WORKSPACE_DOMAIN_SCHEMA_VERSION = 4 as const;
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

export interface AcademicState {
  semesters: Semester[];
  courses: Course[];
  chapters: Chapter[];
  classSessions: ClassSession[];
  assignments: Assignment[];
  exams: Exam[];
}

/** V3-only modules remain available to existing pages until their own migration. */
export type WorkspaceLegacyState = Pick<WorkspaceData,
  | "studyPlans" | "studySessions" | "readingItems" | "technicalIssues"
  | "issueSolutions" | "reports" | "resumeMaterials" | "calendarEvents"
  | "financeTransactions"
>;

/** The localStorage v4 source of truth; legacy UI uses a v3 projection. */
export interface WorkspaceDomainState {
  metadata: { schemaVersion: typeof WORKSPACE_DOMAIN_SCHEMA_VERSION; createdAt: string; updatedAt: string };
  projects: ProjectVNext[];
  projectModules: ProjectModule[];
  projectMilestones: ProjectMilestone[];
  tasks: DomainTask[];
  engineeringLogs: EngineeringLog[];
  experiments: Experiment[];
  knowledge: KnowledgeVNext[];
  skills: Skill[];
  skillEvidence: SkillEvidenceVNext[];
  academic: AcademicState;
  reviews: Review[];
  timeline: Timeline[];
  attachments: Attachment[];
  legacy: WorkspaceLegacyState;
}

export type WorkspaceDomainGraph = WorkspaceDomainState;

export interface WorkspaceDomainBackup {
  app: "CDC AI Workspace";
  schemaVersion: typeof WORKSPACE_DOMAIN_SCHEMA_VERSION;
  exportedAt: string;
  data: WorkspaceDomainState;
}

/** Read-only rescue export; it must never be accepted by the normal import path. */
export interface WorkspaceRecoveryBackup extends WorkspaceDomainBackup {
  recovery: { kind: "INVALID_REFERENCES" | "MANUAL"; issues: string[] };
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

