export type ProjectCategory = "比赛" | "课程" | "科研" | "个人" | "创业";
export type ProjectStatus = "规划中" | "进行中" | "已暂停" | "已完成" | "已归档";
export type ProjectModuleStatus = "规划中" | "开发中" | "验证中" | "稳定" | "已暂停";
export type MilestoneStatus = "未开始" | "进行中" | "已完成" | "延期";
export type Visibility = "PRIVATE" | "PUBLIC";

export interface Project {
  id: string;
  name: string;
  code: string;
  category: ProjectCategory;
  role: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  objectives: string[];
  responsibilities: string[];
  techStack: string[];
  repositoryUrl: string;
  coverStyle: "blue" | "green" | "amber" | "violet" | "slate";
  createdAt: string;
  updatedAt: string;
}

export interface ProjectModule {
  id: string;
  projectId: string;
  parentId?: string;
  name: string;
  description: string;
  owner: string;
  status: ProjectModuleStatus;
  priority: "高" | "中" | "低";
  progress: number;
  currentTarget: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  status: MilestoneStatus;
  progress: number;
}

export type ProjectDraft = Omit<Project, "id" | "createdAt" | "updatedAt">;
export type ProjectModuleDraft = Omit<ProjectModule, "id" | "createdAt" | "updatedAt">;
export type ProjectMilestoneDraft = Omit<ProjectMilestone, "id">;

/** Target model; the current Workspace v3 `Project` has no publication state. */
export interface ProjectVNext extends Project {
  tags: string[];
  visibility: Visibility;
  publicSummary?: string;
}
