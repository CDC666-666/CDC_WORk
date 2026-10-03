import "server-only";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";

import { ApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { countRowsFromBatch, insertMigrationRow, readMigrationRow, verifyMigrationRow } from "@/repositories/migration/server-repository";
import { canonicalJson, prepareRawMigration, type PreparedMigration } from "@/services/migration/preflight";
import { MIGRATION_COLLECTIONS, RAW_STORAGE_KEYS, type MigrationCollection, type MigrationCollectionCount,
  type MigrationEntity, type MigrationIssue, type MigrationPreview, type MigrationResult,
  type RawBrowserSnapshot } from "@/types/migration";

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

const keyOf = (entity: Pick<MigrationEntity, "collection" | "id">): string => `${entity.collection}:${entity.id}`;
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export function parseRawMigrationInput(value: unknown): RawBrowserSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "迁移来源必须是原始存储键对象。");
  const source = value as Record<string, unknown>;
  if (Object.keys(source).some((key) => !RAW_STORAGE_KEYS.includes(key as typeof RAW_STORAGE_KEYS[number]))) {
    throw new ApiError(400, "迁移来源包含不支持的存储键。");
  }
  return Object.fromEntries(RAW_STORAGE_KEYS.map((key) => {
    const raw = source[key] ?? null;
    if (raw !== null && typeof raw !== "string") throw new ApiError(400, `${key} 必须是原始字符串或 null。`);
    return [key, raw];
  })) as RawBrowserSnapshot;
}

export function parseIncludeIds(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 10_000 || value.some((item) => typeof item !== "string" || item.length > 300)) {
    throw new ApiError(400, "待迁移记录选择列表无效。");
  }
  return [...new Set(value as string[])].sort();
}

function prepare(raw: RawBrowserSnapshot): PreparedMigration {
  try { return prepareRawMigration(raw); }
  catch (error: unknown) {
    throw new ApiError(422, `原始快照预检查失败：${error instanceof Error ? error.message : "格式异常"}`);
  }
}

type Disposition = "write" | "skip" | "conflict" | "pending";
type Planning = {
  preview: MigrationPreview;
  entities: MigrationEntity[];
  disposition: Map<string, Disposition>;
  hashes: Map<string, string>;
};

