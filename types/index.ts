export type {
  DashboardDomain,
  DashboardMetric,
  FinanceSummary,
  Priority,
  Project,
  ProjectStatus,
  ReadingItem,
  RecentContentPreview,
  Skill,
  StudyPlan,
  Task,
  TaskStatus,
  UserProfile,
} from "@/types/dashboard";

export type ModuleStatus = "开发中" | "验证中" | "待规划" | "稳定";
export type WorkLogResult = "完成" | "部分完成" | "受阻";
export type IssueStatus = "待定位" | "处理中" | "已解决";
export type IssueSeverity = "S1" | "S2" | "S3";

export interface ProjectModule {
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

export interface WorkLog {
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

export interface TechnicalIssue {
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
