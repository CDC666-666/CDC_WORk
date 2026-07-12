import type { StudyPlan } from "@/types/learning";
import type { ReadingItem } from "@/types/reading";
import type { Task } from "@/types/task";

export type ProjectStatus = "进行中" | "规划中" | "已归档";
export type { StudyPlan } from "@/types/learning";
export type { ReadingItem } from "@/types/reading";
export type {
  Priority,
  Task,
  TaskDomain as DashboardDomain,
  TaskStatus,
} from "@/types/task";

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
  studentStatus?: string;
  headline?: string;
  goals?: string[];
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  helper: string;
  tone: "blue" | "green" | "amber" | "rose" | "neutral";
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
  domain?: string;
  nextMilestone?: string;
  accent?: "blue" | "green" | "amber";
}

export interface Skill {
  id: string;
  name: string;
  category: "嵌入式" | "控制" | "算法" | "工具链" | "项目管理";
  level: number;
  maxLevel: number;
  progress: number;
  trend: number;
  lastActivity: string;
  nextGoal: string;
}

export interface RecentContentPreview {
  id: string;
  title: string;
  source: string;
  contentType: "视频" | "文章" | "开源项目" | "文档";
  addedAt: string;
  tags: string[];
}

export interface FinanceSummary {
  month: string;
  income: number;
  expense: number;
  currency: "CNY";
  note: string;
}

export interface DashboardData {
  user: UserProfile;
  metrics: DashboardMetric[];
  tasks: Task[];
  studyPlans: StudyPlan[];
  readingItems: ReadingItem[];
  projects: Project[];
  skills: Skill[];
  recentContent: RecentContentPreview[];
  finance: FinanceSummary;
}
