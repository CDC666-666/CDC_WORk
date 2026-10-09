import type { NextRequest } from "next/server";

import { apiFailure, privateJson, readJsonObject } from "@/lib/server/api-response";
import { assertSameOrigin, requirePrivateApi } from "@/lib/server/private-api";
import { parseReviewCreate, parseReviewQuery } from "@/services/server/review-input";
import { serverReviewService } from "@/services/server/review-service";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requirePrivateApi();
    const query = parseReviewQuery(request.nextUrl.searchParams);
    return privateJson({ items: await serverReviewService.list(workspaceId, query) });
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const draft = parseReviewCreate(await readJsonObject(request));
    const item = await serverReviewService.create(workspaceId, draft);
    return privateJson({ item }, 201);
  } catch (cause: unknown) { return apiFailure(cause); }
}
