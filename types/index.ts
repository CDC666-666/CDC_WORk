export type {
  DashboardDomain,
  DashboardMetric,
  FinanceSummary,
  Priority,
  Project as DashboardProject,
  ProjectStatus as DashboardProjectStatus,
  ReadingItem,
  RecentContentPreview,
  Skill as DashboardSkill,
  StudyPlan,
  Task,
  TaskStatus,
  UserProfile,
} from "@/types/dashboard";

export type {
  StudyPlanCategory,
  StudyPlanDraft,
  StudyPlanStatus,
  StudySession,
  StudySessionDraft,
} from "@/types/learning";
export type {
  ReadingCategory,
  ReadingItemDraft,
  ReadingStatus,
} from "@/types/reading";
export type { DomainTask, TaskCreationSourceType, TaskDraft, TaskDomain, TaskSourceType, TaskVNext } from "@/types/task";
export type {
  WorkspaceBackup,
  WorkspaceData,
  WorkspaceDomainGraph,
  WorkspaceDomainBackup,
  WorkspaceDomainState,
  AcademicState,
  WorkspaceLoadResult,
  WorkspaceMetadata,
  WorkspaceRecoveryKind,
} from "@/types/workspace";
export type * from "@/types/calendar";
export type * from "@/types/academic";
export type * from "@/types/attachment";
export type * from "@/types/engineering-log";
export type * from "@/types/experiment";
export type * from "@/types/finance";
export type * from "@/types/knowledge";
export type * from "@/types/project";
export type * from "@/types/report";
export type * from "@/types/review";
export type * from "@/types/resume";
export type * from "@/types/skill";
export type * from "@/types/testing";
export type * from "@/types/timeline";

export type ModuleStatus = "开发中" | "验证中" | "待规划" | "稳定";
export type WorkLogResult = "完成" | "部分完成" | "受阻";
export type IssueStatus = "待定位" | "处理中" | "已解决";
export type IssueSeverity = "S1" | "S2" | "S3";

export interface DashboardProjectModule {
  id: string;
  projectId: string;
  name: string;
  shortName: string;
  status: ModuleStatus;
  priority: "高" | "中" | "低";
  progress: number;
  currentTarget: string;
  lastUpdated: string;
}

export interface DashboardWorkLog {
  id: string;
  projectId: string;
  moduleId: string;
  date: string;
  title: string;
  summary: string;
  durationMinutes: number;
  result: WorkLogResult;
  tags: string[];
}

export interface DashboardTechnicalIssue {
  id: string;
  projectId: string;
  moduleId: string;
  title: string;
  phenomenon: string;
  rootCause?: string;
  solution?: string;
  severity: IssueSeverity;
  status: IssueStatus;
  occurredAt: string;
}

export interface WeeklyMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  change: string;
  tone: "cyan" | "green" | "amber" | "neutral";
}
