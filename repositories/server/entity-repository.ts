import "server-only";

import type { Prisma } from "@prisma/client";

import { MIGRATION_TABLES } from "@/services/migration/registry";
import type { MigrationCollection, MigrationRelation } from "@/types/migration";

export interface StoredEntity {
  id: string;
  payload: Record<string, unknown> | null;
  version: number;
  updatedAt: Date;
  columns: Record<string, unknown>;
}

/** All identifiers come from the compile-time registry, never from a request value. */
function quote(value: string): string {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(value)) throw new Error("Invalid entity column.");
  return `"${value}"`;
}

function table(collection: MigrationCollection): string {
  return quote(MIGRATION_TABLES[collection].table);
}

function placeholder(collection: MigrationCollection, field: string, position: number): string {
  const parameter = `$${position}`;
  const spec = MIGRATION_TABLES[collection];
  // Entity columns are TIMESTAMP WITHOUT TIME ZONE; store the UTC wall time
  // explicitly so the PostgreSQL session time zone cannot shift a Date value.
  if (field === "updatedAt") return `(${parameter}::timestamptz AT TIME ZONE 'UTC')`;
  if (["payload", "relationRefs"].includes(field)) return `${parameter}::jsonb`;
  if (spec.dateFields?.includes(field)) return `${parameter}::date`;
  if (field === "amount") return `${parameter}::numeric(20,2)`;
  if (collection === "reviews" && field === "type") return `${parameter}::"ReviewType"`;
  return parameter;
}

function structuredValues(collection: MigrationCollection, payload: Record<string, unknown>): unknown[] {
  return MIGRATION_TABLES[collection].fields.map((field) => {
    const value = payload[field];
    if (value === undefined || value === "" && MIGRATION_TABLES[collection].dateFields?.includes(field)) return null;
    if (field === "amount" && typeof value === "number") return value.toString();
    return value;
  });
}

export async function listEntities(
  tx: Prisma.TransactionClient, workspaceId: string, collection: MigrationCollection,
): Promise<StoredEntity[]> {
  return tx.$queryRawUnsafe<StoredEntity[]>(
    `SELECT "id", "payload", "version", "updatedAt", to_jsonb(t) AS "columns"
      FROM ${table(collection)} AS t WHERE "workspaceId" = $1 ORDER BY "id"`, workspaceId,
  );
}

export async function findEntity(
  tx: Prisma.TransactionClient, workspaceId: string, collection: MigrationCollection, id: string,
): Promise<StoredEntity | null> {
  const rows = await tx.$queryRawUnsafe<StoredEntity[]>(
    `SELECT "id", "payload", "version", "updatedAt", to_jsonb(t) AS "columns"
      FROM ${table(collection)} AS t WHERE "workspaceId" = $1 AND "id" = $2`, workspaceId, id,
  );
  return rows[0] ?? null;
}

export async function insertEntity(
  tx: Prisma.TransactionClient, workspaceId: string, collection: MigrationCollection,
  payload: Record<string, unknown>, relations: MigrationRelation[], now: Date,
): Promise<StoredEntity> {
  const fields = MIGRATION_TABLES[collection].fields;
  const columns = ["id", "workspaceId", "payload", "relationRefs", ...fields, "updatedAt"];
  const values: unknown[] = [payload.id, workspaceId, JSON.stringify(payload), JSON.stringify(relations),
    ...structuredValues(collection, payload), now];
  await tx.$executeRawUnsafe(
    `INSERT INTO ${table(collection)} (${columns.map(quote).join(", ")})
      VALUES (${columns.map((field, index) => placeholder(collection, field, index + 1)).join(", ")})`, ...values,
  );
  const row = await findEntity(tx, workspaceId, collection, String(payload.id));
  if (!row) throw new Error("Inserted entity could not be read back.");
  return row;
}

export async function updateEntity(
  tx: Prisma.TransactionClient, workspaceId: string, collection: MigrationCollection,
  id: string, version: number, payload: Record<string, unknown>, relations: MigrationRelation[], now: Date,
): Promise<StoredEntity | null> {
  const fields = MIGRATION_TABLES[collection].fields;
  const columns = ["payload", "relationRefs", ...fields, "updatedAt"];
  const values: unknown[] = [JSON.stringify(payload), JSON.stringify(relations),
    ...structuredValues(collection, payload), now, workspaceId, id, version];
  const assignments = columns.map((field, index) =>
    `${quote(field)} = ${placeholder(collection, field, index + 1)}`);
  const changed = await tx.$executeRawUnsafe(
    `UPDATE ${table(collection)} SET ${assignments.join(", ")}, "version" = "version" + 1
      WHERE "workspaceId" = $${columns.length + 1} AND "id" = $${columns.length + 2}
        AND "version" = $${columns.length + 3}`, ...values,
  );
  return changed ? findEntity(tx, workspaceId, collection, id) : null;
}

export async function deleteEntity(
  tx: Prisma.TransactionClient, workspaceId: string, collection: MigrationCollection,
  id: string, version: number,
): Promise<boolean> {
  const count = await tx.$executeRawUnsafe(
    `DELETE FROM ${table(collection)} WHERE "workspaceId" = $1 AND "id" = $2 AND "version" = $3`,
    workspaceId, id, version,
  );
  return count > 0;
}
