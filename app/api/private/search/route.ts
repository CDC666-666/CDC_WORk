import type { NextRequest } from "next/server";
import { ApiError, apiFailure, privateJson } from "@/lib/server/api-response";
import { requirePrivateApi } from "@/lib/server/private-api";
import { searchServerWorkspace } from "@/services/server/global-search";
import { serverWorkspaceEntityService } from "@/services/server/workspace-entity-service";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requirePrivateApi();
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q")?.trim() ?? "";
    if (query.length > 100) throw new ApiError(400, "搜索词不能超过 100 字符。");
    if (!query) return privateJson({ results: [] });
    const filters = { type: searchParams.get("type") || undefined,
      projectId: searchParams.get("projectId") || undefined, tag: searchParams.get("tag") || undefined };
    if (Object.values(filters).some((value) => value && value.length > 100)) throw new ApiError(400, "筛选条件过长。");
    const snapshot = await serverWorkspaceEntityService.snapshot(workspaceId);
    return privateJson({ results: searchServerWorkspace(snapshot, query, filters) });
  } catch (cause: unknown) { return apiFailure(cause); }
}
