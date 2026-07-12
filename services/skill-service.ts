import { createWorkspaceId } from "@/services/workspace-service"; import type { Skill, SkillDraft, SkillEvidence, SkillEvidenceDraft } from "@/types/skill";
export function clampSkillScore(value: number) { return Math.min(100, Math.max(0, Math.round(value))); }
export function createSkill(draft: SkillDraft, now = new Date()): Skill { const timestamp = now.toISOString(); const score = clampSkillScore(draft.score); return { ...draft, score, targetScore: clampSkillScore(draft.targetScore), level: Math.max(1, Math.ceil(score / 20)), id: createWorkspaceId("skill"), createdAt: timestamp, updatedAt: timestamp }; }
export function updateSkill(skill: Skill, now = new Date()): Skill { const score = clampSkillScore(skill.score); return { ...skill, score, targetScore: clampSkillScore(skill.targetScore), level: Math.max(1, Math.ceil(score / 20)), updatedAt: now.toISOString() }; }
export function createSkillEvidence(draft: SkillEvidenceDraft, now = new Date()): SkillEvidence { return { ...draft, id: createWorkspaceId("evidence"), createdAt: now.toISOString() }; }
export function applyEvidenceToSkill(skill: Skill, evidence: SkillEvidence, now = new Date()): Skill { return updateSkill({ ...skill, score: clampSkillScore(skill.score + evidence.scoreChange) }, now); }

