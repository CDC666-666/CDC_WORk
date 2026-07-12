export type Priority = "高" | "中" | "低";
export type TaskStatus = "待开始" | "进行中" | "已完成" | "受阻";
export type TaskSourceType = "manual" | "content" | "reading" | "project";

export type TaskDomain =
  | "学校学习"
  | "阅读成长"
  | "项目研发"
  | "内容学习"
  | "个人管理";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  domain: TaskDomain;
  scheduledDate: string;
  dueAt: string;
  estimateHours: number;
  actualHours: number;
  tags: string[];
  projectId?: string;
  moduleId?: string;
  sourceType: TaskSourceType;
  sourceId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type TaskDraft = Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">;

