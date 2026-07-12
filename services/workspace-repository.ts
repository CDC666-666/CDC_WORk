import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import {
  LEGACY_TASK_STORAGE_KEY,
  migrateLegacyTaskState,
  migrateWorkspaceV2,
} from "@/lib/storage/workspace-migration";
import {
  readLegacyWorkspaceStorage,
  readWorkspaceStorage,
  removeLegacyWorkspaceStorage,
  removeWorkspaceStorage,
  writeWorkspaceStorage,
} from "@/lib/storage/workspace-storage";
import {
  isWorkspaceBackup,
  isWorkspaceBackupV2,
  isWorkspaceData,
  isWorkspaceDataV2,
} from "@/lib/storage/workspace-validation";
import type { WorkspaceBackup, WorkspaceData, WorkspaceLoadResult } from "@/types/workspace";

export function loadWorkspaceData(): WorkspaceLoadResult {
  const rawWorkspace = readWorkspaceStorage();
  if (rawWorkspace) {
    try {
      const parsed: unknown = JSON.parse(rawWorkspace);
      if (isWorkspaceData(parsed)) {
        return { data: parsed, recoveryKind: null, message: null };
      }
    } catch {
      // Invalid data is handled by the explicit recovery result below.
    }

  }

  const rawV2 = readLegacyWorkspaceStorage();
  if (rawV2) {
    try {
      const parsedV2: unknown = JSON.parse(rawV2);
      if (isWorkspaceDataV2(parsedV2)) {
        const migrated = migrateWorkspaceV2(parsedV2);
        const wasSaved = writeWorkspaceStorage(migrated);
        if (wasSaved) removeLegacyWorkspaceStorage();
        return {
          data: migrated,
          recoveryKind: "migration",
          message: wasSaved
            ? "Sprint 2 本地数据已完整迁移到 Workspace schema v3。"
            : "数据已在内存中升级，但浏览器阻止了本地保存；旧数据仍保留。",
        };
      }
    } catch {
      // The legacy value is preserved and recovery continues safely.
    }
  }

  if (rawWorkspace || rawV2) {
    const fallback = createInitialWorkspaceData();
    writeWorkspaceStorage(fallback);
    return {
      data: fallback,
      recoveryKind: "invalid-data",
      message: "本地数据格式无效，旧数据未删除，当前已安全加载演示数据。",
    };
  }

  let legacyRaw: string | null = null;
  if (typeof window !== "undefined") {
    try {
      legacyRaw = window.localStorage.getItem(LEGACY_TASK_STORAGE_KEY);
    } catch {
      legacyRaw = null;
    }
  }
  const migrated = migrateLegacyTaskState(legacyRaw);
  const wasSaved = writeWorkspaceStorage(migrated);

  if (legacyRaw && wasSaved && typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(LEGACY_TASK_STORAGE_KEY);
    } catch {
      // The v2 data is already saved; a blocked cleanup is harmless.
    }
    return {
      data: migrated,
      recoveryKind: "migration",
      message: "旧版任务完成状态已迁移到 Sprint 2 统一数据。",
    };
  }

  return { data: migrated, recoveryKind: null, message: null };
}

export function saveWorkspaceData(data: WorkspaceData): void {
  writeWorkspaceStorage(data);
}

export function resetWorkspaceData(): WorkspaceData {
  removeWorkspaceStorage();
  removeLegacyWorkspaceStorage();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(LEGACY_TASK_STORAGE_KEY);
    } catch {
      // Storage may be unavailable in strict browser privacy modes.
    }
  }
  const resetData = createInitialWorkspaceData();
  writeWorkspaceStorage(resetData);
  return resetData;
}

export function parseWorkspaceBackup(rawValue: string): WorkspaceBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("文件不是有效的 JSON。请确认选择了 CDC Workspace 备份文件。");
  }
  if (isWorkspaceBackup(parsed)) return parsed;
  if (isWorkspaceBackupV2(parsed)) {
    return {
      app: "CDC AI Workspace",
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      data: migrateWorkspaceV2(parsed.data),
    };
  }
  throw new Error("备份结构或 schema version 不受支持，未修改当前数据。");
}
