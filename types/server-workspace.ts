import type { ContentItem } from "@/types/content";
import type { MigrationCollection } from "@/types/migration";
import type { WorkspaceDomainState } from "@/types/workspace";

export type ContentFlags = Pick<ContentItem,
  "status" | "isFavorite" | "isInKnowledgeBase" | "isInStudyPlan">;

export interface ServerWorkspaceSnapshot {
  domain: WorkspaceDomainState;
  contentStates: Record<string, ContentFlags>;
  versions: Record<string, number>;
  migrationBatchCount: number;
  hasServerRecords: boolean;
}

export interface EntityMutationResult {
  collection: MigrationCollection;
  id: string;
  item?: Record<string, unknown>;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}
