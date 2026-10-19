import { createKnowledgeItem } from "@/services/knowledge-service";
import type { EngineeringExperience, ExperienceEvidenceStatus, ExperienceReviewStatus,
  KnowledgeItem, KnowledgeItemDraft } from "@/types/knowledge";
import type { QqDraft } from "@/components/knowledge/qq-experience-editor";

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
    sourceUrl: current?.sourceUrl ?? "",
    // Undefined keeps the current association; the editor's empty option is an explicit clear marker.
    projectId: draft.projectId === undefined ? current?.projectId : draft.projectId,
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

export function createQqExperienceKnowledge(draft: QqDraft, current?: KnowledgeItem,
  now = new Date()): KnowledgeItem {
  const title = draft.title.trim();
  const body = draft.body.trim();
  if (!title || !body) throw new Error("请填写标题和正文。");
  const experience: EngineeringExperience = {
    phenomenon: body, sourceProject: draft.sourceGroup.trim() || "QQ 技术群",
    environment: "QQ 技术群讨论，由 AI 整理", sourceVersion: draft.discussionDate || "原讨论日期未提供",
    investigation: draft.excerpt.trim() || "原文未摘录", failedAttempts: "未记录",
    cause: "AI 整理内容；结论需按验证状态判断", resolution: body,
    verificationResult: draft.verification, evidenceSources: [draft.sourceGroup.trim() || "QQ 技术群整理资料"],
    applicability: draft.applicability.trim() || "待本人核对", limitations: "未经本人实测的内容不得视为已验证",
    openQuestions: draft.supplement.trim() || "待核对", reviewStatus: "待审核",
    evidenceStatus: draft.verification === "已实测" ? "实测验证" : "待核实",
    qq: { sourceGroup: draft.sourceGroup.trim(), discussionDate: draft.discussionDate || undefined,
      excerpt: draft.excerpt.trim(), screenshot: draft.screenshot || undefined,
      verification: draft.verification, supplement: draft.supplement.trim() },
  };
  const base: KnowledgeItemDraft = {
    title, content: body, summary: body.slice(0, 180), itemType: "工程经验", category: "QQ 技术群经验",
    sourceType: "manual", sourceUrl: "", projectId: draft.projectId,
    tags: [...new Set(draft.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean))],
    status: "已整理", importance: 3, experience,
  };
  const issues = experienceValidationIssues(base as unknown as Record<string, unknown>);
  if (issues.length) throw new Error(issues.join("；"));
  return current ? { ...current, ...base, updatedAt: now.toISOString() } : createKnowledgeItem(base, now);
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
    if (filters.project && detail.sourceProject !== filters.project && item.projectId !== filters.project) return false;
    if (filters.evidenceStatus !== "全部" && detail.evidenceStatus !== filters.evidenceStatus) return false;
    if (tag && !item.tags.some((value) => value.toLocaleLowerCase().includes(tag))) return false;
    if (!query) return true;
    return [item.title, item.content, detail.sourceProject, detail.environment, detail.sourceVersion,
      detail.investigation, detail.failedAttempts, detail.cause, detail.resolution,
      detail.verificationResult, detail.applicability, detail.limitations, detail.openQuestions,
      ...detail.evidenceSources, ...item.tags].join(" ").toLocaleLowerCase().includes(query);
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
