import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import {
  LEGACY_TASK_STORAGE_KEY,
  migrateLegacyTaskState,
} from "@/lib/storage/workspace-migration";
import {
  readWorkspaceStorage,
  removeWorkspaceStorage,
  writeWorkspaceStorage,
} from "@/lib/storage/workspace-storage";
import {
  isWorkspaceBackup,
  isWorkspaceData,
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

    const fallback = createInitialWorkspaceData();
    writeWorkspaceStorage(fallback);
    return {
      data: fallback,
      recoveryKind: "invalid-data",
      message: "本地数据格式无效，已安全恢复为演示数据。你可以在设置中导入备份。",
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
  if (!isWorkspaceBackup(parsed)) {
    throw new Error("备份结构或 schema version 不受支持，未修改当前数据。");
  }
  return parsed;
}
