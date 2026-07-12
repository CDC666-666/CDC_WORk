export type ResumeMaterialType = "项目职责" | "技术挑战" | "解决方案" | "项目成果" | "团队协作" | "领导经历" | "技能证明";
export type ResumeTargetRole = "嵌入式" | "电控" | "产品经理" | "项目管理" | "机器人" | "通用";
export type ResumeMaterialStatus = "待整理" | "可使用" | "已使用" | "已归档";

export interface ResumeMaterial {
  id: string;
  projectId?: string;
  materialType: ResumeMaterialType;
  title: string;
  originalContent: string;
  polishedContentCn: string;
  polishedContentEn: string;
  targetRole: ResumeTargetRole;
  metrics: Record<string, string | number>;
  tags: string[];
  status: ResumeMaterialStatus;
  createdAt: string;
  updatedAt: string;
}

export type ResumeMaterialDraft = Omit<ResumeMaterial, "id" | "createdAt" | "updatedAt">;

