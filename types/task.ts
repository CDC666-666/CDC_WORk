export type Priority = "高" | "中" | "低";
export type TaskStatus = "待开始" | "进行中" | "已完成" | "受阻";
/** Workspace v3 creation provenance; retained for existing browser data. */
export type TaskCreationSourceType = "manual" | "content" | "reading" | "project";

/** The task's domain relationship in the next persistence model. */
export type TaskSourceType = "PROJECT" | "COURSE" | "LEARNING" | "PERSONAL";

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
  sourceType: TaskCreationSourceType;
  sourceId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type TaskDraft = Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">;

/** Persisted v4 task. `relatedId` is interpreted with `sourceType`. */
export type DomainTask = Omit<Task, "dueAt" | "projectId" | "sourceType" | "sourceId"> & {
  deadline: string;
  sourceType: TaskSourceType;
  relatedId?: string;
  creationSourceType?: TaskCreationSourceType;
  creationSourceId?: string;
};

/** Kept as an alias for callers of the Sprint 4.2 target type. */
export type TaskVNext = DomainTask;

