export type KnowledgeItemType = "笔记" | "视频总结" | "文章" | "项目经验" | "故障方案" | "测试结论" | "读书笔记" | "代码说明" | "工程经验";
export type KnowledgeStatus = "收件箱" | "已整理" | "已归档";
export type KnowledgeSourceType = "manual" | "content" | "workLog" | "issue" | "test" | "reading" | "project" | "sharedMemory";

export type ExperienceReviewStatus = "待审核" | "已审核";
export type ExperienceEvidenceStatus = "待核实" | "历史现场反馈" | "源码静态核对" | "实测验证";

/** Structured conclusion attached to the existing private Knowledge entity. */
export interface EngineeringExperience {
  phenomenon: string;
  sourceProject: string;
  environment: string;
  sourceVersion: string;
  investigation: string;
  failedAttempts: string;
  cause: string;
  resolution: string;
  verificationResult: string;
  evidenceSources: string[];
  applicability: string;
  limitations: string;
  openQuestions: string;
  reviewStatus: ExperienceReviewStatus;
  evidenceStatus: ExperienceEvidenceStatus;
  /** Stable source key and digest for a future one-way sync; editing never rewrites the source file. */
  sourceKey?: string;
  sourceRevision?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  itemType: KnowledgeItemType;
  category: string;
  sourceType: KnowledgeSourceType;
  sourceId?: string;
  projectId?: string;
  moduleId?: string;
  sourceUrl: string;
  tags: string[];
  status: KnowledgeStatus;
  importance: 1 | 2 | 3 | 4 | 5;
  experience?: EngineeringExperience;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeItemDraft = Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">;

/** A knowledge item may be traced back to a course in the next model. */
export interface KnowledgeVNext extends KnowledgeItem {
  courseId?: string;
}
