import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { isWorkspaceDomainState } from "@/lib/storage/domain-validation";
import { assertDomainReferences, assertProjectDeletionAllowed, findBrokenDomainReferences } from "@/lib/storage/domain-relations";
import { LEGACY_TASK_STORAGE_KEY, mergeWorkspaceV3IntoDomain, migrateLegacyTaskState,
  migrateWorkspaceV2, migrateWorkspaceV3, projectDomainToWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { normalizeWorkspaceData } from "@/lib/storage/workspace-normalization";
import { isWorkspaceData, isWorkspaceDataV2 } from "@/lib/storage/workspace-validation";
import { localStorageAdapter } from "@/repositories/local-storage-adapter";
import type { StorageAdapter } from "@/repositories/storage-adapter";
import type { WorkspaceData, WorkspaceDomainState, WorkspaceLoadResult } from "@/types/workspace";

export const WORKSPACE_STORAGE_KEY = "cdc-workspace-data-v4";
export const LEGACY_WORKSPACE_V3_STORAGE_KEY = "cdc-workspace-data-v3";
export const LEGACY_WORKSPACE_STORAGE_KEY = "cdc-workspace-data-v2";
export const WORKSPACE_RECOVERY_KEY = "cdc-workspace-data-v4-invalid-backup";

/** The v3 facade keeps existing pages working while v4 is the persisted source. */
export interface WorkspaceRepository {
  load(): Promise<WorkspaceLoadResult>;
  save(data: WorkspaceData): Promise<boolean>;
  reset(): Promise<WorkspaceData>;
  loadDomain(): Promise<WorkspaceDomainState>;
  updateDomain(change: (current: WorkspaceDomainState) => WorkspaceDomainState): Promise<WorkspaceDomainState>;
  replaceDomain(data: WorkspaceDomainState): Promise<WorkspaceData>;
}

interface DomainLoadResult {
  data: WorkspaceDomainState;
  recoveryKind: WorkspaceLoadResult["recoveryKind"];
  message: string | null;
}

function mergeUiCollection<T extends { id: string }>(before: T[], incoming: T[], latest: T[]): T[] {
  const previous = new Map(before.map((item) => [item.id, item]));
  const edits = new Map(incoming.map((item) => [item.id, item]));
  const current = new Set(latest.map((item) => item.id));
  const merged = latest.flatMap((item) => {
    const old = previous.get(item.id);
    if (!old) return [item]; // Domain-created after the UI snapshot.
    const edit = edits.get(item.id);
    if (!edit) return []; // Explicit deletion from the old page wins.
    const result = { ...item } as Record<string, unknown>;
    const base = old as Record<string, unknown>;
    const changed = edit as Record<string, unknown>;
    for (const key of new Set([...Object.keys(base), ...Object.keys(changed)])) {
      if (JSON.stringify(base[key]) === JSON.stringify(changed[key])) continue;
      if (Object.hasOwn(changed, key)) result[key] = changed[key];
      else delete result[key];
    }
    return [result as T];
  });
  // A record present in the old snapshot but absent from the domain was deleted there.
  return [...merged, ...incoming.filter((item) => !previous.has(item.id) && !current.has(item.id))];
}

export function createWorkspaceRepository(storage: StorageAdapter): WorkspaceRepository {
  let pending: Promise<void> = Promise.resolve();
  let cached: WorkspaceDomainState | null = null;
  let lastUiProjection: WorkspaceData | null = null;
  let blockedWrites = false;

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    pending = result.then(() => undefined, () => undefined);
    return result;
  }

  const write = (data: WorkspaceDomainState) => storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(data));

  async function readDomain(): Promise<DomainLoadResult> {
    if (cached) return { data: cached, recoveryKind: null, message: null };
    const rawV4 = await storage.getItem(WORKSPACE_STORAGE_KEY);
    if (rawV4) {
      try {
        const parsed: unknown = JSON.parse(rawV4);
        if (isWorkspaceDomainState(parsed)) {
          cached = parsed;
          return { data: cached, recoveryKind: null, message: null };
        }
      } catch {
        // Continue to an earlier valid version.
      }
      if (!(await storage.setItem(WORKSPACE_RECOVERY_KEY, rawV4))) blockedWrites = true;
    }

    const rawV3 = await storage.getItem(LEGACY_WORKSPACE_V3_STORAGE_KEY);
    if (rawV3) {
      try {
        const parsed: unknown = JSON.parse(rawV3);
        if (isWorkspaceData(parsed)) {
          const migrated = migrateWorkspaceV3(parsed);
          const saved = !blockedWrites && await write(migrated);
          cached = migrated;
          return { data: migrated, recoveryKind: "migration", message: saved
            ? rawV4
              ? "v4 数据无效，已从保留的 v3 副本恢复；迁移后新增的记录可能需要从备份恢复。"
              : "Workspace v3 数据已迁移到本地 schema v4；旧数据仍保留。"
            : "v3 数据已在内存中升级，但 v4 保存失败；旧数据仍保留。" };
        }
      } catch {
        // Keep the old key untouched.
      }
    }

    const rawV2 = await storage.getItem(LEGACY_WORKSPACE_STORAGE_KEY);
    if (rawV2) {
      try {
        const parsed: unknown = JSON.parse(rawV2);
        if (isWorkspaceDataV2(parsed)) {
          const migrated = migrateWorkspaceV3(migrateWorkspaceV2(parsed));
          const saved = !blockedWrites && await write(migrated);
          if (saved) await storage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY);
          cached = migrated;
          return { data: migrated, recoveryKind: "migration", message: saved
            ? "Workspace v2 数据已迁移到本地 schema v4。"
            : "v2 数据已在内存中升级，但 v4 保存失败；旧数据仍保留。" };
        }
      } catch {
        // Keep the old key untouched.
      }
    }

    if (rawV4 || rawV3 || rawV2) {
      const demo = migrateWorkspaceV3(createInitialWorkspaceData());
      if (!blockedWrites) await write(demo);
      cached = demo;
      return { data: demo, recoveryKind: "invalid-data",
        message: rawV4
          ? "v4 数据格式无效，已加载演示数据；原文已保存在恢复键（若浏览器允许）。"
          : "旧版本地数据格式无效，已加载演示数据；旧键未删除。" };
    }

    const legacyTasks = await storage.getItem(LEGACY_TASK_STORAGE_KEY);
    const migrated = migrateWorkspaceV3(migrateLegacyTaskState(legacyTasks));
    const saved = await write(migrated);
    if (legacyTasks && saved) await storage.removeItem(LEGACY_TASK_STORAGE_KEY);
    cached = migrated;
    return { data: migrated, recoveryKind: legacyTasks ? "migration" : null,
      message: legacyTasks && !saved ? "旧任务状态已在内存中升级，但本地保存失败。" : null };
  }

  return {
    load: () => enqueue(async () => {
      const result = await readDomain();
      const data = normalizeWorkspaceData(projectDomainToWorkspaceV3(result.data));
      lastUiProjection = structuredClone(data);
      const issues = findBrokenDomainReferences(result.data);
      const warning = issues.length
        ? `检测到 ${issues.length} 处失效关联，记录已保留：${issues.slice(0, 2).join("；")}。请修复后再保存。`
        : null;
      return { ...result, data, message: [result.message, warning].filter(Boolean).join(" ") || null };
    }),
    save: (data) => enqueue(async () => {
      const current = (await readDomain()).data;
      const latest = projectDomainToWorkspaceV3(current);
      const normalized = normalizeWorkspaceData(data);
      if (lastUiProjection) {
        const incomingIds = new Set(normalized.projects.map((item) => item.id));
        for (const item of lastUiProjection.projects) {
          if (!incomingIds.has(item.id) && current.projects.some((project) => project.id === item.id)) {
            assertProjectDeletionAllowed(current, item.id);
          }
        }
      }
      const input = lastUiProjection ? {
        ...normalized,
        projects: mergeUiCollection(lastUiProjection.projects, normalized.projects, latest.projects),
        tasks: mergeUiCollection(lastUiProjection.tasks, normalized.tasks, latest.tasks),
      } : normalized;
      const next = mergeWorkspaceV3IntoDomain(input, current);
      assertDomainReferences(next);
      if (blockedWrites) return false;
      const saved = await write(next);
      if (saved) {
        cached = next;
        lastUiProjection = structuredClone(normalized);
      }
      return saved;
    }),
    loadDomain: () => enqueue(async () => structuredClone((await readDomain()).data)),
    updateDomain: (change) => enqueue(async () => {
      const current = structuredClone((await readDomain()).data);
      const next = change(current);
      if (!isWorkspaceDomainState(next)) throw new Error("领域数据结构无效，未保存。");
      assertDomainReferences(next);
      next.metadata.updatedAt = new Date().toISOString();
      if (blockedWrites || !(await write(next))) throw new Error("本地数据保存失败，领域更改未提交。");
      cached = next;
      return structuredClone(next);
    }),
    replaceDomain: (data) => enqueue(async () => {
      if (!isWorkspaceDomainState(data)) throw new Error("领域数据结构无效，未导入。");
      assertDomainReferences(data);
      if (blockedWrites || !(await write(data))) throw new Error("本地数据保存失败，未导入。");
      cached = structuredClone(data);
      lastUiProjection = projectDomainToWorkspaceV3(data);
      return structuredClone(lastUiProjection);
    }),
    reset: () => enqueue(async () => {
      const reset = migrateWorkspaceV3(createInitialWorkspaceData());
      blockedWrites = false;
      if (!(await write(reset))) throw new Error("恢复演示数据失败，本地保存不可用。");
      cached = reset;
      lastUiProjection = projectDomainToWorkspaceV3(reset);
      await storage.removeItem(LEGACY_WORKSPACE_V3_STORAGE_KEY);
      await storage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY);
      await storage.removeItem(LEGACY_TASK_STORAGE_KEY);
      await storage.removeItem(WORKSPACE_RECOVERY_KEY);
      return structuredClone(lastUiProjection);
    }),
  };
}

export const localWorkspaceRepository = createWorkspaceRepository(localStorageAdapter);
