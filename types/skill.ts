export type SkillCategory = "嵌入式" | "控制" | "算法" | "软件" | "工具链" | "项目管理" | "产品" | "其他";
export type SkillStatus = "学习中" | "实践中" | "熟练" | "暂停";
export type SkillEvidenceType = "task" | "study" | "workLog" | "test" | "issue" | "knowledge" | "project" | "achievement" | "manual";

export interface Skill {
  id: string;
  parentId?: string;
  name: string;
  category: SkillCategory;
  description: string;
  level: number;
  score: number;
  targetScore: number;
  status: SkillStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SkillEvidence {
  id: string;
  skillId: string;
  evidenceType: SkillEvidenceType;
  sourceId?: string;
  projectId?: string;
  description: string;
  scoreChange: number;
  occurredAt: string;
  createdAt: string;
}

export type SkillDraft = Omit<Skill, "id" | "createdAt" | "updatedAt">;
export type SkillEvidenceDraft = Omit<SkillEvidence, "id" | "createdAt">;

