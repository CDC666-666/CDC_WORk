import type { NextRequest } from "next/server";

import { apiFailure, privateJson, readJsonObject } from "@/lib/server/api-response";
import { assertSameOrigin, requirePrivateApi } from "@/lib/server/private-api";
import { parseEntityCollection, serverWorkspaceEntityService } from "@/services/server/workspace-entity-service";

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ collection: string }>;
}) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const collection = parseEntityCollection((await params).collection);
    const body = await readJsonObject(request);
    const result = await serverWorkspaceEntityService.create(workspaceId, collection, body.item);
    return privateJson(result, 201);
  } catch (cause: unknown) { return apiFailure(cause); }
}
