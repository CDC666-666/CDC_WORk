/** Only these browser keys contain application data; reading them never invokes a Repository load. */
export const RAW_STORAGE_KEYS = [
  "cdc-workspace-data-v4",
  "cdc-workspace-data-v3",
  "cdc-workspace-data-v2",
  "cdc-dashboard-task-state-v1",
  "cdc-workspace-data-v4-invalid-backup",
  "cdc-content-state-v1",
] as const;
export type RawStorageKey = typeof RAW_STORAGE_KEYS[number];
export type RawBrowserSnapshot = Record<RawStorageKey, string | null>;

export const WORKSPACE_COLLECTIONS = [
  "projects", "projectModules", "projectMilestones", "tasks", "engineeringLogs", "experiments",
  "knowledge", "skills", "skillEvidence", "timeline", "reviews", "attachments",
  "semesters", "courses", "chapters", "classSessions", "assignments", "exams",
  "studyPlans", "studySessions", "readingItems", "technicalIssues", "issueSolutions",
  "reports", "resumeMaterials", "calendarEvents", "financeTransactions",
] as const;
export const MIGRATION_COLLECTIONS = [...WORKSPACE_COLLECTIONS, "contentStates"] as const;
export type MigrationCollection = typeof MIGRATION_COLLECTIONS[number];
export type MigrationOrigin = "PERSONAL" | "DEMO" | "NEEDS_REVIEW";

export interface MigrationRelation {
  field: string;
  collection: MigrationCollection;
  id: string;
}

export interface MigrationEntity {
  collection: MigrationCollection;
  id: string;
  sourceOrdinal: number;
  payload: Record<string, unknown>;
  relations: MigrationRelation[];
  origin: MigrationOrigin;
  reasons: string[];
}

export interface MigrationCollectionCount {
  source: number;
  written: number;
  skipped: number;
  conflict: number;
  pending: number;
}

export interface MigrationIssue {
  collection: MigrationCollection | "snapshot";
  sourceId: string;
  code: "INVALID_SOURCE" | "AMBIGUOUS" | "DEMO" | "BROKEN_REFERENCE" |
    "SERVER_CONFLICT" | "SOURCE_CHANGED" | "INVALID_VALUE";
  message: string;
}

export type MigrationDisposition = "write" | "skip" | "conflict" | "pending";

export interface MigrationDependency {
  dependentKey: string;
  requiredKey: string;
  field: string;
  requiredOrigin: MigrationOrigin | null;
  requiredStatus: MigrationDisposition | "missing";
  satisfied: boolean;
}

export interface MigrationPreview {
  sourceKind: "v4" | "v3" | "v2" | "none";
  sourceFingerprint: string;
  planFingerprint: string;
  previewDigest: string;
  counts: Record<MigrationCollection, MigrationCollectionCount>;
  dependencies: MigrationDependency[];
  issues: MigrationIssue[];
  canExecute: boolean;
}

export interface MigrationResult extends MigrationPreview {
  batchId: string;
  status: "COMPLETED" | "PARTIAL";
  verifiedAt: string;
}
