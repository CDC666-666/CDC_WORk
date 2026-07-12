import { createWorkspaceId } from "@/services/workspace-service";
import type { Project, ProjectDraft, ProjectMilestone, ProjectMilestoneDraft, ProjectModule, ProjectModuleDraft } from "@/types/project";
import type { WorkspaceData } from "@/types/workspace";

export interface ProjectImpact {
  tasks: number;
  logs: number;
  tests: number;
  issues: number;
  knowledge: number;
  modules: number;
  milestones: number;
  reports: number;
  resumeMaterials: number;
}

export function createProject(draft: ProjectDraft, now = new Date()): Project {
  const timestamp = now.toISOString();
  return { ...draft, progress: clampProgress(draft.progress), id: createWorkspaceId("project"), createdAt: timestamp, updatedAt: timestamp };
}

export function updateProject(project: Project, now = new Date()): Project {
  return { ...project, progress: clampProgress(project.progress), updatedAt: now.toISOString() };
}

export function createProjectModule(draft: ProjectModuleDraft, now = new Date()): ProjectModule {
  const timestamp = now.toISOString();
  return { ...draft, progress: clampProgress(draft.progress), id: createWorkspaceId("module"), createdAt: timestamp, updatedAt: timestamp };
}

export function updateProjectModule(module: ProjectModule, now = new Date()): ProjectModule {
  return { ...module, progress: clampProgress(module.progress), updatedAt: now.toISOString() };
}

export function createProjectMilestone(draft: ProjectMilestoneDraft): ProjectMilestone {
  return { ...draft, progress: clampProgress(draft.progress), id: createWorkspaceId("milestone") };
}

export function getProjectImpact(data: WorkspaceData, projectId: string): ProjectImpact {
  return {
    tasks: data.tasks.filter((item) => item.projectId === projectId).length,
    logs: data.workLogs.filter((item) => item.projectId === projectId).length,
    tests: data.testRecords.filter((item) => item.projectId === projectId).length,
    issues: data.technicalIssues.filter((item) => item.projectId === projectId).length,
    knowledge: data.knowledgeItems.filter((item) => item.projectId === projectId).length,
    modules: data.projectModules.filter((item) => item.projectId === projectId).length,
    milestones: data.projectMilestones.filter((item) => item.projectId === projectId).length,
    reports: data.reports.filter((item) => item.projectId === projectId).length,
    resumeMaterials: data.resumeMaterials.filter((item) => item.projectId === projectId).length,
  };
}

export function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

