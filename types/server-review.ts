import type { Review, ReviewType } from "@/types/review";

export interface ServerReview extends Review {
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQuery {
  id?: string;
  type?: ReviewType;
  relatedProjectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type ReviewCreate = Omit<Review, "id">;
export type ReviewPatch = Partial<ReviewCreate> & { version: number };
