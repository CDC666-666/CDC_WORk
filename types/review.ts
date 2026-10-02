export type ReviewType = "DAILY" | "WEEKLY" | "MONTHLY" | "PROJECT";

/** A written reflection, distinct from an engineering test record. */
export interface Review {
  id: string;
  type: ReviewType;
  date: string;
  summary: string;
  achievement: string;
  problem: string;
  plan: string;
  relatedProjectId?: string;
}

export type ProjectReview = Review & { type: "PROJECT"; relatedProjectId: string };
