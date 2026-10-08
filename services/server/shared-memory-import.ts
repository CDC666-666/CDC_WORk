import "server-only";

import { ApiError } from "@/lib/server/api-response";
import { serverWorkspaceEntityService } from "@/services/server/workspace-entity-service";
import { AUTO_AIM_CASE_SOURCE, parseAutoAimCase } from "@/services/shared-memory-experience";

export interface SharedCaseImportResult {
  result: "created" | "already_exists";
  id: string;
  version: number | undefined;
  sourceChanged: boolean;
}

/** Explicit one-case import. Existing server edits are never overwritten by a source file. */
export async function importAutoAimCase(workspaceId: string, markdown: string): Promise<SharedCaseImportResult> {
  const item = parseAutoAimCase(markdown, workspaceId);
  const existingResult = async (): Promise<SharedCaseImportResult> => {
    const existing = await serverWorkspaceEntityService.get(workspaceId, "knowledge", item.id);
    if (existing.item?.sourceId !== AUTO_AIM_CASE_SOURCE) throw new Error("稳定 ID 已被其他记录占用");
    const detail = existing.item.experience as { sourceRevision?: string } | undefined;
    return { result: "already_exists", id: item.id, version: existing.version,
      sourceChanged: detail?.sourceRevision !== item.experience?.sourceRevision };
  };
  try { return await existingResult(); }
  catch (cause: unknown) { if (!(cause instanceof ApiError) || cause.status !== 404) throw cause; }
  try {
    const created = await serverWorkspaceEntityService.create(workspaceId, "knowledge", item);
    return { result: "created", id: created.id, version: created.version, sourceChanged: false };
  } catch (cause: unknown) {
    if (!(cause instanceof ApiError) || cause.status !== 409) throw cause;
    return existingResult();
  }
}
