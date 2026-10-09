import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, PrismaClient } from "@prisma/client";
import { experienceValidationIssues } from "@/services/engineering-experience-service";
import { sharedCaseKnowledgeId } from "@/services/shared-memory-experience";
import { lastSuccessfulCheckAt, markRefreshFailure, publishSnapshot, SNAPSHOT_SOURCE,
  type SnapshotRecord, type SnapshotState } from "@/services/experience-snapshot";
import type { KnowledgeItem } from "@/types/knowledge";

const EXPECTED_GITHUB_ID = "248133835";
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workplaceRoot = resolve(repositoryRoot, "..");
const outputRoot = resolve(workplaceRoot, "shared-memory", "server-snapshots");

class SnapshotError extends Error {
  constructor(readonly code: string) { super(code); }
}

function assertDatabaseTarget(): void {
  if (process.env.ALLOWED_GITHUB_USER_ID !== EXPECTED_GITHUB_ID) {
    throw new SnapshotError("GITHUB_ALLOWLIST_MISMATCH");
  }
  let url: URL;
  try { url = new URL(process.env.DATABASE_URL ?? ""); }
  catch { throw new SnapshotError("DATABASE_TARGET_REJECTED"); }
  if (!["postgresql:", "postgres:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "5432" ||
    url.pathname !== "/cdc_workspace" ||
    (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public")) {
    throw new SnapshotError("DATABASE_TARGET_REJECTED");
  }
}

function asExperience(value: unknown): KnowledgeItem & { experience: NonNullable<KnowledgeItem["experience"]> } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new SnapshotError("RECORD_INVALID");
  const item = value as Record<string, unknown>;
  if (item.itemType !== "工程经验" || !item.experience ||
    experienceValidationIssues(item).length) throw new SnapshotError("RECORD_INVALID");
  const detail = item.experience as Record<string, unknown>;
  if (item.sourceType !== "sharedMemory" || item.sourceId !== SNAPSHOT_SOURCE ||
    detail.sourceKey !== SNAPSHOT_SOURCE || typeof detail.sourceRevision !== "string" ||
    !/^[a-f0-9]{64}$/.test(detail.sourceRevision)) throw new SnapshotError("SOURCE_IDENTITY_MISMATCH");
  return value as KnowledgeItem & { experience: NonNullable<KnowledgeItem["experience"]> };
}

async function readState(prisma: Prisma.TransactionClient): Promise<SnapshotState> {
  const database = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  if (database.length !== 1 || database[0].name !== "cdc_workspace") {
    throw new SnapshotError("DATABASE_TARGET_REJECTED");
  }
  const users = await prisma.user.findMany({ where: { githubId: EXPECTED_GITHUB_ID },
    select: { id: true, githubId: true,
      accounts: { where: { provider: "github" }, select: { providerAccountId: true } },
      workspace: { select: { id: true, userId: true } } } });
  if (users.length !== 1 || users[0].githubId !== EXPECTED_GITHUB_ID ||
    users[0].accounts.length !== 1 ||
    users[0].accounts[0].providerAccountId !== EXPECTED_GITHUB_ID ||
    !users[0].workspace || users[0].workspace.userId !== users[0].id ||
    await prisma.workspace.count() !== 1) {
    throw new SnapshotError("WORKSPACE_OWNER_MISMATCH");
  }
  const workspaceId = users[0].workspace.id;
  const expectedId = sharedCaseKnowledgeId(workspaceId);
  const row = await prisma.knowledge.findUnique({ where: { id: expectedId },
    select: { id: true, workspaceId: true, payload: true, sourceType: true, sourceId: true,
      version: true, updatedAt: true } });
  if (!row) return { kind: "retired", reason: "deleted" };
  if (row.workspaceId !== workspaceId || row.sourceType !== "sharedMemory" ||
    row.sourceId !== SNAPSHOT_SOURCE) throw new SnapshotError("SOURCE_IDENTITY_MISMATCH");
  const raw = row.payload;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new SnapshotError("RECORD_INVALID");
  const basic = raw as Record<string, unknown>;
  if (basic.status === "已归档") return { kind: "retired", reason: "archived" };
  if (basic.itemType !== "工程经验") return { kind: "retired", reason: "no-longer-experience" };
  const item = asExperience(raw);
  if (item.id !== expectedId) throw new SnapshotError("SOURCE_IDENTITY_MISMATCH");
  const record: SnapshotRecord = { id: row.id, version: row.version, updatedAt: row.updatedAt, item };
  return { kind: "active", record };
}

async function main(): Promise<void> {
  if (process.argv.length !== 2) throw new SnapshotError("UNEXPECTED_ARGUMENTS");
  assertDatabaseTarget();
  const prisma = new PrismaClient();
  try {
    const state = await prisma.$transaction(async (reader) => {
      await reader.$executeRaw`SET TRANSACTION READ ONLY`;
      return readState(reader);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    const result = await publishSnapshot(outputRoot, workplaceRoot, state);
    console.log(JSON.stringify({ status: "ok", ...result,
      output: "shared-memory/server-snapshots/INDEX.md" }));
  } finally { await prisma.$disconnect(); }
}

main().catch(async (cause: unknown) => {
  const code = cause instanceof SnapshotError ? cause.code :
    cause instanceof Error && cause.message === "SNAPSHOT_SENSITIVE_CONTENT" ? "SNAPSHOT_SENSITIVE_CONTENT" :
      "SNAPSHOT_FAILED";
  const attemptedAt = new Date().toISOString();
  try { await markRefreshFailure(outputRoot, code, attemptedAt); }
  catch { /* The last complete index and case remain untouched even if status cannot be written. */ }
  const last = await lastSuccessfulCheckAt(outputRoot).catch(() => null);
  console.error(JSON.stringify({ status: "failed", code, lastSuccessfulCheckAt: last }));
  process.exitCode = 1;
});
