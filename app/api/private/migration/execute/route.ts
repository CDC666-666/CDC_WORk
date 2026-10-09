import type { NextRequest } from "next/server";

import { ApiError, apiFailure, privateJson } from "@/lib/server/api-response";
import { assertSameOrigin, requirePrivateApi } from "@/lib/server/private-api";
import { executeMigration } from "@/services/migration/migration-service";
import { readMigrationRequest } from "@/services/migration/request";

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const { raw, includeIds, previewDigest } = await readMigrationRequest(request);
    if (!previewDigest) throw new ApiError(400, "请先预览并提供校验值。");
    return privateJson({ result: await executeMigration(workspaceId, raw, includeIds, previewDigest) });
  } catch (error: unknown) { return apiFailure(error); }
}
