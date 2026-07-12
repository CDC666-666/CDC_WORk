export type ReportType = "日报" | "周报" | "月报" | "项目阶段报告" | "测试报告" | "问题复盘报告" | "学习总结";
export type ReportStatus = "草稿" | "已确认" | "已归档";

export interface ReportRecord {
  id: string;
  title: string;
  reportType: ReportType;
  projectId?: string;
  dateFrom: string;
  dateTo: string;
  content: string;
  sourceRefs: string[];
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReportRecordDraft = Omit<ReportRecord, "id" | "createdAt" | "updatedAt">;