async function plan(
  tx: Prisma.TransactionClient, workspaceId: string, raw: RawBrowserSnapshot, includeIds: string[],
): Promise<Planning> {
  const prepared = prepare(raw);
  const ids = new Set(prepared.entities.map(keyOf));
  for (const key of includeIds) if (!ids.has(key)) throw new ApiError(400, `选择项 ${key} 不在来源数据中。`);
  const include = new Set(includeIds);
  const sourceFingerprint = sha256(raw);
  const planFingerprint = sha256(includeIds);
  const issues: MigrationIssue[] = [...prepared.issues];
  const counts = Object.fromEntries(MIGRATION_COLLECTIONS.map((collection) => [collection,
    { source: 0, written: 0, skipped: 0, conflict: 0, pending: 0 }])) as Record<MigrationCollection, MigrationCollectionCount>;
  const maps = await tx.migrationEntityMap.findMany({ where: { workspaceId } });
  const mapped = new Map(maps.map((item) => [`${item.collection}:${item.sourceId}`, item]));
  const disposition = new Map<string, Disposition>();
  const hashes = new Map<string, string>();
  for (const entity of prepared.entities) {
    const key = keyOf(entity);
    counts[entity.collection].source++;
    const hash = sha256(entity.payload);
    hashes.set(key, hash);
    if (entity.reasons.length || (entity.origin === "NEEDS_REVIEW" && !include.has(key))) {
      disposition.set(key, "pending");
      if (!entity.reasons.length) issues.push({ collection: entity.collection, sourceId: entity.id,
        code: "AMBIGUOUS", message: "内置演示 ID 的内容已变化；需人工确认是否迁入。" });
      continue;
    }
    if (entity.origin === "DEMO" && !include.has(key)) {
      disposition.set(key, "skip");
      continue;
    }
    const map = mapped.get(key);
    const row = await readMigrationRow(tx, workspaceId, entity.collection, entity.id);
    if (map) {
      let typedFieldsChanged = false;
      if (row) {
        try { await verifyMigrationRow(tx, workspaceId, entity, hash); }
        catch { typedFieldsChanged = true; }
      }
      if (map.sourceHash !== hash || !row || row.sourceHash !== hash ||
        canonicalJson(row.payload) !== canonicalJson(entity.payload) ||
        typedFieldsChanged ||
        (map.serverVersion !== null && row.version !== map.serverVersion) ||
        (map.serverUpdatedAt && row.updatedAt?.getTime() !== map.serverUpdatedAt.getTime())) {
        disposition.set(key, "conflict");
        issues.push({ collection: entity.collection, sourceId: entity.id, code: "SERVER_CONFLICT",
          message: "来源内容变化、服务器记录已修改或映射目标缺失；不会覆盖。" });
      } else disposition.set(key, "skip");
    } else if (row) {
      disposition.set(key, "conflict");
      issues.push({ collection: entity.collection, sourceId: entity.id, code: "SERVER_CONFLICT",
        message: "服务器已有相同 ID，但没有迁移映射；不会覆盖。" });
    } else disposition.set(key, "write");
  }

  // A dependent record cannot be written when its source parent is skipped or unresolved.
  let changed = true;
  while (changed) {
    changed = false;
    for (const entity of prepared.entities) {
      const key = keyOf(entity);
      if (disposition.get(key) !== "write") continue;
      const blocked = entity.relations.find((relation) => {
        const parentKey = `${relation.collection}:${relation.id}`;
        const parentStatus = disposition.get(parentKey);
        return parentStatus !== "write" && !(parentStatus === "skip" && mapped.has(parentKey));
      });
      if (blocked) {
        disposition.set(key, "pending"); changed = true;
        issues.push({ collection: entity.collection, sourceId: entity.id, code: "BROKEN_REFERENCE",
          message: `${blocked.field} 的来源目标 ${blocked.collection}:${blocked.id} 未计划写入。` });
      }
    }
  }
  for (const entity of prepared.entities) {
    const count = counts[entity.collection];
    const status = disposition.get(keyOf(entity));
    if (status === "write") count.written++;
    else if (status === "skip") count.skipped++;
    else if (status === "conflict") count.conflict++;
    else count.pending++;
  }
  const base = { sourceKind: prepared.sourceKind, sourceFingerprint, planFingerprint, counts, issues,
    canExecute: !prepared.fatal && prepared.entities.length > 0 };
  const preview: MigrationPreview = { ...base, previewDigest: sha256(base) };
  return { preview, entities: prepared.entities, disposition, hashes };
}

export async function previewMigration(workspaceId: string, raw: RawBrowserSnapshot, includeIds: string[] = []): Promise<MigrationPreview> {
  return prisma.$transaction(async (tx) => (await plan(tx, workspaceId, raw, includeIds)).preview);
}

