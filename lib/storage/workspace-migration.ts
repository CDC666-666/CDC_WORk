import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { isLegacyCompletedTaskIds } from "@/lib/storage/workspace-validation";
import type { WorkspaceData, WorkspaceDataV2 } from "@/types/workspace";

export const LEGACY_TASK_STORAGE_KEY = "cdc-dashboard-task-state-v1";

export function migrateWorkspaceV2(data: WorkspaceDataV2, now = new Date()): WorkspaceData {
  const defaults = createInitialWorkspaceData(now);
  return {
    ...defaults,
    tasks: data.tasks.map((task) => ({ ...task, tags: [...task.tags] })),
    studyPlans: data.studyPlans.map((plan) => ({ ...plan, tags: [...plan.tags] })),
    studySessions: data.studySessions.map((session) => ({ ...session })),
    readingItems: data.readingItems.map((item) => ({ ...item, tags: [...item.tags] })),
    metadata: {
      schemaVersion: 3,
      createdAt: data.metadata.createdAt,
      updatedAt: now.toISOString(),
    },
  };
}

export function migrateLegacyTaskState(rawValue: string | null, now = new Date()): WorkspaceData {
  const data = createInitialWorkspaceData(now);
  if (!rawValue) return data;

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!isLegacyCompletedTaskIds(parsed)) return data;
    const completedIds = new Set(parsed);
    const timestamp = now.toISOString();
    return {
      ...data,
      tasks: data.tasks.map((task) =>
        completedIds.has(task.id)
          ? { ...task, status: "已完成", completedAt: timestamp, updatedAt: timestamp }
          : task,
      ),
      metadata: { ...data.metadata, updatedAt: timestamp },
    };
  } catch {
    return data;
  }
}

