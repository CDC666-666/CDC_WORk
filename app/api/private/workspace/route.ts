import { apiFailure, privateJson } from "@/lib/server/api-response";
import { requirePrivateApi } from "@/lib/server/private-api";
import { serverWorkspaceEntityService } from "@/services/server/workspace-entity-service";

export async function GET() {
  try {
    const { workspaceId } = await requirePrivateApi();
    return privateJson(await serverWorkspaceEntityService.snapshot(workspaceId));
  } catch (cause: unknown) { return apiFailure(cause); }
}
