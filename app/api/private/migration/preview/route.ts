import type { NextRequest } from "next/server";

import { apiFailure, privateJson } from "@/lib/server/api-response";
import { assertSameOrigin, requirePrivateApi } from "@/lib/server/private-api";
import { previewMigration } from "@/services/migration/migration-service";
import { readMigrationRequest } from "@/services/migration/request";

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const { raw, includeIds } = await readMigrationRequest(request);
    return privateJson({ preview: await previewMigration(workspaceId, raw, includeIds) });
  } catch (error: unknown) { return apiFailure(error); }
}
