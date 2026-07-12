export type KnowledgeItemType = "笔记" | "视频总结" | "文章" | "项目经验" | "故障方案" | "测试结论" | "读书笔记" | "代码说明";
export type KnowledgeStatus = "收件箱" | "已整理" | "已归档";
export type KnowledgeSourceType = "manual" | "content" | "workLog" | "issue" | "test" | "reading" | "project";

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
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeItemDraft = Omit<KnowledgeItem, "id" | "createdAt" | "updatedAt">;

