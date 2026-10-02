import { localWorkspaceRepository, type WorkspaceRepository } from "@/repositories/workspace-repository";
import { createWorkspaceId } from "@/services/workspace-service";
import type { Review, ReviewType } from "@/types/review";

export interface ReviewService {
  create(draft: Omit<Review, "id">): Promise<Review>;
  update(id: string, patch: Partial<Omit<Review, "id">>): Promise<Review>;
  delete(id: string): Promise<boolean>;
  query(filter?: { id?: string; type?: ReviewType; relatedProjectId?: string }): Promise<Review[]>;
}

export function createReviewService(repository: WorkspaceRepository): ReviewService {
  return {
    async create(draft) {
      const review: Review = { ...draft, id: createWorkspaceId("review") };
      await repository.updateDomain((state) => {
        if (review.type === "PROJECT" && (!review.relatedProjectId ||
          !state.projects.some((item) => item.id === review.relatedProjectId))) throw new Error("项目复盘必须关联现有项目。");
        return { ...state, reviews: [...state.reviews, review] };
      });
      return review;
    },
    async update(id, patch) {
      let updated: Review | undefined;
      await repository.updateDomain((state) => {
        const current = state.reviews.find((item) => item.id === id);
        if (!current) throw new Error("复盘不存在。");
        updated = { ...current, ...patch, id };
        if (updated.type === "PROJECT" && (!updated.relatedProjectId ||
          !state.projects.some((item) => item.id === updated!.relatedProjectId))) throw new Error("项目复盘必须关联现有项目。");
        return { ...state, reviews: state.reviews.map((item) => item.id === id ? updated! : item) };
      });
      if (!updated) throw new Error("复盘更新失败。");
      return updated;
    },
    async delete(id) {
      let deleted = false;
      await repository.updateDomain((state) => {
        deleted = state.reviews.some((item) => item.id === id);
        if (deleted && state.attachments.some((item) => item.relatedType === "REVIEW" && item.relatedId === id)) {
          throw new Error("复盘仍有关联附件，不能删除。");
        }
        return deleted ? { ...state, reviews: state.reviews.filter((item) => item.id !== id) } : state;
      });
      return deleted;
    },
    async query(filter = {}) {
      const state = await repository.loadDomain();
      return state.reviews.filter((item) => (!filter.id || item.id === filter.id) &&
        (!filter.type || item.type === filter.type) &&
        (!filter.relatedProjectId || item.relatedProjectId === filter.relatedProjectId));
    },
  };
}

export const reviewDomainService = createReviewService(localWorkspaceRepository);
