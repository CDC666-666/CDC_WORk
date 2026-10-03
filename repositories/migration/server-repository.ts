import "server-only";

import type { Prisma } from "@prisma/client";

import { MIGRATION_TABLES } from "@/services/migration/registry";
import type { MigrationEntity, MigrationCollection } from "@/types/migration";
import { canonicalJson } from "@/services/migration/preflight";

export interface ExistingMigrationRow {
  payload: unknown | null;
  sourceHash: string | null;
  version: number | null;
  updatedAt: Date | null;
}

/** SQL identifiers come solely from the compile-time registry, never from an HTTP argument. */
function quote(identifier: string): string {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(identifier)) throw new Error("Migration SQL identifier is invalid.");
  return `"${identifier}"`;
}

export async function readMigrationRow(
  tx: Prisma.TransactionClient, workspaceId: string, collection: MigrationCollection, id: string,
): Promise<ExistingMigrationRow | null> {
  const table = quote(MIGRATION_TABLES[collection].table);
  const version = collection === "reviews" ? '"version"' : "NULL::integer";
  const updatedAt = collection === "projects" || collection === "reviews" ? '"updatedAt"' : "NULL::timestamp";
  const rows = await tx.$queryRawUnsafe<ExistingMigrationRow[]>(
    `SELECT "payload", "sourceHash", ${version} AS "version", ${updatedAt} AS "updatedAt"
      FROM ${table} WHERE "workspaceId" = $1 AND "id" = $2`, workspaceId, id,
  );
  return rows[0] ?? null;
}

export async function insertMigrationRow(
  tx: Prisma.TransactionClient, workspaceId: string, batchId: string, entity: MigrationEntity, sourceHash: string,
): Promise<ExistingMigrationRow> {
  const spec = MIGRATION_TABLES[entity.collection];
  const needsUpdatedAt = entity.collection === "projects" || entity.collection === "reviews";
  const columns = ["id", "workspaceId", "payload", "sourceHash", "migrationBatchId", "relationRefs",
    ...spec.fields, ...(needsUpdatedAt ? ["updatedAt"] : [])];
  const values: unknown[] = [entity.id, workspaceId, JSON.stringify(entity.payload), sourceHash,
    batchId, JSON.stringify(entity.relations)];
  for (const field of spec.fields) {
    const value = entity.payload[field];
    values.push(value === undefined || (spec.dateFields?.includes(field) && value === "") ? null :
      field === "amount" && typeof value === "number" ? value.toString() : value);
  }
  if (needsUpdatedAt) values.push(new Date());
  const placeholders = columns.map((field, index) => {
    const parameter = `$${index + 1}`;
    if (field === "payload" || field === "relationRefs") return `${parameter}::jsonb`;
    if (spec.dateFields?.includes(field)) return `${parameter}::date`;
    if (field === "amount") return `${parameter}::numeric(20,2)`;
    if (entity.collection === "reviews" && field === "type") return `${parameter}::"ReviewType"`;
    return parameter;
  });
  await tx.$executeRawUnsafe(
    `INSERT INTO ${quote(spec.table)} (${columns.map(quote).join(", ")}) VALUES (${placeholders.join(", ")})`,
    ...values,
  );
  const row = await readMigrationRow(tx, workspaceId, entity.collection, entity.id);
  if (!row) throw new Error(`Inserted ${entity.collection}:${entity.id} was not found for verification.`);
  return row;
}

export async function countRowsFromBatch(
  tx: Prisma.TransactionClient, workspaceId: string, batchId: string, collection: MigrationCollection,
): Promise<number> {
  const rows = await tx.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*)::integer AS "count" FROM ${quote(MIGRATION_TABLES[collection].table)}
      WHERE "workspaceId" = $1 AND "migrationBatchId" = $2`, workspaceId, batchId,
  );
  return rows[0]?.count ?? 0;
}

export async function verifyMigrationRow(
  tx: Prisma.TransactionClient, workspaceId: string, entity: MigrationEntity, sourceHash: string,
): Promise<void> {
  const stored = await readMigrationRow(tx, workspaceId, entity.collection, entity.id);
  if (!stored || stored.sourceHash !== sourceHash || canonicalJson(stored.payload) !== canonicalJson(entity.payload)) {
    throw new Error(`迁移核对失败：${entity.collection}:${entity.id} 的完整内容不一致。`);
  }
  const spec = MIGRATION_TABLES[entity.collection];
  const checkedFields = ["status", "deadline", "amount", "isFavorite", "isInKnowledgeBase", "isInStudyPlan",
    ...(spec.dateFields ?? [])].filter((field) => spec.fields.includes(field));
  if (!checkedFields.length) return;
  const select = checkedFields.map((field) => `${quote(field)}::text AS ${quote(field)}`).join(", ");
  const rows = await tx.$queryRawUnsafe<Array<Record<string, string | null>>>(
    `SELECT ${select} FROM ${quote(spec.table)} WHERE "workspaceId" = $1 AND "id" = $2`,
    workspaceId, entity.id,
  );
  const row = rows[0];
  if (!row) throw new Error(`迁移核对失败：${entity.collection}:${entity.id} 未找到。`);
  for (const field of checkedFields) {
    const value = entity.payload[field];
    const expected = value === undefined || value === null || value === "" ? null :
      field === "amount" && typeof value === "number" ?
        `${value.toString().split(".")[0]}.${(value.toString().split(".")[1] ?? "").padEnd(2, "0")}` : String(value);
    if (row[field] !== expected) throw new Error(`迁移核对失败：${entity.collection}:${entity.id} 的 ${field} 不一致。`);
  }
}
