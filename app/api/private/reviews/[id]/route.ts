import type { NextRequest } from "next/server";

import { apiFailure, privateJson, readJsonObject } from "@/lib/server/api-response";
import { assertSameOrigin, parseVersionHeader, requirePrivateApi } from "@/lib/server/private-api";
import { parseReviewPatch } from "@/services/server/review-input";
import { serverReviewService } from "@/services/server/review-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { workspaceId } = await requirePrivateApi();
    const { id } = await context.params;
    return privateJson({ item: await serverReviewService.get(workspaceId, id) });
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const { id } = await context.params;
    const patch = parseReviewPatch(await readJsonObject(request));
    return privateJson({ item: await serverReviewService.update(workspaceId, id, patch) });
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const { id } = await context.params;
    await serverReviewService.delete(workspaceId, id, parseVersionHeader(request));
    return privateJson({ deleted: true });
  } catch (cause: unknown) { return apiFailure(cause); }
}
