import { localWorkspaceRepository, type WorkspaceRepository } from "@/repositories/workspace-repository";
import { createWorkspaceId } from "@/services/workspace-service";
import { canonicalReflectionDate, filterReflections, type ReflectionFilter } from "@/services/reflection-period";
import type { Review } from "@/types/review";
import type { ProjectVNext } from "@/types/project";

export interface ReviewService {
  create(draft: Omit<Review, "id">): Promise<Review>;
  update(id: string, patch: Partial<Omit<Review, "id">>): Promise<Review>;
  delete(id: string): Promise<boolean>;
  query(filter?: ReflectionFilter & { id?: string }): Promise<Review[]>;
  loadState(): Promise<{ reviews: Review[]; projects: ProjectVNext[] }>;
}

function validateReview(review: Review, projects: ProjectVNext[]): Review {
  if (!review.summary.trim()) throw new Error("请填写总结内容。");
  const relatedProjectId = review.relatedProjectId || undefined;
  if (review.type === "PROJECT" && !relatedProjectId) throw new Error("项目复盘必须关联现有项目。");
  if (relatedProjectId && !projects.some((item) => item.id === relatedProjectId)) {
    throw new Error("关联项目不存在，请选择现有项目。");
  }
  return { ...review, summary: review.summary.trim(), relatedProjectId,
    date: canonicalReflectionDate(review.type, review.date) };
}

export function createReviewService(repository: WorkspaceRepository): ReviewService {
  return {
    async create(draft) {
      let review: Review = { ...draft, id: createWorkspaceId("review") };
      await repository.updateDomain((state) => {
        review = validateReview(review, state.projects);
        return { ...state, reviews: [...state.reviews, review] };
      });
      return review;
    },
    async update(id, patch) {
      let updated: Review | undefined;
      await repository.updateDomain((state) => {
        const current = state.reviews.find((item) => item.id === id);
        if (!current) throw new Error("复盘不存在。");
        updated = validateReview({ ...current, ...patch, id }, state.projects);
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
      return filterReflections(state.reviews, filter).filter((item) => !filter.id || item.id === filter.id);
    },
    async loadState() {
      const state = await repository.loadDomain();
      return { reviews: state.reviews, projects: state.projects };
    },
  };
}

export const reviewDomainService = createReviewService(localWorkspaceRepository);
