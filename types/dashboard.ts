export type ProjectStatus = "进行中" | "规划中" | "已归档";
export type Priority = "高" | "中" | "低";
export type TaskStatus = "待开始" | "进行中" | "已完成" | "受阻";
export type DashboardDomain =
  | "学校学习"
  | "阅读成长"
  | "项目研发"
  | "内容学习"
  | "个人管理";

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

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueAt: string;
  estimateHours: number;
  tags: string[];
  domain?: DashboardDomain;
  projectId?: string;
  moduleId?: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  category: "课程" | "阅读" | "阶段目标";
  progress: number;
  nextAction: string;
  deadline: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  targetDate: string;
  status: "待读" | "阅读中" | "已完成";
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
