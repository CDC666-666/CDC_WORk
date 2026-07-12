import type { StudyPlan, StudySession } from "@/types/learning";
import type { ReadingItem } from "@/types/reading";
import type { Task } from "@/types/task";

export const WORKSPACE_SCHEMA_VERSION = 2 as const;

export interface WorkspaceMetadata {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceData {
  tasks: Task[];
  studyPlans: StudyPlan[];
  studySessions: StudySession[];
  readingItems: ReadingItem[];
  metadata: WorkspaceMetadata;
}

export interface WorkspaceBackup {
  app: "CDC AI Workspace";
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  exportedAt: string;
  data: WorkspaceData;
}

export type WorkspaceRecoveryKind = "migration" | "invalid-data" | null;

export interface WorkspaceLoadResult {
  data: WorkspaceData;
  recoveryKind: WorkspaceRecoveryKind;
  message: string | null;
}

