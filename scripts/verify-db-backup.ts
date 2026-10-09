import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { readWorkspaceExperiences } from "../services/experience-snapshot-reader";

const sourceName = "cdc_workspace";
const allowedGithubId = process.env.ALLOWED_GITHUB_USER_ID;

interface IdentityRow {
  database: string;
  role: string;
  serverVersion: string;
  timezone: string;
  dataDirectory: string;
}

interface TableFingerprint {
  count: number;
  primaryKeyColumns: string[];
  primaryKeySha256: string | null;
  rowsSha256: string;
}

interface ExperienceFingerprint {
  id: string;
  version: number;
  payloadSha256: string;
  reviewStatus: string;
  evidenceStatus: string;
  sourceType: string;
  sourceId: string | null;
  updatedAt: string;
}

interface DatabaseFingerprint {
  capturedAt: string;
  identity: IdentityRow;
  owner: { userId: string; workspaceId: string; githubId: string };
  tables: Record<string, TableFingerprint>;
  migrations: Array<{ migrationName: string; checksum: string; finishedAt: string | null }>;
  experiences: ExperienceFingerprint[];
}

interface TableRow {
  tablename: string;
}

interface PrimaryKeyRow {
  table_name: string;
  column_name: string;
}

interface HashedRow {
  pk: string;
  row_hash: string;
}

