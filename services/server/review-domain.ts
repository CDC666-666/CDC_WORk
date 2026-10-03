import { ApiError } from "@/lib/server/api-response";
import { parseReviewCreate } from "@/services/server/review-input";
import type { ReviewCreate, ReviewPatch, ReviewQuery, ServerReview } from "@/types/server-review";

export interface ServerReviewStore {
  list(workspaceId: string, query?: ReviewQuery): Promise<ServerReview[]>;
  get(workspaceId: string, id: string): Promise<ServerReview | null>;
  create(workspaceId: string, draft: ReviewCreate): Promise<ServerReview>;
  update(workspaceId: string, id: string, version: number, draft: ReviewCreate): Promise<ServerReview>;
  delete(workspaceId: string, id: string, version: number): Promise<void>;
}

export function createServerReviewService(store: ServerReviewStore) {
  return {
    list: (workspaceId: string, query?: ReviewQuery) => store.list(workspaceId, query),
    async get(workspaceId: string, id: string): Promise<ServerReview> {
      const item = await store.get(workspaceId, id);
      if (!item) throw new ApiError(404, "总结不存在。");
      return item;
    },
    create: (workspaceId: string, draft: ReviewCreate) => store.create(workspaceId, draft),
    async update(workspaceId: string, id: string, patch: ReviewPatch): Promise<ServerReview> {
      const current = await store.get(workspaceId, id);
      if (!current) throw new ApiError(404, "总结不存在。");
      const draft = parseReviewCreate({
        type: patch.type ?? current.type,
        date: patch.date ?? current.date,
        summary: patch.summary ?? current.summary,
        achievement: patch.achievement ?? current.achievement,
        problem: patch.problem ?? current.problem,
        plan: patch.plan ?? current.plan,
        relatedProjectId: Object.hasOwn(patch, "relatedProjectId") ? patch.relatedProjectId : current.relatedProjectId,
      });
      return store.update(workspaceId, id, patch.version, draft);
    },
    delete: (workspaceId: string, id: string, version: number) => store.delete(workspaceId, id, version),
  };
}
