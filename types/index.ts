export type ProjectStatus = "进行中" | "规划中" | "已归档";
export type ModuleStatus = "开发中" | "验证中" | "待规划" | "稳定";
export type Priority = "高" | "中" | "低";
export type TaskStatus = "待开始" | "进行中" | "已完成" | "受阻";
export type WorkLogResult = "完成" | "部分完成" | "受阻";
export type IssueStatus = "待定位" | "处理中" | "已解决";
export type IssueSeverity = "S1" | "S2" | "S3";

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  grade: string;
  role: string;
  team: string;
  primaryController: string;
  techStack: string[];
  focusAreas: string[];
}

export interface Project {
  id: string;
  name: string;
  code: string;
  season: string;
  role: string;
  status: ProjectStatus;
  progress: number;
  description: string;
  moduleIds: string[];
  updatedAt: string;
}

export interface ProjectModule {
  id: string;
  projectId: string;
  name: string;
  shortName: string;
  status: ModuleStatus;
  priority: Priority;
  progress: number;
  currentTarget: string;
  lastUpdated: string;
}

export interface Task {
  id: string;
  projectId: string;
  moduleId: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueAt: string;
  estimateHours: number;
  tags: string[];
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

export interface Skill {
  id: string;
  name: string;
  category: "嵌入式" | "控制" | "算法" | "工具链";
  level: number;
  maxLevel: number;
  progress: number;
  trend: number;
  lastActivity: string;
  nextGoal: string;
}

export interface WeeklyMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  change: string;
  tone: "cyan" | "green" | "amber" | "neutral";
}
