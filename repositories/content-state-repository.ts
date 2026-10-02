import { localStorageAdapter } from "@/repositories/local-storage-adapter";
import type { StorageAdapter } from "@/repositories/storage-adapter";
import type { ContentStatus, PersistedContentState } from "@/types/content";

export const CONTENT_STATE_STORAGE_KEY = "cdc-content-state-v1";

const contentStatuses: ContentStatus[] = [
  "unprocessed", "watchLater", "summarized", "favorite", "completed",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPersistedContentState(value: unknown): value is PersistedContentState {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.items)) return false;
  return Object.values(value.items).every((entry) =>
    isRecord(entry) &&
    typeof entry.status === "string" && contentStatuses.some((status) => status === entry.status) &&
    typeof entry.isFavorite === "boolean" &&
    typeof entry.isInKnowledgeBase === "boolean" &&
    typeof entry.isInStudyPlan === "boolean",
  );
}

export interface ContentStateRepository {
  read(): Promise<PersistedContentState | null>;
  write(state: PersistedContentState): Promise<boolean>;
  remove(): Promise<void>;
}

export function createContentStateRepository(storage: StorageAdapter): ContentStateRepository {
  return {
    async read() {
      const raw = await storage.getItem(CONTENT_STATE_STORAGE_KEY);
      if (!raw) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isPersistedContentState(parsed)) return parsed;
      } catch {
        // Invalid JSON uses the same recovery path as an invalid state shape.
      }
      await storage.removeItem(CONTENT_STATE_STORAGE_KEY);
      return null;
    },
    write: (state) => storage.setItem(CONTENT_STATE_STORAGE_KEY, JSON.stringify(state)),
    remove: () => storage.removeItem(CONTENT_STATE_STORAGE_KEY),
  };
}

export const localContentStateRepository = createContentStateRepository(localStorageAdapter);
