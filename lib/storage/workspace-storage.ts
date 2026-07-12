import type { WorkspaceBackup, WorkspaceData } from "@/types/workspace";

export const WORKSPACE_STORAGE_KEY = "cdc-workspace-data-v3";
export const LEGACY_WORKSPACE_STORAGE_KEY = "cdc-workspace-data-v2";

function readStorageKey(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readWorkspaceStorage(): string | null {
  return readStorageKey(WORKSPACE_STORAGE_KEY);
}

export function readLegacyWorkspaceStorage(): string | null {
  return readStorageKey(LEGACY_WORKSPACE_STORAGE_KEY);
}

export function writeWorkspaceStorage(data: WorkspaceData): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function removeWorkspaceStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in strict browser privacy modes.
  }
}

export function removeLegacyWorkspaceStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in strict browser privacy modes.
  }
}

export function createWorkspaceBackup(data: WorkspaceData, now = new Date()): WorkspaceBackup {
  return {
    app: "CDC AI Workspace",
    schemaVersion: data.metadata.schemaVersion,
    exportedAt: now.toISOString(),
    data,
  };
}
