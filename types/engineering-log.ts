export type WorkLogResultStatus = "完成" | "部分完成" | "受阻";

export interface WorkLog {
  id: string;
  projectId: string;
  moduleId?: string;
  taskId?: string;
  date: string;
  title: string;
  workContent: string;
  result: string;
  problems: string;
  nextPlan: string;
  durationMinutes: number;
  resultStatus: WorkLogResultStatus;
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export type WorkLogDraft = Omit<WorkLog, "id" | "createdAt" | "updatedAt">;

