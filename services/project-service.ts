import { createWorkspaceId } from "@/services/workspace-service";
import { assertProjectDeletionAllowed } from "@/lib/storage/domain-relations";
import { localWorkspaceRepository, type WorkspaceRepository } from "@/repositories/workspace-repository";
import type { Project, ProjectDraft, ProjectMilestone, ProjectMilestoneDraft, ProjectModule, ProjectModuleDraft, ProjectVNext } from "@/types/project";
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

export interface ProjectService {
  create(draft: Omit<ProjectVNext, "id" | "createdAt" | "updatedAt">): Promise<ProjectVNext>;
  update(id: string, patch: Partial<Omit<ProjectVNext, "id" | "createdAt">>): Promise<ProjectVNext>;
  delete(id: string): Promise<boolean>;
  query(filter?: { id?: string; status?: ProjectVNext["status"]; visibility?: ProjectVNext["visibility"] }): Promise<ProjectVNext[]>;
}

export function createProjectService(repository: WorkspaceRepository): ProjectService {
  return {
    async create(draft) {
      const timestamp = new Date().toISOString();
      const project: ProjectVNext = { ...draft, id: createWorkspaceId("project"),
        progress: clampProgress(draft.progress), createdAt: timestamp, updatedAt: timestamp };
      await repository.updateDomain((state) => ({ ...state, projects: [...state.projects, project] }));
      return project;
    },
    async update(id, patch) {
      let updated: ProjectVNext | undefined;
      await repository.updateDomain((state) => {
        if (!state.projects.some((item) => item.id === id)) throw new Error("项目不存在。");
        return { ...state, projects: state.projects.map((item) => {
          if (item.id !== id) return item;
          updated = { ...item, ...patch, id, progress: clampProgress(patch.progress ?? item.progress),
            updatedAt: new Date().toISOString() };
          return updated;
        }) };
      });
      if (!updated) throw new Error("项目更新失败。");
      return updated;
    },
    async delete(id) {
      let deleted = false;
      await repository.updateDomain((state) => {
        if (!state.projects.some((item) => item.id === id)) return state;
        assertProjectDeletionAllowed(state, id);
        deleted = true;
        return { ...state, projects: state.projects.filter((item) => item.id !== id) };
      });
      return deleted;
    },
    async query(filter = {}) {
      const state = await repository.loadDomain();
      return state.projects.filter((item) => (!filter.id || item.id === filter.id) &&
        (!filter.status || item.status === filter.status) &&
        (!filter.visibility || item.visibility === filter.visibility));
    },
  };
}

export const projectDomainService = createProjectService(localWorkspaceRepository);
