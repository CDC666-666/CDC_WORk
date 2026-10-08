import { createKnowledgeItem } from "@/services/knowledge-service";
import type { EngineeringExperience, ExperienceEvidenceStatus, ExperienceReviewStatus,
  KnowledgeItem, KnowledgeItemDraft } from "@/types/knowledge";

export interface ExperienceDraft {
  title: string;
  tags: string[];
  projectId?: string;
  experience: EngineeringExperience;
}

export interface ExperienceFilters {
  query: string;
  project: string;
  tag: string;
  evidenceStatus: ExperienceEvidenceStatus | "全部";
}

export const evidenceStatuses: ExperienceEvidenceStatus[] =
  ["待核实", "历史现场反馈", "源码静态核对", "实测验证"];
export const reviewStatuses: ExperienceReviewStatus[] = ["待审核", "已审核"];

export function isEngineeringExperience(item: KnowledgeItem): item is KnowledgeItem &
  { experience: EngineeringExperience } {
  return item.itemType === "工程经验" && item.experience !== undefined;
}

export function experienceValidationIssues(item: Record<string, unknown>): string[] {
  if (item.itemType !== "工程经验") return item.experience === undefined ? [] : ["非工程经验记录不能携带经验详情"];
  const value = item.experience;
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["工程经验详情不能为空"];
  const experience = value as Record<string, unknown>;
  const fields = ["phenomenon", "sourceProject", "environment", "sourceVersion", "investigation",
    "failedAttempts", "cause", "resolution", "verificationResult", "applicability", "limitations",
    "openQuestions"] as const;
  const problems = fields.filter((field) => typeof experience[field] !== "string" ||
    !(experience[field] as string).trim()).map((field) => `${field} 不能为空`);
  for (const field of ["content", "summary", "category", "sourceType", "status"] as const) {
    if (typeof item[field] !== "string" || !(item[field] as string).trim()) problems.push(`${field} 不能为空`);
  }
  if (item.sourceType === "sharedMemory" && (item.sourceId !== experience.sourceKey ||
    typeof experience.sourceRevision !== "string")) problems.push("共享来源标识与摘要不完整");
  if (!Array.isArray(experience.evidenceSources) || !experience.evidenceSources.length ||
    !experience.evidenceSources.every((source: unknown) => typeof source === "string" && source.trim())) {
    problems.push("evidenceSources 至少需要一条来源");
  }
  if (!reviewStatuses.includes(experience.reviewStatus as ExperienceReviewStatus)) problems.push("审核状态无效");
  if (!evidenceStatuses.includes(experience.evidenceStatus as ExperienceEvidenceStatus)) problems.push("证据状态无效");
  if (experience.sourceKey !== undefined && (typeof experience.sourceKey !== "string" || !experience.sourceKey)) {
    problems.push("来源标识无效");
  }
  if (experience.sourceRevision !== undefined &&
    (typeof experience.sourceRevision !== "string" || !/^[a-f0-9]{64}$/.test(experience.sourceRevision))) {
    problems.push("来源摘要无效");
  }
  if (!Array.isArray(item.tags) || !item.tags.every((tag: unknown) => typeof tag === "string" && tag.trim())) {
    problems.push("标签无效");
  }
  return problems;
}

export function createExperienceKnowledge(draft: ExperienceDraft, current?: KnowledgeItem,
  now = new Date()): KnowledgeItem {
  const base: KnowledgeItemDraft = {
    title: draft.title.trim(), content: draft.experience.phenomenon.trim(),
    summary: draft.experience.cause.trim(), itemType: "工程经验", category: "工程经验",
    sourceType: current?.sourceType ?? "manual", sourceId: current?.sourceId,
    sourceUrl: current?.sourceUrl ?? "", projectId: draft.projectId || undefined,
    tags: [...new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))],
    status: current?.status ?? "已整理", importance: current?.importance ?? 4,
    experience: { ...draft.experience,
      // The import identity is immutable from the editor; later sync must compare revisions explicitly.
      sourceKey: current?.experience?.sourceKey,
      sourceRevision: current?.experience?.sourceRevision },
  };
  const problems = experienceValidationIssues(base as unknown as Record<string, unknown>);
  if (!base.title || problems.length) throw new Error([!base.title ? "标题不能为空" : "", ...problems].filter(Boolean).join("；"));
  if (current) return { ...current, ...base, updatedAt: now.toISOString() };
  return createKnowledgeItem(base, now);
}

export function withExperienceReviewStatus(item: KnowledgeItem, status: ExperienceReviewStatus,
  now = new Date()): KnowledgeItem {
  if (!isEngineeringExperience(item)) throw new Error("记录不是工程经验");
  return { ...item, experience: { ...item.experience, reviewStatus: status }, updatedAt: now.toISOString() };
}

export function filterExperiences(items: KnowledgeItem[], filters: ExperienceFilters): KnowledgeItem[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const tag = filters.tag.trim().toLocaleLowerCase();
  return items.filter(isEngineeringExperience).filter((item) => {
    const detail = item.experience;
    if (filters.project && detail.sourceProject !== filters.project) return false;
    if (filters.evidenceStatus !== "全部" && detail.evidenceStatus !== filters.evidenceStatus) return false;
    if (tag && !item.tags.some((value) => value.toLocaleLowerCase().includes(tag))) return false;
    if (!query) return true;
    return [item.title, item.content, detail.sourceProject, detail.environment, detail.sourceVersion,
      detail.investigation, detail.failedAttempts, detail.cause, detail.resolution,
      detail.verificationResult, detail.applicability, detail.limitations, detail.openQuestions,
      ...detail.evidenceSources, ...item.tags].join(" ").toLocaleLowerCase().includes(query);
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