interface MigrationRow {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function checkPrivatePath(path: string): string {
  const absolute = resolve(path);
  if (!isAbsolute(path) || !relative(process.cwd(), absolute).startsWith(`..${sep}`)) {
    throw new Error("Manifest path must be absolute and outside the code worktree");
  }
  return absolute;
}

function databaseUrl(name: string): string {
  const configured = process.env.DATABASE_URL;
  if (!configured || !allowedGithubId || !/^\d+$/.test(allowedGithubId)) {
    throw new Error("Source connection or allowed GitHub ID is not configured");
  }
  const url = new URL(configured);
  if (url.protocol !== "postgresql:" || !["localhost", "127.0.0.1"].includes(url.hostname) ||
      url.port !== "5432" || url.pathname !== `/${sourceName}` || !url.username || !url.password) {
    throw new Error("Source connection must be the local personal development database");
  }
  url.pathname = `/${name}`;
  return url.toString();
}

async function inspect(name: string): Promise<DatabaseFingerprint> {
  if (!allowedGithubId) throw new Error("Allowed GitHub ID is not configured");
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl(name) } } });
  let stage = "connect";
  try {
    return await client.$transaction(async (tx) => {
      stage = "read-only transaction";
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      stage = "database identity";
      const identity = await tx.$queryRaw<IdentityRow[]>`
        SELECT current_database() AS database, current_user AS role,
          current_setting('server_version') AS "serverVersion",
          current_setting('TimeZone') AS timezone,
          current_setting('data_directory') AS "dataDirectory"`;
      if (identity.length !== 1 || identity[0].database !== name) throw new Error("Database identity mismatch");

      stage = "account ownership";
      const users = await tx.user.findMany({ where: { githubId: allowedGithubId }, select: {
        id: true, githubId: true,
        accounts: { where: { provider: "github" }, select: { providerAccountId: true } },
        workspace: { select: { id: true, userId: true } },
      } });
      if (users.length !== 1 || users[0].githubId !== allowedGithubId ||
          users[0].accounts.length !== 1 || users[0].accounts[0].providerAccountId !== allowedGithubId ||
          !users[0].workspace || users[0].workspace.userId !== users[0].id) {
        throw new Error("GitHub Account, User, and Workspace ownership mismatch");
      }
      const owner = { userId: users[0].id, workspaceId: users[0].workspace.id, githubId: allowedGithubId };

      stage = "table inventory";
      const tableRows = await tx.$queryRaw<TableRow[]>`
        SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
      const keyRows = await tx.$queryRaw<PrimaryKeyRow[]>`
        SELECT constraint_info.table_name, key_info.column_name
        FROM information_schema.table_constraints AS constraint_info
        JOIN information_schema.key_column_usage AS key_info
          ON constraint_info.constraint_name = key_info.constraint_name
          AND constraint_info.table_schema = key_info.table_schema
          AND constraint_info.table_name = key_info.table_name
        WHERE constraint_info.table_schema = 'public'
          AND constraint_info.constraint_type = 'PRIMARY KEY'
        ORDER BY constraint_info.table_name, key_info.ordinal_position`;
      const tables: Record<string, TableFingerprint> = {};
      for (const { tablename } of tableRows) {
        stage = `table fingerprint ${tablename}`;
        const columns = keyRows.filter((row) => row.table_name === tablename).map((row) => row.column_name);
        const rowHash = "encode(sha256(convert_to(row_to_json(t)::text, 'UTF8')), 'hex')";
        // VerificationToken has a composite unique constraint but no declared primary key.
        // Hash its complete row as a stable sort key without inventing a database PK.
        const pk = columns.length > 0 ?
          `json_build_array(${columns.map((column) => `t.${quoteIdentifier(column)}`).join(", ")})::text` :
          rowHash;
        const rows = await tx.$queryRawUnsafe<HashedRow[]>(
          `SELECT ${pk} AS pk, ${rowHash} AS row_hash ` +
          `FROM public.${quoteIdentifier(tablename)} AS t`,
        );
        rows.sort((left, right) => left.pk.localeCompare(right.pk));
        tables[tablename] = {
          count: rows.length,
          primaryKeyColumns: columns,
          primaryKeySha256: columns.length > 0 ? sha256(rows.map((row) => row.pk).join("\n")) : null,
          rowsSha256: sha256(rows.map((row) => `${row.pk}\t${row.row_hash}`).join("\n")),
        };
      }

      stage = "Prisma migrations";
      const migrationRows = await tx.$queryRaw<MigrationRow[]>`
        SELECT migration_name, checksum, finished_at
        FROM "_prisma_migrations" ORDER BY started_at, id`;
      const migrations = migrationRows.map((row) => ({
        migrationName: row.migration_name,
        checksum: row.checksum,
        finishedAt: row.finished_at?.toISOString() ?? null,
      }));
      stage = "application experience reader";
      const records = await readWorkspaceExperiences(tx, name, allowedGithubId);
      const experiences = records.map(({ id, version, item, updatedAt }) => ({
        id, version, payloadSha256: sha256(JSON.stringify(item)),
        reviewStatus: item.experience.reviewStatus,
        evidenceStatus: item.experience.evidenceStatus,
        sourceType: item.sourceType,
        sourceId: item.sourceId ?? null,
        updatedAt: updatedAt.toISOString(),
      }));
      return { capturedAt: new Date().toISOString(), identity: identity[0], owner,
        tables, migrations, experiences };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 120_000 });
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code :
      error instanceof Error ? error.name : "Unknown";
    throw new Error(`Database inspection failed at ${stage} (${code})`);
  } finally {
    await client.$disconnect();
  }
}

function comparable(manifest: DatabaseFingerprint): string {
  return JSON.stringify({ owner: manifest.owner, tables: manifest.tables,
    migrations: manifest.migrations, experiences: manifest.experiences });
}

async function main(): Promise<void> {
  const [mode, manifestArgument, targetName, resultArgument] = process.argv.slice(2);
  if (!manifestArgument || !["baseline", "verify"].includes(mode)) {
    throw new Error("Usage: verify-db-backup.ts baseline <private-manifest.json> | verify <private-manifest.json> <new-restore-db-name> <private-result.json>");
  }
  const manifestPath = checkPrivatePath(manifestArgument);
  if (mode === "verify" && (!targetName || !/^cdc_workspace_restore_drill_\d{8}_\d{6}$/.test(targetName) ||
      targetName === sourceName || !resultArgument)) {
    throw new Error("Explicit new restore database and private result path required");
  }
  const source = await inspect(sourceName);
  if (mode === "baseline") {
    await writeFile(manifestPath, JSON.stringify(source, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    console.log(`Baseline: ${source.identity.database}, PostgreSQL ${source.identity.serverVersion}, ` +
      `${Object.keys(source.tables).length} tables, ${source.migrations.length} migrations, ` +
      `${source.experiences.length} active experience(s). Manifest saved privately.`);
    for (const record of source.experiences) {
      console.log(`Experience ${record.id}: version ${record.version}, ${record.reviewStatus}, ` +
        `${record.evidenceStatus}, payload SHA-256 ${record.payloadSha256}`);
    }
    return;
  }
  if (!targetName || !resultArgument) throw new Error("Restore target and result path required");
  const baseline = JSON.parse(await readFile(manifestPath, "utf8")) as DatabaseFingerprint;
  if (baseline.identity.database !== sourceName || baseline.owner.githubId !== allowedGithubId ||
      Object.keys(baseline.tables).length === 0) throw new Error("Baseline manifest identity mismatch");
  const restored = await inspect(targetName);
  const sourceUnchanged = baseline.identity.database === source.identity.database &&
    baseline.identity.dataDirectory === source.identity.dataDirectory &&
    baseline.identity.role === source.identity.role && comparable(baseline) === comparable(source);
  const restoreMatches = restored.identity.database === targetName &&
    restored.identity.dataDirectory === source.identity.dataDirectory &&
    comparable(baseline) === comparable(restored);
  const result = {
    checkedAt: new Date().toISOString(), baselineCapturedAt: baseline.capturedAt,
    sourceDatabase: sourceName, restoredDatabase: targetName,
    sourceUnchanged, restoreMatches,
    tableCount: Object.keys(source.tables).length,
    sourceTableCounts: Object.fromEntries(Object.entries(source.tables).map(([name, table]) => [name, table.count])),
    restoredTableCounts: Object.fromEntries(Object.entries(restored.tables).map(([name, table]) => [name, table.count])),
    sourceMigrationCount: source.migrations.length,
    restoredMigrationCount: restored.migrations.length,
    sourceExperienceCount: source.experiences.length,
    restoredExperienceCount: restored.experiences.length,
    mismatchedTables: Object.keys(baseline.tables).filter((name) =>
      JSON.stringify(baseline.tables[name]) !== JSON.stringify(restored.tables[name])),
  };
  await writeFile(checkPrivatePath(resultArgument), JSON.stringify(result, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  console.log(`Read-only comparison: ${result.tableCount} tables, ${result.sourceMigrationCount} migrations, ` +
    `${result.sourceExperienceCount} active experience(s); source unchanged=${sourceUnchanged}, ` +
    `restore matches=${restoreMatches}.`);
  if (!sourceUnchanged || !restoreMatches) throw new Error("Backup rehearsal comparison failed; see private result manifest");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  // Database driver errors can contain connection strings. Emit only a bounded category.
  console.error(message.startsWith("Database inspection failed") || message.startsWith("Backup rehearsal") ?
    message : "Backup verification failed; inspect locally without publishing raw database errors.");
  process.exitCode = 1;
});
