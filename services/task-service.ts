import { localWorkspaceRepository, type WorkspaceRepository } from "@/repositories/workspace-repository";
import { createWorkspaceId } from "@/services/workspace-service";
import type { DomainTask, TaskSourceType, TaskStatus } from "@/types/task";
import type { WorkspaceDomainState } from "@/types/workspace";

export interface TaskService {
  create(draft: Omit<DomainTask, "id" | "createdAt" | "updatedAt">): Promise<DomainTask>;
  update(id: string, patch: Partial<Omit<DomainTask, "id" | "createdAt">>): Promise<DomainTask>;
  delete(id: string): Promise<boolean>;
  query(filter?: { id?: string; sourceType?: TaskSourceType; relatedId?: string; status?: TaskStatus }): Promise<DomainTask[]>;
}

function requireRelation(state: WorkspaceDomainState, task: DomainTask): void {
  if (task.sourceType === "PROJECT" && (!task.relatedId || !state.projects.some((item) => item.id === task.relatedId))) {
    throw new Error("项目任务必须关联现有项目。");
  }
  if (task.sourceType === "COURSE" && (!task.relatedId || !state.academic.courses.some((item) => item.id === task.relatedId))) {
    throw new Error("课程任务必须关联现有课程。");
  }
}

export function createTaskService(repository: WorkspaceRepository): TaskService {
  return {
    async create(draft) {
      const timestamp = new Date().toISOString();
      const task: DomainTask = { ...draft, id: createWorkspaceId("task"), createdAt: timestamp, updatedAt: timestamp };
      await repository.updateDomain((state) => {
        requireRelation(state, task);
        return { ...state, tasks: [...state.tasks, task] };
      });
      return task;
    },
    async update(id, patch) {
      let updated: DomainTask | undefined;
      await repository.updateDomain((state) => {
        const current = state.tasks.find((item) => item.id === id);
        if (!current) throw new Error("任务不存在。");
        updated = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
        requireRelation(state, updated);
        return { ...state, tasks: state.tasks.map((item) => item.id === id ? updated! : item) };
      });
      if (!updated) throw new Error("任务更新失败。");
      return updated;
    },
    async delete(id) {
      let deleted = false;
      await repository.updateDomain((state) => {
        deleted = state.tasks.some((item) => item.id === id);
        if (deleted && (state.engineeringLogs.some((item) => item.taskId === id) ||
          state.experiments.some((item) => item.taskId === id) ||
          state.legacy.technicalIssues.some((item) => item.taskId === id) ||
          state.skillEvidence.some((item) => item.evidenceType === "task" && item.sourceId === id))) {
          throw new Error("任务仍有关联工程记录，不能删除。");
        }
        return deleted ? { ...state, tasks: state.tasks.filter((item) => item.id !== id) } : state;
      });
      return deleted;
    },
    async query(filter = {}) {
      const state = await repository.loadDomain();
      return state.tasks.filter((item) => (!filter.id || item.id === filter.id) &&
        (!filter.sourceType || item.sourceType === filter.sourceType) &&
        (!filter.relatedId || item.relatedId === filter.relatedId) &&
        (!filter.status || item.status === filter.status));
    },
  };
}

export const taskDomainService = createTaskService(localWorkspaceRepository);
