import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, PrismaClient } from "@prisma/client";
import { lastSuccessfulCheckAt, markRefreshFailure, publishSnapshots } from "@/services/experience-snapshot";
import { readWorkspaceExperiences, SnapshotReadError } from "@/services/experience-snapshot-reader";

const EXPECTED_GITHUB_ID = "248133835";
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workplaceRoot = resolve(repositoryRoot, "..");
const outputRoot = resolve(workplaceRoot, "shared-memory", "server-snapshots");

function assertDatabaseTarget(): void {
  if (process.env.ALLOWED_GITHUB_USER_ID !== EXPECTED_GITHUB_ID) {
    throw new SnapshotReadError("GITHUB_ALLOWLIST_MISMATCH");
  }
  let url: URL;
  try { url = new URL(process.env.DATABASE_URL ?? ""); }
  catch { throw new SnapshotReadError("DATABASE_TARGET_REJECTED"); }
  if (!["postgresql:", "postgres:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "5432" ||
    url.pathname !== "/cdc_workspace" ||
    (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public")) {
    throw new SnapshotReadError("DATABASE_TARGET_REJECTED");
  }
}

async function main(): Promise<void> {
  if (process.argv.length !== 2) throw new SnapshotReadError("UNEXPECTED_ARGUMENTS");
  assertDatabaseTarget();
  const prisma = new PrismaClient();
  try {
    const records = await prisma.$transaction(async (reader) => {
      await reader.$executeRaw`SET TRANSACTION READ ONLY`;
      return readWorkspaceExperiences(reader, "cdc_workspace", EXPECTED_GITHUB_ID);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    const result = await publishSnapshots(outputRoot, workplaceRoot, records);
    console.log(JSON.stringify({ status: "ok", ...result,
      output: "shared-memory/server-snapshots/INDEX.md" }));
  } finally { await prisma.$disconnect(); }
}

main().catch(async (cause: unknown) => {
  const code = cause instanceof SnapshotReadError ? cause.code :
    cause instanceof Error && cause.message === "SNAPSHOT_SENSITIVE_CONTENT" ? "SNAPSHOT_SENSITIVE_CONTENT" :
      "SNAPSHOT_FAILED";
  const attemptedAt = new Date().toISOString();
  try { await markRefreshFailure(outputRoot, code, attemptedAt); }
  catch { /* The last complete index and case remain untouched even if status cannot be written. */ }
  const last = await lastSuccessfulCheckAt(outputRoot).catch(() => null);
  console.error(JSON.stringify({ status: "failed", code, lastSuccessfulCheckAt: last }));
  process.exitCode = 1;
});
