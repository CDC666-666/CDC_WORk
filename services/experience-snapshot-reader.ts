import type { Prisma } from "@prisma/client";
import { experienceValidationIssues } from "@/services/engineering-experience-service";
import type { SnapshotRecord } from "@/services/experience-snapshot";
import type { KnowledgeItem } from "@/types/knowledge";

export class SnapshotReadError extends Error {
  constructor(readonly code: string) { super(code); }
}

interface KnowledgeRow {
  id: string;
  workspaceId: string;
  payload: unknown;
  sourceType: string | null;
  sourceId: string | null;
  version: number;
  updatedAt: Date;
}

function asExperience(row: KnowledgeRow, workspaceId: string): SnapshotRecord {
  const value = row.payload;
  if (row.workspaceId !== workspaceId || !value || typeof value !== "object" || Array.isArray(value)) {
    throw new SnapshotReadError("RECORD_INVALID");
  }
  const item = value as Record<string, unknown>;
  // Source metadata may be absent in an older or manually entered experience;
  // represent that absence explicitly instead of manufacturing provenance.
  const issues = experienceValidationIssues(item).filter((issue) => issue !== "共享来源标识与摘要不完整");
  const detail = item.experience as Record<string, unknown> | undefined;
  if (item.sourceType === "sharedMemory" && detail?.sourceKey && detail.sourceKey !== item.sourceId) {
    throw new SnapshotReadError("SOURCE_IDENTITY_MISMATCH");
  }
  if (item.id !== row.id || item.itemType !== "工程经验" || item.status === "已归档" ||
    item.sourceType !== row.sourceType || (item.sourceId ?? null) !== row.sourceId || issues.length) {
    throw new SnapshotReadError("RECORD_INVALID");
  }
  return { id: row.id, version: row.version, updatedAt: row.updatedAt,
    item: value as KnowledgeItem & { experience: NonNullable<KnowledgeItem["experience"]> } };
}

/** Call inside a repeatable-read, read-only transaction. No token or session columns are selected. */
export async function readWorkspaceExperiences(tx: Prisma.TransactionClient,
  expectedDatabase: string, expectedGithubId: string): Promise<SnapshotRecord[]> {
  const database = await tx.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (database.length !== 1 || database[0].name !== expectedDatabase) {
    throw new SnapshotReadError("DATABASE_TARGET_REJECTED");
  }
  const users = await tx.user.findMany({ where: { githubId: expectedGithubId },
    select: { id: true, githubId: true,
      accounts: { where: { provider: "github" }, select: { providerAccountId: true } },
      workspace: { select: { id: true, userId: true } } } });
  if (users.length !== 1 || users[0].githubId !== expectedGithubId ||
    users[0].accounts.length !== 1 || users[0].accounts[0].providerAccountId !== expectedGithubId ||
    !users[0].workspace || users[0].workspace.userId !== users[0].id) {
    throw new SnapshotReadError("WORKSPACE_OWNER_MISMATCH");
  }
  const workspaceId = users[0].workspace.id;
  const rows = await tx.$queryRaw<KnowledgeRow[]>`
    SELECT "id", "workspaceId", "payload", "sourceType", "sourceId", "version", "updatedAt"
    FROM "Knowledge"
    WHERE "workspaceId" = ${workspaceId}
      AND "payload"->>'itemType' = '工程经验'
      AND "payload"->>'status' IS DISTINCT FROM '已归档'
    ORDER BY "id"`;
  return rows.map((row) => asExperience(row, workspaceId));
}
