import { apiFailure, privateJson } from "@/lib/server/api-response";
import { requirePrivateApi } from "@/lib/server/private-api";
import { readMigrationResult } from "@/services/migration/migration-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requirePrivateApi();
    const { id } = await context.params;
    return privateJson({ result: await readMigrationResult(workspaceId, id) });
  } catch (error: unknown) { return apiFailure(error); }
}