export async function executeMigration(
  workspaceId: string, raw: RawBrowserSnapshot, includeIds: string[], expectedDigest: string,
): Promise<MigrationResult> {
  if (!/^[a-f0-9]{64}$/.test(expectedDigest)) throw new ApiError(400, "请先完成服务器预览。 ");
  const sourceFingerprint = sha256(raw);
  const planFingerprint = sha256(includeIds);
  const unique = { workspaceId_sourceFingerprint_planFingerprint: { workspaceId, sourceFingerprint, planFingerprint } };
  const existing = await prisma.migrationBatch.findUnique({ where: unique });
  if (existing?.status === "COMPLETED" || existing?.status === "PARTIAL") {
    const rerun = await prisma.$transaction(async (tx) => plan(tx, workspaceId, raw, includeIds));
    if (Object.values(rerun.preview.counts).some((count) => count.conflict)) {
      throw new ApiError(409, "已执行批次的服务器记录发生变化；请查看新预览中的冲突。");
    }
    return readMigrationResult(workspaceId, existing.id);
  }
  const planned = await prisma.$transaction(async (tx) => plan(tx, workspaceId, raw, includeIds));
  if (!planned.preview.canExecute) throw new ApiError(422, "原始快照存在无法安全处理的问题，不能执行。 ");
  if (planned.preview.previewDigest !== expectedDigest) throw new ApiError(409, "来源或服务器状态已变化，请重新预览。 ");
  if (existing?.status === "RUNNING" && Date.now() - existing.createdAt.getTime() < 120_000) {
    throw new ApiError(409, "同一迁移批次正在执行。");
  }
  const batch = existing ? await prisma.migrationBatch.update({ where: { id: existing.id }, data: { status: "RUNNING" } }) :
    await prisma.migrationBatch.create({ data: { workspaceId, sourceFingerprint, planFingerprint,
      sourceKind: planned.preview.sourceKind, status: "RUNNING", rawSource: json(raw),
      sourceCounts: json(planned.preview.counts), issues: json(planned.preview.issues) } });

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await plan(tx, workspaceId, raw, includeIds);
      if (current.preview.previewDigest !== expectedDigest) throw new ApiError(409, "服务器状态已变化，请重新预览。 ");
      const imported: MigrationEntity[] = [];
      for (const entity of current.entities) {
        const key = keyOf(entity);
        const status = current.disposition.get(key);
        const hash = current.hashes.get(key);
        if (!hash) throw new Error(`Missing source hash for ${key}`);
        if (status === "pending" || status === "conflict") {
          await tx.migrationPending.create({ data: { workspaceId, batchId: batch.id,
            collection: entity.collection, sourceId: entity.id, sourceOrdinal: entity.sourceOrdinal,
            payload: json(entity.payload), sourceHash: hash,
            reasons: json(current.preview.issues.filter((issue) => issue.collection === entity.collection && issue.sourceId === entity.id)) } });
          continue;
        }
        if (status !== "write") continue;
        const row = await insertMigrationRow(tx, workspaceId, batch.id, entity, hash);
        await tx.migrationEntityMap.create({ data: { workspaceId, collection: entity.collection,
          sourceId: entity.id, targetModel: entity.collection, targetId: entity.id,
          sourceHash: hash, serverVersion: row.version, serverUpdatedAt: row.updatedAt, batchId: batch.id } });
        imported.push(entity);
      }
      for (const entity of imported) {
        const hash = current.hashes.get(keyOf(entity));
        if (!hash) throw new Error("Source hash disappeared during verification.");
        await verifyMigrationRow(tx, workspaceId, entity, hash);
        for (const relation of entity.relations) {
          if (!await readMigrationRow(tx, workspaceId, relation.collection, relation.id)) {
            throw new Error(`关联核对失败：${entity.collection}:${entity.id} → ${relation.collection}:${relation.id}`);
          }
        }
      }
      for (const collection of MIGRATION_COLLECTIONS) {
        const count = current.preview.counts[collection];
        if (count.source !== count.written + count.skipped + count.conflict + count.pending ||
          await countRowsFromBatch(tx, workspaceId, batch.id, collection) !== count.written) {
          throw new Error(`${collection} 来源数与数据库写入数核对失败。`);
        }
      }
      const unresolved = Object.values(current.preview.counts).some((count) => count.conflict || count.pending) ||
        current.preview.issues.some((issue) => issue.collection === "snapshot");
      const result: MigrationResult = { ...current.preview, batchId: batch.id,
        status: unresolved ? "PARTIAL" : "COMPLETED", verifiedAt: new Date().toISOString() };
      await tx.migrationBatch.update({ where: { id: batch.id }, data: { status: result.status,
        result: json(result), issues: json(result.issues), completedAt: new Date(result.verifiedAt) } });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60_000 });
  } catch (error: unknown) {
    await prisma.migrationBatch.update({ where: { id: batch.id }, data: { status: "FAILED" } });
    throw error;
  }
}

export async function readMigrationResult(workspaceId: string, batchId: string): Promise<MigrationResult> {
  const batch = await prisma.migrationBatch.findFirst({ where: { id: batchId, workspaceId } });
  if (!batch || !batch.result) throw new ApiError(404, "迁移批次不存在或尚未完成核对。 ");
  const result = batch.result as unknown as MigrationResult;
  const actual = await prisma.$transaction(async (tx) => Promise.all(MIGRATION_COLLECTIONS.map(async (collection) =>
    [collection, await countRowsFromBatch(tx, workspaceId, batchId, collection)] as const)));
  for (const [collection, count] of actual) {
    if (result.counts[collection].written !== count) throw new ApiError(409, `${collection} 数据库数量与批次结果不一致。`);
  }
  return result;
}
