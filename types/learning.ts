export type StudyPlanCategory = "课程" | "技术" | "考试" | "项目" | "阶段目标";
export type StudyPlanStatus = "未开始" | "进行中" | "已完成" | "已暂停";

export interface StudyPlan {
  id: string;
  title: string;
  category: StudyPlanCategory;
  description: string;
  targetHours: number;
  completedHours: number;
  progress: number;
  deadline: string;
  nextAction: string;
  status: StudyPlanStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  studyPlanId: string;
  date: string;
  durationMinutes: number;
  content: string;
  result: string;
  notes: string;
  createdAt: string;
}

export type StudyPlanDraft = Omit<StudyPlan, "id" | "progress" | "createdAt" | "updatedAt">;
export type StudySessionDraft = Omit<StudySession, "id" | "createdAt">;

