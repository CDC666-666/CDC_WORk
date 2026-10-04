import type { NextRequest } from "next/server";

import { ApiError, apiFailure, privateJson, readJsonObject } from "@/lib/server/api-response";
import { assertSameOrigin, requirePrivateApi } from "@/lib/server/private-api";
import { parseEntityCollection, serverWorkspaceEntityService } from "@/services/server/workspace-entity-service";

function versionOf(value: unknown): number {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 1) {
    throw new ApiError(400, "必须提供有效的记录版本。");
  }
  return value;
}

export async function PATCH(request: NextRequest, { params }: {
  params: Promise<{ collection: string; id: string }>;
}) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const { collection: name, id } = await params;
    const body = await readJsonObject(request);
    return privateJson(await serverWorkspaceEntityService.update(workspaceId,
      parseEntityCollection(name), id, versionOf(body.version), body.item));
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function DELETE(request: NextRequest, { params }: {
  params: Promise<{ collection: string; id: string }>;
}) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const { collection: name, id } = await params;
    const body = await readJsonObject(request);
    return privateJson(await serverWorkspaceEntityService.delete(workspaceId,
      parseEntityCollection(name), id, versionOf(body.version)));
  } catch (cause: unknown) { return apiFailure(cause); }
}
