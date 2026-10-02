import { localWorkspaceRepository, type WorkspaceRepository } from "@/repositories/workspace-repository";
import { createWorkspaceId } from "@/services/workspace-service";
import type { AcademicState, WorkspaceDomainState } from "@/types/workspace";

export type AcademicCollection = keyof AcademicState;
export type AcademicEntity<K extends AcademicCollection> = AcademicState[K][number];

export interface AcademicService {
  create<K extends AcademicCollection>(collection: K, draft: Omit<AcademicEntity<K>, "id">): Promise<AcademicEntity<K>>;
  update<K extends AcademicCollection>(collection: K, id: string, patch: Partial<Omit<AcademicEntity<K>, "id">>): Promise<AcademicEntity<K>>;
  delete<K extends AcademicCollection>(collection: K, id: string): Promise<boolean>;
  query<K extends AcademicCollection>(collection: K): Promise<AcademicEntity<K>[]>;
}

function validateRelationship(state: WorkspaceDomainState, collection: AcademicCollection, item: { id: string }): void {
  if (collection === "courses") {
    const course = item as AcademicState["courses"][number];
    if (!state.academic.semesters.some((semester) => semester.id === course.semesterId)) {
      throw new Error("课程必须关联现有学期。");
    }
  } else if (collection !== "semesters") {
    const child = item as AcademicState["chapters"][number];
    if (!state.academic.courses.some((course) => course.id === child.courseId)) {
      throw new Error("学术记录必须关联现有课程。");
    }
  }
}

function checkDelete(state: WorkspaceDomainState, collection: AcademicCollection, id: string): void {
  if (collection === "semesters" && state.academic.courses.some((item) => item.semesterId === id)) {
    throw new Error("学期仍有课程，不能删除。");
  }
  if (collection === "courses" && (
    state.academic.chapters.some((item) => item.courseId === id) ||
    state.academic.classSessions.some((item) => item.courseId === id) ||
    state.academic.assignments.some((item) => item.courseId === id) ||
    state.academic.exams.some((item) => item.courseId === id) ||
    state.tasks.some((item) => item.sourceType === "COURSE" && item.relatedId === id) ||
    state.knowledge.some((item) => item.courseId === id) ||
    state.skillEvidence.some((item) => item.courseId === id) ||
    state.attachments.some((item) => item.relatedType === "COURSE" && item.relatedId === id)
  )) throw new Error("课程仍有关联记录，不能删除。");
  if (collection === "assignments" && state.attachments.some((item) =>
    item.relatedType === "ASSIGNMENT" && item.relatedId === id)) throw new Error("作业仍有关联附件，不能删除。");
}

export function createAcademicService(repository: WorkspaceRepository): AcademicService {
  return {
    async create<K extends AcademicCollection>(collection: K, draft: Omit<AcademicEntity<K>, "id">) {
      const item = { ...draft, id: createWorkspaceId(collection.slice(0, -1)) } as AcademicEntity<K>;
      await repository.updateDomain((state) => {
        validateRelationship(state, collection, item);
        const items = state.academic[collection] as AcademicEntity<K>[];
        return { ...state, academic: { ...state.academic, [collection]: [...items, item] } };
      });
      return item;
    },
    async update<K extends AcademicCollection>(collection: K, id: string, patch: Partial<Omit<AcademicEntity<K>, "id">>) {
      let updated: AcademicEntity<K> | undefined;
      await repository.updateDomain((state) => {
        const items = state.academic[collection] as AcademicEntity<K>[];
        const current = items.find((item) => item.id === id);
        if (!current) throw new Error("学术记录不存在。");
        updated = { ...current, ...patch, id };
        validateRelationship(state, collection, updated);
        return { ...state, academic: { ...state.academic,
          [collection]: items.map((item) => item.id === id ? updated! : item) } };
      });
      if (!updated) throw new Error("学术记录更新失败。");
      return updated;
    },
    async delete<K extends AcademicCollection>(collection: K, id: string) {
      let deleted = false;
      await repository.updateDomain((state) => {
        const items = state.academic[collection] as AcademicEntity<K>[];
        deleted = items.some((item) => item.id === id);
        if (!deleted) return state;
        checkDelete(state, collection, id);
        return { ...state, academic: { ...state.academic,
          [collection]: items.filter((item) => item.id !== id) } };
      });
      return deleted;
    },
    async query<K extends AcademicCollection>(collection: K) {
      const state = await repository.loadDomain();
      return state.academic[collection] as AcademicEntity<K>[];
    },
  };
}

export const academicDomainService = createAcademicService(localWorkspaceRepository);
