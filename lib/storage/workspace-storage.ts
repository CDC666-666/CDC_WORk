import type { WorkspaceBackup, WorkspaceData } from "@/types/workspace";

export const WORKSPACE_STORAGE_KEY = "cdc-workspace-data-v2";

export function readWorkspaceStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  } catch {
    return null;
  }
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

export function createWorkspaceBackup(data: WorkspaceData, now = new Date()): WorkspaceBackup {
  return {
    app: "CDC AI Workspace",
    schemaVersion: data.metadata.schemaVersion,
    exportedAt: now.toISOString(),
    data,
  };
}
