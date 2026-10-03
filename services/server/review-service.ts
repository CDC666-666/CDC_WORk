import { serverReviewRepository } from "@/repositories/server/review-repository";
import { createServerReviewService } from "@/services/server/review-domain";

export const serverReviewService = createServerReviewService(serverReviewRepository);
